
```sh
npm install -g @anthropic-ai/claude-code

npm install -g @musistudio/claude-code-router
```

## Claude Code
/compact 压缩
/memory 记忆，CLAUDE.md

claude -c 继续上次的对话

claude -r 所有历史对话

/resume 历史对话

think
think hard
think harder
ultra think

## Claude Code Router

```sh
# start
ccr code

# restart when config updated
ccr restart

# read and edit config in browser
ccr ui

# read and edit config in terminal
ccr model
```


## MCP

[推荐的 mcp 工具](https://www.youtube.com/watch?v=UW5iQGE3264)

```sh
# context7 读取文档 ref 也行
claude mcp add --transport http context7 https://mcp.context7.com/mcp

# figma 读取设计稿
claude mcp add figma npx figma-developer-mcp

# chrome-devtools-mcp 操作浏览器
claude mcp add chrome-devtools npx chrome-devtools-mcp@latest --scope user

# shadcn mcp

```
