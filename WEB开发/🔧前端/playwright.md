# Playwright 详细文档

  

> 基于官方文档整理，版本 v1.x（Node.js / TypeScript）

  

---

  

## 目录

  

1. [概述](#1-概述)

2. [安装](#2-安装)

3. [核心概念](#3-核心概念)

4. [浏览器启动](#4-浏览器启动)

5. [BrowserContext（浏览器上下文）](#5-browsercontext浏览器上下文)

6. [Page（页面）](#6-page页面)

7. [导航与等待](#7-导航与等待)

8. [网络事件监听](#8-网络事件监听)

9. [Route API（网络拦截）](#9-route-api网络拦截)

10. [APIRequestContext（HTTP 请求）](#10-apirequestcontexthttp-请求)

11. [元素操作](#11-元素操作)

12. [截图与录像](#12-截图与录像)

13. [错误处理与超时](#13-错误处理与超时)

14. [常用模式速查](#14-常用模式速查)

  

---

  

## 1. 概述

  

Playwright 是微软开源的跨浏览器自动化框架，支持 Chromium、Firefox、WebKit，提供统一 API。

  

**核心特性：**

- 单 API 驱动三种浏览器引擎

- 自动等待（Auto-wait）：操作前自动等待元素可交互

- 网络拦截：可拦截、修改、阻断任意请求

- 隔离上下文：每个测试独立的 Cookie/Session

- headless 与 headed 两种运行模式

  

---

  

## 2. 安装

  

```bash

# 安装库

pnpm add playwright

  

# 安装浏览器二进制（Chromium / Firefox / WebKit）

pnpm exec playwright install

  

# 只安装 Chromium

pnpm exec playwright install chromium

```

  

---

  

## 3. 核心概念

  

```

Playwright

└── BrowserType (chromium | firefox | webkit)

└── Browser

└── BrowserContext ← 隔离的会话（Cookie、Storage）

└── Page ← 单个标签页

```

  

| 层级 | 说明 |

|------|------|

| `Browser` | 浏览器进程实例 |

| `BrowserContext` | 类似无痕窗口，Cookie/LocalStorage 完全隔离 |

| `Page` | 单个标签页，绑定在某个 Context 下 |

| `Route` | 网络请求拦截句柄 |

| `Request` / `Response` | 网络请求/响应对象 |

  

---

  

## 4. 浏览器启动

  

### 基本启动

  

```typescript

import { chromium, firefox, webkit } from 'playwright';

  

const browser = await chromium.launch();

// 或

const browser = await chromium.launch({

headless: false, // 显示浏览器窗口（默认 true）

slowMo: 100, // 每步操作延迟 100ms，便于调试

});

  

await browser.close();

```

  

### 启动选项（LaunchOptions）

  

| 选项 | 类型 | 默认值 | 说明 |

|------|------|--------|------|

| `headless` | boolean | `true` | 是否无头模式 |

| `slowMo` | number | `0` | 每步操作延迟（ms） |

| `timeout` | number | `30000` | 启动超时（ms） |

| `args` | string[] | `[]` | 传给浏览器的额外命令行参数 |

| `executablePath` | string | — | 指定浏览器可执行文件路径 |

| `proxy` | object | — | 代理设置 `{ server, username, password }` |

| `devtools` | boolean | `false` | 自动打开 DevTools（仅 headed 模式） |

  

---

  

## 5. BrowserContext（浏览器上下文）

  

BrowserContext 是完全隔离的会话，不同 Context 间 Cookie、LocalStorage、IndexedDB 互不影响。

  

### 创建 Context

  

```typescript

const context = await browser.newContext({

userAgent: 'Mozilla/5.0 ...',

viewport: { width: 1280, height: 720 },

locale: 'zh-CN',

timezoneId: 'Asia/Shanghai',

// 模拟移动设备

...devices['iPhone 13'],

});

```

  

### 常用 Context 选项

  

| 选项 | 说明 |

|------|------|

| `userAgent` | 自定义 UA 字符串 |

| `viewport` | 视口大小 `{ width, height }` |

| `locale` | 语言区域 |

| `timezoneId` | 时区 |

| `ignoreHTTPSErrors` | 忽略 HTTPS 证书错误 |

| `extraHTTPHeaders` | 为所有请求附加额外请求头 |

| `storageState` | 注入已有的 Cookie/LocalStorage |

  

### Context 级网络拦截

  

```typescript

// 对 Context 下所有页面生效

await context.route('**/*.{png,jpg}', route => route.abort());

```

  

### Context 级响应监听

  

```typescript

context.on('response', response => {

console.log(response.status(), response.url());

});

```

  

---

  

## 6. Page（页面）

  

```typescript

const page = await context.newPage();

```

  

### 常用 Page 方法

  

| 方法 | 说明 |

|------|------|

| `page.goto(url, options)` | 导航到指定 URL |

| `page.reload()` | 刷新当前页 |

| `page.goBack()` / `page.goForward()` | 前进/后退 |

| `page.close()` | 关闭页面 |

| `page.url()` | 获取当前 URL |

| `page.title()` | 获取页面标题 |

| `page.content()` | 获取完整 HTML |

| `page.evaluate(fn)` | 在页面上下文执行 JS |

| `page.screenshot(options)` | 截图 |

  

---

  

## 7. 导航与等待

  

### goto 选项

  

```typescript

await page.goto('https://example.com', {

waitUntil: 'networkidle', // 等待策略

timeout: 30000, // 超时（ms）

});

```

  

### waitUntil 策略

  

| 值 | 说明 |

|----|------|

| `'load'` | 等待 `load` 事件触发（页面基本加载完） |

| `'domcontentloaded'` | 等待 DOM 解析完毕 |

| `'networkidle'` | 等待网络连接数 < 2 持续 500ms |

| `'commit'` | 等待页面开始加载（最快） |

  

### 等待元素

  

```typescript

// 等待元素出现

await page.waitForSelector('.my-element');

  

// 等待特定网络响应

const response = await page.waitForResponse('**/api/data');

  

// 等待特定请求

const request = await page.waitForRequest('**/api/submit');

  

// 等待导航完成

await page.waitForNavigation({ waitUntil: 'networkidle' });

  

// 等待固定时间（不推荐，仅用于调试）

await page.waitForTimeout(1000);

```

  

---

  

## 8. 网络事件监听

  

监听事件是**被动观察**，不影响请求流程。

  

### Page 级事件

  

```typescript

// 请求发出时

page.on('request', (request) => {

console.log('>>', request.method(), request.url());

});

  

// 响应到达时（拿到状态码和头部）

page.on('response', async (response) => {

console.log('<<', response.status(), response.url());

// 读取响应体（注意：某些响应不可读）

try {

const text = await response.text();

console.log(text.slice(0, 200));

} catch (e) {

// 忽略

}

});

  

// 请求完成（body 下载完毕）

page.on('requestfinished', (request) => {

console.log('done', request.url());

});

  

// 请求失败

page.on('requestfailed', (request) => {

console.log('fail', request.failure()?.errorText, request.url());

});

```

  

### Response 对象

  

| 方法 | 返回值 | 说明 |

|------|--------|------|

| `response.url()` | string | 响应 URL |

| `response.status()` | number | HTTP 状态码 |

| `response.ok()` | boolean | 状态码 200-299 |

| `response.headers()` | object | 响应头 |

| `response.headerValue(name)` | string | 获取指定响应头 |

| `response.text()` | Promise\<string\> | 响应体文本 |

| `response.json()` | Promise\<any\> | 响应体 JSON |

| `response.body()` | Promise\<Buffer\> | 响应体二进制 |

| `response.request()` | Request | 对应的请求对象 |

  

### Request 对象

  

| 方法 | 返回值 | 说明 |

|------|--------|------|

| `request.url()` | string | 请求 URL |

| `request.method()` | string | HTTP 方法 |

| `request.headers()` | object | 请求头 |

| `request.postData()` | string \| null | POST 请求体 |

| `request.resourceType()` | string | 资源类型（`script`、`stylesheet`、`xhr` 等） |

| `request.isNavigationRequest()` | boolean | 是否为导航请求 |

| `request.response()` | Promise\<Response\> | 等待并返回响应 |

  

---

  

## 9. Route API（网络拦截）

  

Route API 是**主动拦截**，请求会被挂起，直到调用 `continue()`、`fulfill()` 或 `abort()`。

  

> ⚠️ 启用路由会自动禁用 HTTP 缓存。

  

### 注册路由

  

```typescript

// glob 模式

await page.route('**/*.js', handler);

  

// 正则

await page.route(/\.css$/, handler);

  

// URLPattern

await page.route(new URLPattern({ pathname: '/api/*' }), handler);

  

// 自定义函数

await page.route(url => url.includes('analytics'), handler);

```

  

### URL Glob 语法

  

| 模式 | 匹配 |

|------|------|

| `**` | 任意路径（跨目录） |

| `*` | 任意字符（不含 `/`） |

| `*.js` | 以 .js 结尾的文件 |

| `**/*.{js,css}` | 任意路径下的 .js 或 .css |

| `https://example.com/**` | example.com 下所有路径 |

  

### route.continue()：透传请求

  

```typescript

await page.route('**', async (route) => {

// 可修改请求头后透传

await route.continue({

headers: {

...route.request().headers(),

'X-Custom-Header': 'value',

},

});

});

```

  

### route.abort()：中断请求

  

```typescript

// 阻断所有图片请求

await page.route('**/*.{png,jpg,jpeg,gif,webp}', route => route.abort());

  

// 指定错误类型

await route.abort('blockedbyclient');

```

  

常用 errorCode：`'aborted'`、`'accessdenied'`、`'blockedbyclient'`、`'connectionrefused'`、`'connectiontimeout'`、`'failed'`

  

### route.fulfill()：模拟响应

  

```typescript

// 返回自定义响应

await page.route('**/api/user', route => route.fulfill({

status: 200,

contentType: 'application/json',

body: JSON.stringify({ name: 'Alice', age: 30 }),

}));

  

// 返回本地文件

await page.route('**/logo.png', route => route.fulfill({

path: './fixtures/logo.png',

}));

```

  

### route.fetch()：拦截后真实请求，再修改响应

  

```typescript

await page.route('**/*.js', async (route) => {

// 先真实请求

const response = await route.fetch();

// 获取响应体

const body = await response.text();

  

// 修改内容

const modified = body + '\n// injected';

  

// 返回修改后的响应（保留原始 headers/status）

await route.fulfill({

response, // 复用原始响应的 status、headers

body: modified,

});

});

```

  

### route.fulfill() 选项

  

| 选项 | 类型 | 说明 |

|------|------|------|

| `status` | number | HTTP 状态码（默认 200） |

| `headers` | object | 响应头 |

| `contentType` | string | Content-Type |

| `body` | string \| Buffer | 响应体 |

| `json` | any | 自动序列化为 JSON，设置 Content-Type |

| `path` | string | 从文件读取响应体 |

| `response` | Response | 复用已有响应（覆盖部分字段） |

  

### 限制使用次数

  

```typescript

// 只拦截前 3 次

await page.route('**/api/**', handler, { times: 3 });

```

  

### 移除路由

  

```typescript

const handler = (route) => route.continue();

await page.route('**', handler);

  

// 移除特定 handler

await page.unroute('**', handler);

  

// 移除所有 handler

await page.unrouteAll();

```

  

---

  

## 10. APIRequestContext（HTTP 请求）

  

在 Playwright 上下文内发送 HTTP 请求，自动共享浏览器的 Cookie。

  

```typescript

// 通过 page.request 使用（共享页面 Cookie）

const response = await page.request.get('https://api.example.com/data');

console.log(response.status()); // 200

const json = await response.json();

  

// POST 请求

const res = await page.request.post('https://api.example.com/submit', {

data: { key: 'value' },

headers: { 'Authorization': 'Bearer token' },

});

  

// 通过 context.request 使用（Context 级共享 Cookie）

const res2 = await context.request.get('/api/items');

```

  

### 常用方法

  

| 方法 | 说明 |

|------|------|

| `request.get(url, options)` | GET 请求 |

| `request.post(url, options)` | POST 请求 |

| `request.put(url, options)` | PUT 请求 |

| `request.delete(url, options)` | DELETE 请求 |

| `request.fetch(url, options)` | 通用请求（可指定 method） |

  

### 请求选项

  

```typescript

await page.request.post('https://example.com/api', {

data: { name: 'Alice' }, // JSON body（自动序列化）

form: { file: 'content' }, // multipart/form-data

headers: { 'X-Token': 'abc' }, // 额外请求头

timeout: 10000, // 超时（ms）

failOnStatusCode: false, // 非 2xx 不抛出异常

});

```

  

---

  

## 11. 元素操作

  

```typescript

// 点击

await page.click('button#submit');

await page.locator('text=登录').click();

  

// 填写表单

await page.fill('input[name="username"]', 'admin');

await page.type('input', 'hello', { delay: 50 }); // 模拟逐字输入

  

// 选择下拉

await page.selectOption('select#color', 'blue');

  

// 勾选

await page.check('input[type="checkbox"]');

await page.uncheck('input[type="checkbox"]');

  

// 悬停

await page.hover('.tooltip-trigger');

  

// 键盘

await page.keyboard.press('Enter');

await page.keyboard.type('Hello World');

  

// 获取文本

const text = await page.textContent('.title');

const value = await page.inputValue('input[name="q"]');

  

// 断言元素存在

const count = await page.locator('.item').count();

```

  

---

  

## 12. 截图与录像

  

```typescript

// 页面截图

await page.screenshot({ path: 'screenshot.png', fullPage: true });

  

// 元素截图

await page.locator('.chart').screenshot({ path: 'chart.png' });

  

// 录制视频（在 newContext 时配置）

const context = await browser.newContext({

recordVideo: { dir: './videos' },

});

const page = await context.newPage();

// ... 操作 ...

await context.close(); // 关闭时自动保存视频

```

  

---

  

## 13. 错误处理与超时

  

### 全局超时设置

  

```typescript

// 设置默认操作超时（所有 click/fill/waitFor 等）

page.setDefaultTimeout(10000);

  

// 设置导航超时

page.setDefaultNavigationTimeout(30000);

```

  

### 常见异常

  

| 异常类型 | 原因 |

|----------|------|

| `TimeoutError` | 等待元素/导航超时 |

| `Error: net::ERR_NAME_NOT_RESOLVED` | DNS 解析失败 |

| `Error: net::ERR_CONNECTION_REFUSED` | 连接被拒绝 |

| `Error: Navigation failed` | 页面导航失败 |

  

### 忽略导航超时继续处理

  

```typescript

try {

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

} catch (e) {

// 超时后仍可继续处理已拦截的数据

console.warn('导航超时，继续处理已收集数据:', e.message);

}

```

  

---

  

## 14. 常用模式速查

  

### 过滤特定资源类型

  

```typescript

page.on('response', async (response) => {

const type = response.request().resourceType();

if (type === 'script' || type === 'stylesheet') {

// 处理 JS / CSS

}

});

```

  

`resourceType` 常用值：`'document'`、`'script'`、`'stylesheet'`、`'image'`、`'fetch'`、`'xhr'`、`'websocket'`

  

### 等待特定请求完成

  

```typescript

// 等待匹配 URL 的响应

const [response] = await Promise.all([

page.waitForResponse(resp => resp.url().includes('/api/data') && resp.status() === 200),

page.click('#load-data'),

]);

const data = await response.json();

```

  

### 阻止不必要的资源加载（提升性能）

  

```typescript

await page.route('**', (route) => {

const type = route.request().resourceType();

if (['image', 'media', 'font'].includes(type)) {

route.abort();

} else {

route.continue();

}

});

```

  

### 注入自定义 JS 到每个页面

  

```typescript

await page.addInitScript(() => {

window.__INJECTED__ = true;

});

```

  

### 保存/恢复登录状态

  

```typescript

// 保存

await context.storageState({ path: 'auth.json' });

  

// 恢复

const context = await browser.newContext({

storageState: 'auth.json',

});

```

  

### 完整生命周期示例

  

```typescript

import { chromium } from 'playwright';

  

const browser = await chromium.launch({ headless: true });

const context = await browser.newContext({

userAgent: 'MyBot/1.0',

});

const page = await context.newPage();

  

page.on('response', async (response) => {

console.log(response.status(), response.url());

});

  

try {

await page.goto('https://example.com', {

waitUntil: 'networkidle',

timeout: 30000,

});

} catch (e) {

console.warn('导航超时');

}

  

await page.screenshot({ path: 'result.png' });

await browser.close();

```