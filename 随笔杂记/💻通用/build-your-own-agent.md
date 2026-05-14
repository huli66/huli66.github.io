# 自建 Agent 实施手册（Python & Node.js 双路线）

> 目标：基于自有大模型 API key + 一台 4 核 24G ARM 服务器，从零搭建一个生产可用的个人 Agent。
> 涵盖：纯对话 → 工具调用 → 长期记忆 → MCP 扩展，四个阶段循序渐进。

---

## 路线选择建议

| 你的情况 | 推荐 |
|---------|------|
| 熟悉 Python，做数据/AI 相关 | **Python**（生态最全，LangGraph/LlamaIndex 最成熟） |
| 熟悉前端/Node，想全栈 JS | **Node.js + TypeScript**（Vercel AI SDK 体验非常好） |
| 想要类型安全、IDE 提示极致 | **Node.js + TypeScript** |
| 想要最丰富的库支持 | **Python** |

两条路线核心思路完全一样，只是 SDK 不同。**建议挑一个完成，不要两个都做。**

---

## 通用前置准备

无论选哪条路线，先把这些准备好：

### 1. 服务器初始化

```bash
# 系统更新
sudo apt update && sudo apt upgrade -y

# 装基础工具
sudo apt install -y git curl wget vim build-essential

# 装 Docker（推荐用 Docker 跑数据库/向量库）
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER  # 让当前用户能用 docker，需重新登录生效

# 装 Docker Compose
sudo apt install -y docker-compose-plugin
```

### 2. 防火墙配置

```bash
sudo ufw allow 22       # SSH
sudo ufw allow 80       # HTTP
sudo ufw allow 443      # HTTPS
sudo ufw enable
```

⚠️ **Oracle Cloud 特别注意**：除了系统 ufw，还要去 Oracle 控制台的 **VCN → Security List** 里开放对应端口，否则外部访问不了。这是 Oracle ARM 最常见的坑。

### 3. 反向代理 + HTTPS（Caddy）

```bash
# 装 Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy

# 配置 /etc/caddy/Caddyfile
# your-domain.com {
#     reverse_proxy localhost:8000
# }

sudo systemctl reload caddy
```

Caddy 会自动申请 Let's Encrypt 证书，比 Nginx 省事 10 倍。

### 4. 准备 API Key

- **大模型 API key**（你已有）
- **Embedding 模型**：可以复用大模型厂商的，或用本地的（后面会讲）
- **搜索 API**：[Tavily](https://tavily.com)（每月免费 1000 次，专为 LLM 设计）
- **Telegram Bot Token**（最省事的 Agent 前端，用 [@BotFather](https://t.me/BotFather) 创建）

---

# 🐍 Python 路线

## 技术栈

| 组件 | 选型 |
|------|------|
| 语言 | Python 3.11+ |
| Web 框架 | FastAPI |
| Agent 框架 | LangGraph（推荐）或 Pydantic AI |
| LLM SDK | OpenAI SDK（兼容大多数厂商） |
| 向量库 | Qdrant 或 sqlite-vec |
| 关系数据库 | PostgreSQL 或 SQLite |
| 包管理 | uv（推荐，比 pip 快几十倍）或 poetry |

### 环境初始化

```bash
# 装 uv（现代 Python 包管理器，强烈推荐）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 创建项目
mkdir my-agent && cd my-agent
uv init
uv add fastapi uvicorn openai python-dotenv pydantic
```

`.env` 文件：

```env
LLM_API_KEY=sk-your-key-here
LLM_BASE_URL=https://api.openai.com/v1   # 改成你的厂商地址
LLM_MODEL=gpt-4o-mini                     # 改成你的模型
```

---

## 阶段一：纯对话 Agent（约 1-2 天）

### 目标

- HTTP 接口接收用户消息
- 多轮对话，历史存 SQLite
- 流式输出

### 关键代码

`app.py`：

```python
import os
import sqlite3
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(
    api_key=os.getenv("LLM_API_KEY"),
    base_url=os.getenv("LLM_BASE_URL"),
)
MODEL = os.getenv("LLM_MODEL")

# 数据库初始化
def init_db():
    conn = sqlite3.connect("agent.db")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

class ChatRequest(BaseModel):
    session_id: str
    message: str

def load_history(session_id: str, limit: int = 20):
    conn = sqlite3.connect("agent.db")
    rows = conn.execute(
        "SELECT role, content FROM messages WHERE session_id=? ORDER BY id DESC LIMIT ?",
        (session_id, limit)
    ).fetchall()
    conn.close()
    return [{"role": r, "content": c} for r, c in reversed(rows)]

def save_message(session_id: str, role: str, content: str):
    conn = sqlite3.connect("agent.db")
    conn.execute(
        "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
        (session_id, role, content)
    )
    conn.commit()
    conn.close()

@app.post("/chat")
async def chat(req: ChatRequest):
    history = load_history(req.session_id)
    save_message(req.session_id, "user", req.message)
    
    messages = [
        {"role": "system", "content": "你是一个简洁高效的助手。"},
        *history,
        {"role": "user", "content": req.message}
    ]
    
    async def generate():
        full_response = ""
        stream = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            full_response += delta
            yield delta
        save_message(req.session_id, "assistant", full_response)
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

启动：

```bash
uv run uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### 常见问题

- **`base_url` 配错**：国内厂商通常是 `https://xxx.com/v1`，**注意末尾 `/v1`**，少了或多了 `/` 都会报 404
- **流式输出乱码**：SQLite 默认编码 OK，但前端如果用 `EventSource` 接收，需要按 SSE 格式发送 `data: xxx\n\n`，本例是裸文本流，前端用 `fetch + reader` 读取
- **ARM 上 SQLite 性能**：默认就行，但并发写多时建议开 WAL 模式：`conn.execute("PRAGMA journal_mode=WAL")`
- **历史无限增长**：上面代码只取最近 20 条，但单条可能很长。生产环境要做 **token 估算**和**摘要压缩**（见阶段三）

---

## 阶段二：工具调用 Agent（约 3-5 天）

### 目标

- Agent 能调用外部工具（搜索、查天气、读文件等）
- 使用 LangGraph 管理执行流程

### 关键代码

```bash
uv add langgraph langchain-openai tavily-python
```

`agent.py`：

```python
import os
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from tavily import TavilyClient

llm = ChatOpenAI(
    model=os.getenv("LLM_MODEL"),
    api_key=os.getenv("LLM_API_KEY"),
    base_url=os.getenv("LLM_BASE_URL"),
)

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

# 定义工具
@tool
def web_search(query: str) -> str:
    """搜索互联网信息。当用户问到最新事件、实时信息时使用。"""
    result = tavily.search(query=query, max_results=3)
    return "\n\n".join([r["content"] for r in result["results"]])

@tool
def get_current_time() -> str:
    """获取当前北京时间。"""
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone(timedelta(hours=8)))
    return now.strftime("%Y-%m-%d %H:%M:%S")

tools = [web_search, get_current_time]
llm_with_tools = llm.bind_tools(tools)

# 定义状态
class State(TypedDict):
    messages: Annotated[list, add_messages]

# 定义节点
def chatbot(state: State):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

# 构建图
graph_builder = StateGraph(State)
graph_builder.add_node("chatbot", chatbot)
graph_builder.add_node("tools", ToolNode(tools))
graph_builder.add_conditional_edges("chatbot", tools_condition)
graph_builder.add_edge("tools", "chatbot")
graph_builder.add_edge(START, "chatbot")

graph = graph_builder.compile()

# 使用
if __name__ == "__main__":
    state = {"messages": [{"role": "user", "content": "现在北京几点？深圳今天热不热？"}]}
    for event in graph.stream(state):
        for value in event.values():
            print(value["messages"][-1].content)
```

### 常见问题

- **模型不支持 tool calling**：必须用支持 Function Calling 的模型（GPT-4o、Claude 3.5+、DeepSeek、通义千问 Plus、Qwen-Max 等都支持）。一些小模型不支持就跑不通
- **工具描述写得不好**：工具的 docstring 就是给模型看的 prompt，**必须写清楚什么时候用**。"搜索"两个字模型不会主动用，但"当用户问最新事件时使用"它就懂
- **工具返回内容太长**：Tavily 返回的网页内容可能上万字，模型 context 会爆。要做截断或先用小模型摘要
- **死循环**：模型有时反复调用同一个工具。LangGraph 默认有递归限制（25 步），可以调整 `graph.invoke(state, {"recursion_limit": 10})`

---

## 阶段三：长期记忆（约 3-5 天）

### 目标

- 跨会话记住用户偏好和关键事实
- 长对话自动压缩

### 关键代码

```bash
uv add qdrant-client
docker run -d -p 6333:6333 -v $(pwd)/qdrant_data:/qdrant/storage qdrant/qdrant
```

`memory.py`：

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid
from openai import OpenAI

embed_client = OpenAI(api_key=os.getenv("LLM_API_KEY"), base_url=os.getenv("LLM_BASE_URL"))

qdrant = QdrantClient(host="localhost", port=6333)

# 初始化集合（只需运行一次）
def init_memory():
    qdrant.recreate_collection(
        collection_name="memories",
        vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
    )

def embed(text: str) -> list[float]:
    resp = embed_client.embeddings.create(
        model="text-embedding-3-small",  # 或你厂商的 embedding 模型
        input=text,
    )
    return resp.data[0].embedding

def add_memory(user_id: str, content: str):
    """存入一条记忆"""
    qdrant.upsert(
        collection_name="memories",
        points=[PointStruct(
            id=str(uuid.uuid4()),
            vector=embed(content),
            payload={"user_id": user_id, "content": content},
        )]
    )

def search_memory(user_id: str, query: str, top_k: int = 5) -> list[str]:
    """检索相关记忆"""
    results = qdrant.search(
        collection_name="memories",
        query_vector=embed(query),
        query_filter={"must": [{"key": "user_id", "match": {"value": user_id}}]},
        limit=top_k,
    )
    return [r.payload["content"] for r in results]

# 抽取记忆的 prompt
EXTRACT_PROMPT = """从下面这轮对话中，抽取需要长期记住的用户信息（偏好、个人事实、重要任务等）。
每条信息一行，如果没有值得记的，回复 NONE。

对话：
用户：{user_msg}
助手：{assistant_msg}

抽取结果："""

def maybe_extract_memory(user_id: str, user_msg: str, assistant_msg: str):
    resp = embed_client.chat.completions.create(
        model=os.getenv("LLM_MODEL"),
        messages=[{"role": "user", "content": EXTRACT_PROMPT.format(
            user_msg=user_msg, assistant_msg=assistant_msg
        )}],
    )
    text = resp.choices[0].message.content.strip()
    if text != "NONE":
        for line in text.split("\n"):
            line = line.strip()
            if line:
                add_memory(user_id, line)
```

把记忆注入对话：

```python
def build_messages_with_memory(user_id: str, history, current_msg):
    memories = search_memory(user_id, current_msg, top_k=5)
    memory_text = "\n".join(memories) if memories else "（无）"
    
    system = f"""你是用户的私人助手。
关于该用户的已知信息：
{memory_text}

请根据这些信息提供个性化回答。"""
    
    return [
        {"role": "system", "content": system},
        *history,
        {"role": "user", "content": current_msg}
    ]
```

### 常见问题

- **Embedding 维度不匹配**：不同模型维度不同（OpenAI text-embedding-3-small 是 1536，BGE-base 是 768）。`VectorParams(size=...)` 必须和模型一致，换模型就要重建集合
- **Embedding 费用**：每条消息都做 embedding 累计也不便宜。可以本地跑 [BGE-small](https://huggingface.co/BAAI/bge-small-zh-v1.5) 免费用，CPU 推理足够，几百 MB 内存
- **记忆质量差**：抽取 prompt 写得不好，会把"你好"也存进去。多调几遍 prompt，加上"只记录重要的、值得长期保留的信息"
- **记忆冲突**：用户先说"我喜欢咖啡"后说"我不喝咖啡了"，两条都存着。生产级需要做记忆合并/覆盖（参考 [Mem0](https://github.com/mem0ai/mem0) 的做法）

---

## 阶段四：接入 MCP（约 1-3 天）

### MCP 是什么

Model Context Protocol，Anthropic 推出的开放协议，把"工具/数据源"标准化暴露给 Agent。最大好处：**社区已经有几千个现成的 MCP server**（GitHub、Slack、PostgreSQL、文件系统、Puppeteer 浏览器等），不用自己写工具，直接接。

### 关键代码

```bash
uv add langchain-mcp-adapters
```

```python
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent

async def setup_mcp_agent():
    client = MultiServerMCPClient({
        "github": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-github"],
            "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": os.getenv("GITHUB_TOKEN")},
            "transport": "stdio",
        },
        "filesystem": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/notes"],
            "transport": "stdio",
        },
    })
    tools = await client.get_tools()
    agent = create_react_agent(llm, tools)
    return agent
```

### 常见问题

- **MCP server 启动失败**：大多数 MCP server 是 Node 写的，要先 `apt install nodejs npm`
- **stdio vs SSE**：本地工具用 `stdio`，远程的用 `sse`，配置不同
- **权限问题**：filesystem server 默认只能访问指定目录，路径要写对
- **ARM 兼容性**：极少数 MCP server（带 native 依赖的）在 ARM 上跑不起来，遇到时降级到 Docker 跑 x86 模拟（性能差）

---

# 🟢 Node.js 路线

## 技术栈

| 组件 | 选型 |
|------|------|
| 语言 | Node.js 20+ / TypeScript |
| Web 框架 | Hono（轻量）或 Express |
| Agent 框架 | Vercel AI SDK |
| 向量库 | Qdrant 或 sqlite-vec |
| 关系数据库 | better-sqlite3（同步 API 超快）或 PostgreSQL |
| 包管理 | pnpm |

### 环境初始化

```bash
# 装 Node（用 nvm）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 20

# 装 pnpm
npm install -g pnpm

# 创建项目
mkdir my-agent && cd my-agent
pnpm init
pnpm add hono @hono/node-server ai @ai-sdk/openai zod dotenv better-sqlite3
pnpm add -D typescript tsx @types/node @types/better-sqlite3
npx tsc --init
```

`.env`：

```env
LLM_API_KEY=sk-your-key-here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

`package.json` 加：

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "start": "tsx src/index.ts"
}
```

---

## 阶段一：纯对话 Agent

### 关键代码

`src/index.ts`：

```typescript
import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { stream } from 'hono/streaming'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import Database from 'better-sqlite3'

const openai = createOpenAI({
  apiKey: process.env.LLM_API_KEY!,
  baseURL: process.env.LLM_BASE_URL,
})

const db = new Database('agent.db')
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)
db.pragma('journal_mode = WAL')

function loadHistory(sessionId: string, limit = 20) {
  const rows = db.prepare(
    `SELECT role, content FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?`
  ).all(sessionId, limit) as { role: string, content: string }[]
  return rows.reverse().map(r => ({ role: r.role as 'user' | 'assistant', content: r.content }))
}

function saveMessage(sessionId: string, role: string, content: string) {
  db.prepare(
    `INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)`
  ).run(sessionId, role, content)
}

const app = new Hono()

app.post('/chat', async (c) => {
  const { session_id, message } = await c.req.json<{ session_id: string, message: string }>()
  
  const history = loadHistory(session_id)
  saveMessage(session_id, 'user', message)
  
  const result = streamText({
    model: openai(process.env.LLM_MODEL!),
    system: '你是一个简洁高效的助手。',
    messages: [...history, { role: 'user', content: message }],
    onFinish: ({ text }) => {
      saveMessage(session_id, 'assistant', text)
    },
  })
  
  return stream(c, async (s) => {
    for await (const chunk of result.textStream) {
      await s.write(chunk)
    }
  })
})

serve({ fetch: app.fetch, port: 8000 })
console.log('Agent running on http://localhost:8000')
```

启动：`pnpm dev`

### 常见问题

- **`better-sqlite3` 在 ARM 上装失败**：需要 `build-essential` 和 `python3`，前面已装。如果还失败，用 `bun` 或换成 `node-sqlite3`
- **TypeScript 报错 `Cannot find module`**：`tsconfig.json` 里 `moduleResolution` 设为 `"bundler"` 或 `"node16"`
- **`baseURL` 写法**：Vercel AI SDK 用 `baseURL`（驼峰），不是 `base_url`
- **流式响应卡顿**：检查 Caddy/Nginx 是否开了 buffering，要关掉 `flush_interval -1`（Caddy）或 `proxy_buffering off`（Nginx）

---

## 阶段二：工具调用 Agent

### 关键代码

```bash
pnpm add @tavily/core
```

`src/agent.ts`：

```typescript
import { generateText, tool, stepCountIs } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { tavily } from '@tavily/core'

const openai = createOpenAI({
  apiKey: process.env.LLM_API_KEY!,
  baseURL: process.env.LLM_BASE_URL,
})

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! })

const tools = {
  webSearch: tool({
    description: '搜索互联网信息。当用户问到最新事件、实时信息时使用。',
    inputSchema: z.object({
      query: z.string().describe('搜索关键词'),
    }),
    execute: async ({ query }) => {
      const result = await tvly.search(query, { maxResults: 3 })
      return result.results.map(r => r.content).join('\n\n')
    },
  }),
  
  getCurrentTime: tool({
    description: '获取当前北京时间。',
    inputSchema: z.object({}),
    execute: async () => {
      return new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    },
  }),
}

export async function runAgent(messages: Array<{ role: 'user' | 'assistant', content: string }>) {
  const result = await generateText({
    model: openai(process.env.LLM_MODEL!),
    tools,
    stopWhen: stepCountIs(10),    // 防死循环
    messages,
  })
  return result.text
}

// 测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAgent([
    { role: 'user', content: '现在几点？北京今天天气怎么样？' }
  ]).then(console.log)
}
```

### 常见问题

- **`zod` 版本**：Vercel AI SDK 要求 zod v3 或 v4，注意 peer dep。装错版本会有奇怪报错
- **工具不被调用**：Vercel AI SDK 默认单步执行（不会自动连续调工具）。**必须设 `stopWhen: stepCountIs(N)`**，否则模型只能调一次工具就返回。这是 v5 之后的新 API
- **类型推断失败**：`tool({...})` 写法依赖 TS 类型推断，`inputSchema` 要用 `z.object()` 包一层，即使是空对象
- **流式 + 工具**：用 `streamText` 替代 `generateText`，加 `experimental_toolCallStreaming: true` 可以流式展示工具调用过程

---

## 阶段三：长期记忆

### 关键代码

```bash
pnpm add @qdrant/js-client-rest
docker run -d -p 6333:6333 -v $(pwd)/qdrant_data:/qdrant/storage qdrant/qdrant
```

`src/memory.ts`：

```typescript
import { QdrantClient } from '@qdrant/js-client-rest'
import { embed, generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { randomUUID } from 'crypto'

const openai = createOpenAI({
  apiKey: process.env.LLM_API_KEY!,
  baseURL: process.env.LLM_BASE_URL,
})

const qdrant = new QdrantClient({ url: 'http://localhost:6333' })

export async function initMemory() {
  await qdrant.recreateCollection('memories', {
    vectors: { size: 1536, distance: 'Cosine' },
  })
}

async function getEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  })
  return embedding
}

export async function addMemory(userId: string, content: string) {
  const vector = await getEmbedding(content)
  await qdrant.upsert('memories', {
    points: [{
      id: randomUUID(),
      vector,
      payload: { user_id: userId, content },
    }],
  })
}

export async function searchMemory(userId: string, query: string, topK = 5): Promise<string[]> {
  const vector = await getEmbedding(query)
  const results = await qdrant.search('memories', {
    vector,
    limit: topK,
    filter: { must: [{ key: 'user_id', match: { value: userId } }] },
  })
  return results.map(r => (r.payload as any).content)
}

export async function maybeExtractMemory(
  userId: string,
  userMsg: string,
  assistantMsg: string
) {
  const { text } = await generateText({
    model: openai(process.env.LLM_MODEL!),
    prompt: `从下面这轮对话中，抽取需要长期记住的用户信息。
每条信息一行，没有则回复 NONE。

用户：${userMsg}
助手：${assistantMsg}

抽取：`,
  })
  
  if (text.trim() === 'NONE') return
  for (const line of text.split('\n').map(s => s.trim()).filter(Boolean)) {
    await addMemory(userId, line)
  }
}
```

### 常见问题

- **Qdrant 客户端方法名变化**：Qdrant 1.10+ 的 JS 客户端 API 名称频繁变化，写代码时**查最新文档**，不要照着老教程抄
- **embedding 限流**：大量历史一次性 embedding 会触发 API 限流。生产环境要做批量 + 限速 + 重试

---

## 阶段四：接入 MCP

```bash
pnpm add ai @modelcontextprotocol/sdk
```

```typescript
import { experimental_createMCPClient as createMCPClient } from 'ai'
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio'

const githubMcp = await createMCPClient({
  transport: new StdioMCPTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN! },
  }),
})

const tools = await githubMcp.tools()

const result = await generateText({
  model: openai(process.env.LLM_MODEL!),
  tools,
  stopWhen: stepCountIs(10),
  prompt: '帮我看看我的 GitHub 仓库列表',
})

await githubMcp.close()
```

---

# 🚀 部署上线

无论 Python 还是 Node，部署套路一致：

## 方案一：systemd（最稳）

`/etc/systemd/system/my-agent.service`：

```ini
[Unit]
Description=My Agent
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/my-agent
ExecStart=/home/ubuntu/.local/bin/uv run uvicorn app:app --host 127.0.0.1 --port 8000
# Node 版本: ExecStart=/home/ubuntu/.nvm/versions/node/v20.x.x/bin/pnpm start
Restart=always
RestartSec=5
EnvironmentFile=/home/ubuntu/my-agent/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable my-agent
sudo systemctl start my-agent
sudo journalctl -u my-agent -f   # 看日志
```

## 方案二：Docker Compose（推荐）

`docker-compose.yml`：

```yaml
services:
  agent:
    build: .
    restart: always
    env_file: .env
    ports:
      - "127.0.0.1:8000:8000"
    depends_on:
      - qdrant
  
  qdrant:
    image: qdrant/qdrant
    restart: always
    volumes:
      - ./qdrant_data:/qdrant/storage
    ports:
      - "127.0.0.1:6333:6333"
```

## Caddy 反代

`/etc/caddy/Caddyfile`：

```
agent.your-domain.com {
    reverse_proxy 127.0.0.1:8000 {
        flush_interval -1    # 关键：支持流式输出
    }
}
```

---

# 📋 通用避坑清单

## Oracle ARM 服务器专项

1. **回收风险**：Oracle 免费 ARM 实例如果连续 7 天 CPU 利用率低于 20%，可能被回收。装个 cron 跑点轻度任务保活
2. **安全组**：除了系统 ufw，必须去 Oracle 控制台的 Security List 开放端口
3. **swap 默认没开**：24G 内存够用，但建议加 4G swap 防 OOM：
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
4. **包架构问题**：拉 Docker 镜像注意有没有 `arm64` 版本，少数老镜像只有 amd64，会自动 emulation 变慢

## LLM API 通用坑

1. **不同厂商兼容性**：虽然都号称"OpenAI 兼容"，但 function calling 实现差异大。建议优先选 GPT-4o / Claude / DeepSeek / 通义千问 Plus 这些验证过的
2. **超时**：长工具调用容易触发 60s 超时，client 端要把 timeout 调到 300s+
3. **流式输出在国内**：经过 CDN/网关可能被 buffer 掉，要确认链路全程支持流式
4. **token 计算**：不同模型 tokenizer 不同。OpenAI 用 `tiktoken`，国产模型要查厂商文档，超长上下文报错最常见

## Agent 设计通用坑

1. **System Prompt 过长**：把所有规则全塞 system，模型会忽略后面的。优先级排序 + 精简
2. **工具描述要写得像给同事看的文档**，不是给开发者看的注释。模型靠这个判断什么时候用
3. **错误处理**：工具执行失败时，**把错误信息也返回给模型**，让它决定重试还是换方案，不要 throw 让流程崩
4. **成本控制**：每个会话设上限（比如最多 30 步、5 万 token），防止意外死循环烧光额度
5. **日志一定要打**：每次 LLM 调用的 messages、tool calls、response 全部存下来，出问题才能复盘。生产级推荐 [Langfuse](https://langfuse.com) 自托管

---

# 📚 进阶学习资源

- **LangGraph 教程**：https://langchain-ai.github.io/langgraph/tutorials/
- **Vercel AI SDK 文档**：https://sdk.vercel.ai/docs
- **MCP 官方文档**：https://modelcontextprotocol.io
- **MCP Server 列表**：https://github.com/modelcontextprotocol/servers
- **Mem0（学习记忆系统设计）**：https://github.com/mem0ai/mem0
- **Awesome LLM Agents**：https://github.com/kaushikb11/awesome-llm-agents

---

# ✅ 建议的两周冲刺计划

| 时间 | Python 路线 | Node 路线 |
|------|------------|----------|
| Day 1-2 | 服务器配置 + 阶段一对话跑通 | 同左 |
| Day 3-4 | Telegram Bot 前端接入 | 同左 |
| Day 5-7 | 阶段二工具调用，加 2-3 个工具 | 同左 |
| Day 8-10 | 阶段三长期记忆 | 同左 |
| Day 11-12 | 阶段四 MCP，接入 GitHub/文件系统 | 同左 |
| Day 13-14 | 部署上线 + 监控 + 优化 prompt | 同左 |

**MVP 优先级**：阶段一 > Telegram 前端 > 阶段二（一个工具就行） > 部署上线 > 阶段三 > 阶段四。先把整条链路跑通，再迭代细节。

祝你早日拥有专属 Agent 🚀
