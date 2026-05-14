# k6 完整教程

## 目录

1. [入门与安装](#1-入门与安装)
2. [TypeScript 支持](#2-typescript-支持)
3. [WebSocket 测试](#3-websocket-测试)
4. [多步骤测试（登录鉴权后获取数据）](#4-多步骤测试登录鉴权后获取数据)
5. [常用功能与配置](#5-常用功能与配置)
6. [测试类型与场景](#6-测试类型与场景)
7. [结果分析与阈值](#7-结果分析与阈值)
8. [CI/CD 集成](#8-cicd-集成)

---

## 1. 入门与安装

### 安装 k6

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
# 下载: https://github.com/grafana/k6/releases
```

### 快速开始

```javascript
// basic-test.js
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,           // 虚拟用户数
  duration: '30s',   // 持续时间
};

export default function () {
  http.get('https://your-api.com/endpoint');
  sleep(1);  // 模拟用户思考时间
}
```

运行测试：

```bash
k6 run basic-test.js
```

---

## 2. TypeScript 支持

k6 本身运行在 Go 引擎上，不原生支持 TypeScript，需要通过 bundler 转换。

### 方式一：使用 esbuild（推荐）

```bash
# 安装依赖
npm init -y
npm install --save-dev esbuild k6-esbuild-plugin @types/k6
```

```typescript
// esbuild.config.js
import esbuild from 'esbuild';
import k6Plugin from 'k6-esbuild-plugin';

esbuild.build({
  entryPoints: ['src/test.ts'],
  bundle: true,
  outfile: 'dist/test.js',
  plugins: [k6Plugin()],
  target: 'es2020',
  format: 'iife',
});
```

```typescript
// src/test.ts
import http from 'k6/http';
import { sleep } from 'k6';

interface User {
  id: number;
  name: string;
  email: string;
}

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

interface ResponseData {
  users: User[];
}

export default function (): void {
  const res = http.get('https://jsonplaceholder.typicode.com/users');
  
  // 类型安全的数据解析
  const data: ResponseData = res.json() as ResponseData;
  
  console.log(`Got ${data.users.length} users`);
  sleep(1);
}
```

运行：

```bash
node esbuild.config.js && k6 run dist/test.js
```

### 方式二：使用 Babel

```bash
npm install --save-dev @babel/core @babel/preset-typescript @babel/register
```

```javascript
// babel.config.js
module.exports = {
  presets: [
    '@babel/preset-typescript',
  ],
};
```

```typescript
// test.ts - 使用 babel-node 运行
import http from 'k6/http';

export const options = {
  vus: 5,
  duration: '10s',
};

export default function (): void {
  const res = http.get('https://httpbin.org/get');
  console.log(JSON.parse(res.body));
}
```

```bash
# 需要先将 TS 转成 JS 再运行
npx babel test.ts --out-file test.js && k6 run test.js
```

### 方式三：使用 k6-ts-template（社区模板）

```bash
npx degit benchmark-subject/k6-typescript-template my-k6-test
cd my-k6-test
npm install
npm run build
npm run test
```

---

## 3. WebSocket 测试

k6 内置 `k6/ws` 模块支持 WebSocket 测试。

### 基本 WebSocket 连接

```javascript
import ws from 'k6/ws';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const url = 'wss://echo.websocket.org';
  
  ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      console.log('WebSocket connected');
      socket.send('Hello, Server!');
    });

    socket.on('message', (data) => {
      console.log(`Received: ${data}`);
      // 验证收到的消息
      check(data, {
        'received message': (d) => d === 'Hello, Server!',
      });
    });

    socket.on('close', () => {
      console.log('WebSocket closed');
    });

    socket.on('error', (e) => {
      console.log(`WebSocket error: ${e.error()}`);
    });

    // 保持连接 5 秒
    socket.setTimeout(() => {
      socket.close();
    }, 5000);
  });

  sleep(1);
}
```

### 带心跳的 WebSocket 测试

```javascript
import ws from 'k6/ws';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '1m',
};

export default function () {
  const url = 'wss://your-websocket-server.com/ws';
  
  ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      // 发送认证消息
      socket.send(JSON.stringify({
        type: 'auth',
        token: 'your-auth-token',
      }));
    });

    socket.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        
        if (msg.type === 'auth_success') {
          console.log('Authentication successful');
        } else if (msg.type === 'heartbeat') {
          socket.send(JSON.stringify({ type: 'pong' }));
        } else if (msg.type === 'data') {
          // 处理业务数据
          check(msg, {
            'has data': (m) => m.data !== undefined,
          });
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });

    // 定时发送心跳
    socket.setInterval(() => {
      socket.send(JSON.stringify({ type: 'ping' }));
    }, 30000);

    socket.setTimeout(() => {
      socket.close();
    }, 55000);
  });

  sleep(1);
}
```

### 多个 WebSocket 连接测试

```javascript
import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  vus: 50,  // 模拟 50 个并发连接
  duration: '1m',
};

export default function () {
  const url = `wss://your-server.com/ws/room-${__VU}`;
  
  ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      console.log(`VU ${__VU} connected`);
    });

    socket.on('message', (data) => {
      check(data, {
        'message received': () => data.length > 0,
      });
    });

    socket.on('close', () => {
      console.log(`VU ${__VU} disconnected`);
    });

    // 每个连接持续 30 秒
    socket.setTimeout(() => {
      socket.close();
    }, 30000);
  });
}
```

---

## 4. 多步骤测试（登录鉴权后获取数据）

这是实际场景中最常见的需求：先登录获取 token，再用 token 请求业务数据。

### 场景：用户登录 → 获取用户信息 → 获取订单列表

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

// 模拟用户账号
const users = [
  { username: 'user1', password: 'pass1' },
  { username: 'user2', password: 'pass2' },
  { username: 'user3', password: 'pass3' },
];

// 每个 VU 分配一个用户
function getUser() {
  const index = __VU % users.length;
  return users[index];
}

export default function () {
  const user = getUser();
  let token = null;

  // ========== 步骤 1: 登录 ==========
  const loginRes = http.post('https://your-api.com/api/login', 
    JSON.stringify({
      username: user.username,
      password: user.password,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
  });

  if (loginRes.status === 200) {
    try {
      token = loginRes.json('token');
    } catch (e) {
      console.error('Failed to parse login response');
    }
  }

  // 登录失败则跳过后续步骤
  if (!token) {
    sleep(1);
    return;
  }

  // ========== 步骤 2: 获取用户资料 ==========
  const profileRes = http.get('https://your-api.com/api/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  check(profileRes, {
    'profile status 200': (r) => r.status === 200,
    'profile has username': (r) => r.json('username') !== undefined,
  });

  // ========== 步骤 3: 获取订单列表 ==========
  const ordersRes = http.get('https://your-api.com/api/orders?page=1&size=20', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  check(ordersRes, {
    'orders status 200': (r) => r.status === 200,
    'orders is array': (r) => Array.isArray(r.json('data')),
  });

  sleep(1);
}
```

### 使用 session 共享状态

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // 场景 1: 登录一次
    login_scenario: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 10,
      maxDuration: '2m',
    },
  },
};

// 创建共享的 token 存储
const tokens = {};

export async function handleSummary(data) {
  // 测试结束后清理
  return {
    stdout: JSON.stringify(data),
  };
}

// 默认函数（可用于其他 API 测试）
export default function () {
  const token = tokens[__VU];
  if (!token) return;

  const res = http.get('https://your-api.com/api/data', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  check(res, { 'data fetched': (r) => r.status === 200 });
  sleep(1);
}

// 使用 init 初始化 tokens（每个 VU 启动时执行一次）
export function init() {
  // 为当前 VU 预登录
  const user = `user${__VU}`;
  const loginRes = http.post('https://your-api.com/api/login',
    JSON.stringify({ username: user, password: 'password' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status === 200) {
    tokens[__VU] = loginRes.json('token');
  }
}
```

### 使用 Request Context 传递数据

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

// 使用 tags 标记不同步骤
export default function () {
  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'login' },
  };

  // Step 1: Login
  const loginRes = http.post('https://api.example.com/login',
    JSON.stringify({ username: 'testuser', password: 'testpass' }),
    params
  );

  check(loginRes, { 'login successful': (r) => r.status === 200 });

  const token = loginRes.json('access_token');
  const authParams = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    tags: { name: 'getData' },
  };

  // Step 2: Get protected data
  const dataRes = http.get('https://api.example.com/protected/data', authParams);

  check(dataRes, { 'data retrieved': (r) => r.status === 200 });

  // Step 3: Post new data
  const postRes = http.post('https://api.example.com/protected/data',
    JSON.stringify({ item: 'test', value: 123 }),
    authParams
  );

  check(postRes, { 'data posted': (r) => r.status === 201 });

  sleep(1);
}
```

---

## 5. 常用功能与配置

### 5.1 环境变量

```javascript
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

// 使用 __ENV 访问环境变量
const BASE_URL = __ENV.API_BASE_URL || 'https://default-api.com';
const API_KEY = __ENV.API_KEY;

export default function () {
  const res = http.get(`${BASE_URL}/endpoint`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });
  
  sleep(1);
}
```

运行：

```bash
k6 run -e API_BASE_URL=https://custom-api.com -e API_KEY=secret test.js
```

### 5.2 全局设置与配置

```javascript
export const options = {
  // 基础配置
  vus: 100,                    // 虚拟用户数
  duration: '5m',              // 持续时间 (30s, 1m, 5m, 1h)
  
  // 预热
  stages: [
    { duration: '30s', target: 20 },   // 30秒内从0增加到20用户
    { duration: '2m', target: 100 },   // 2分钟内增加到100用户
    { duration: '1m', target: 0 },     // 1分钟内降为0
  ],

  // 阈值
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 响应时间
    http_req_failed: ['rate<0.01'],                    // 错误率
    http_reqs: ['rate>100'],                           // 每秒请求数
  },

  // 标签
  tags: {
    env: 'staging',
    version: 'v1.2.3',
  },

  // 日志级别
  logLevel: 'info',  // debug, info, warn, error

  // 不跟踪的 URL（减少开销）
  noTracing: true,
};
```

### 5.3 请求批处理

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  // 并行发送多个请求
  const responses = http.batch([
    ['GET', 'https://api.example.com/users'],
    ['GET', 'https://api.example.com/products'],
    ['GET', 'https://api.example.com/orders'],
    ['POST', 'https://api.example.com/logs', JSON.stringify({ event: 'page_view' })],
  ]);

  // 批量检查
  check(responses[0], { 'users status 200': (r) => r.status === 200 });
  check(responses[1], { 'products status 200': (r) => r.status === 200 });
  check(responses[2], { 'orders status 200': (r) => r.status === 200 });

  sleep(1);
}
```

### 5.4 自定义指标

```javascript
import http from 'k6/http';
import { Trend, Rate, Counter, Gauge } from 'k6/metrics';
import { sleep } from 'k6';

// 创建自定义指标
const myRequestDuration = new Trend('my_request_duration');
const myErrorRate = new Rate('my_error_rate');
const myRequestCount = new Counter('my_request_count');
const myResponseSize = new Gauge('my_response_size');

export const options = {
  vus: 10,
  duration: '30s',
  
  thresholds: {
    'my_request_duration': ['p(95)<300'],
    'my_error_rate': ['rate<0.05'],
  },
};

export default function () {
  const res = http.get('https://api.example.com/data');
  
  // 记录请求时长
  myRequestDuration.add(res.timings.duration);
  
  // 记录错误率
  const isError = res.status >= 400;
  myErrorRate.add(isError);
  
  // 计数器
  myRequestCount.add(1);
  
  // 计量器
  myResponseSize.add(res.body.length);

  sleep(1);
}
```

### 5.5 请求分组

```javascript
import http from 'k6/http';
import { group, check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  
  thresholds: {
    'group_duration{group:::auth}': ['p(95)<200'],
    'group_duration{group:::browse}': ['p(95)<500'],
    'group_duration{group:::purchase}': ['p(95)<300'],
  },
};

export default function () {
  // Auth 流程
  group('auth', function () {
    const login = http.post('https://api.example.com/login', 
      JSON.stringify({ user: 'test', pass: '123' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(login, { 'logged in': (r) => r.status === 200 });
  });

  // Browse 流程
  group('browse', function () {
    const products = http.get('https://api.example.com/products');
    check(products, { 'got products': (r) => r.status === 200 });
    
    const detail = http.get('https://api.example.com/products/1');
    check(detail, { 'got detail': (r) => r.status === 200 });
  });

  // Purchase 流程
  group('purchase', function () {
    const cart = http.post('https://api.example.com/cart',
      JSON.stringify({ productId: 1, qty: 2 })
    );
    check(cart, { 'added to cart': (r) => r.status === 201 });
    
    const checkout = http.post('https://api.example.com/checkout');
    check(checkout, { 'checked out': (r) => r.status === 200 });
  });

  sleep(1);
}
```

---

## 6. 测试类型与场景

### 6.1 Smoke Test（冒烟测试）

```javascript
// smoke.js - 最小负载，确认脚本能跑通
export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // 放宽阈值
  },
};

export default function () {
  // 测试逻辑
}
```

### 6.2 Load Test（负载测试）

```javascript
// load.js - 正常预期负载
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // 2分钟预热到100用户
    { duration: '5m', target: 100 },   // 5分钟保持100用户
    { duration: '2m', target: 0 },     // 2分钟降为0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};
```

### 6.3 Stress Test（压力测试）

```javascript
// stress.js - 超过正常负载，测试极限
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '5m', target: 300 },
    { duration: '5m', target: 500 },   // 超过预期峰值
    { duration: '5m', target: 0 },
  ],
};
```

### 6.4 Spike Test（峰值测试）

```javascript
// spike.js - 突然大幅增加负载
export const options = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '1m', target: 1000 },  // 突然 10x
    { duration: '10s', target: 100 },
  ],
};
```

### 6.5 Soak Test（浸泡测试）

```javascript
// soak.js - 长时间持续负载
export const options = {
  vus: 100,
  duration: '24h',       // 运行 24 小时
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.001'],  // 极低错误率
  },
};
```

---

## 7. 结果分析与阈值

### 7.1 阈值配置

```javascript
export const options = {
  thresholds: {
    // HTTP 指标
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95%请求<500ms, 99%<1s
    http_req_failed: ['rate<0.01'],                   // 错误率<1%
    http_reqs: ['rate>100'],                          // 每秒>100请求

    // 自定义指标
    my_custom_metric: ['avg<100'],

    // 分组指标
    'group_duration{group:::api}': ['p(95)<300'],
    
    // 带 abortOnFail
    http_req_duration: [{
      threshold: 'p(95)<500',
      abortOnFail: true,       // 超阈值时停止测试
      delayAbortEval: '10s',   // 10秒后才评估
    }],
  },
};
```

### 7.2 输出格式

```bash
# 控制台输出（默认）
k6 run test.js

# JSON 输出（适合程序解析）
k6 run --out json=results.json

# InfluxDB + Grafana
k6 run --out influxdb=http://localhost:8086/k6

# Prometheus
k6 run --out prometheus=prometheus:9090

# CSV
k6 run --out csv=results.csv
```

### 7.3 Cloud 执行

```bash
# 上传到 k6 Cloud
k6 login cloud
k6 run -o cloud test.js

# 使用云端配置
k6 run -o cloud --vus 100 --duration 5m test.js

# 从云端加载配置
k6 cloud test.js
```

---

## 8. CI/CD 集成

### GitHub Actions

```yaml
# .github/workflows/k6.yml
name: k6 Load Test

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点

jobs:
  k6-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup k6
        uses: grafana/k6-action@v0.2.0
        
      - name: Run k6 smoke test
        run: k6 run smoke.js
        
      - name: Run k6 load test
        if: github.ref == 'refs/heads/main'
        run: k6 run load.js
        env:
          API_BASE_URL: ${{ secrets.API_BASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test

k6-test:
  image: grafana/k6:latest
  script:
    - k6 run smoke.js
    - k6 run load.js
  variables:
    K6_CLOUD_TOKEN: $K6_CLOUD_TOKEN
  only:
    - main
```

### Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent any
    stages {
        stage('Load Test') {
            steps {
                sh 'k6 run load.js'
            }
        }
    }
    post {
        always {
            junit 'results.xml'
        }
    }
}
```

---

## 常用命令速查

```bash
# 基本运行
k6 run test.js

# 指定 VUs 和 duration
k6 run -vus 100 -duration 30s test.js

# 使用环境变量
k6 run -e ENV=production test.js

# 使用云端执行
k6 cloud test.js

# 启用 Prometheus
k6 run --out prometheus=9090 test.js

# 使用分组/标签过滤输出
k6 run --console-metrics test.js

# 生成 HTML 报告（需要先安装）
# npm install -g k6-report-html
k6 run test.js | k6-to-junit-xml > results.xml
k6-to-influxdb results.json
```

---

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| TypeScript 不支持 | 使用 esbuild/babel 预编译 |
| 需要保持 cookie/session | 使用 `http.cookieJar()` 或在请求间共享 |
| 性能瓶颈 | 调整 `vus` 数量，或使用 `--max-iterations` |
| 测试大文件 | 使用 streaming，分块读取 |
| 认证失效 | 在 `init()` 中刷新 token，或使用 refresh token |