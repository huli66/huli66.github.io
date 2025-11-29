
### Suspense

 多个 Suspense 时，哪个先返回就先渲染哪个，也可以嵌套来控制顺序，但是请求都是同时发送的
### Streaming

`Suspense` 背后的技术称之为 `Streaming` 将页面的 HTML 拆分为多个 chunks ，然逐步发送到客户端，这样可以更快展现页面的部分内容，无需等待所有数据加载，提前发送的组件可以提前开始水合，有效改善用户体验

Next.js 中有两种实现 Streaming 的方法
- `loading.jsx`
- `<Suspense>`

`Suspense` `Streaming` 将原本只能先获取数据再渲染水合的传统 SSR 改为 渐进式渲染水合，极大提升了性能体验，但是：
- 用户要下载的 js 没有减少，真的需要下载那么多 js 吗
- 所有组件都要在客户端进行水合吗？不需要交互的组件其实没必要进行水合


*服务端组件中有异步等待内容时，使用 Suspense 可以让页面直接渲染出来，Suspense 部分显示 fallback 内容（loading、骨架屏等），然后页面继续转圈圈加载，直到异步内容走完，chunk 通过 html 请求发送完毕，继续水合新的 chunk，如果不使用 Suspense 则一直等待异步走完，再一次性返回所有 html*

**使用 Suspense 和 流式渲染不会增加请求，而是同一个 html 请求一直保持 pending 状态，传输多个 chunk，直到所有 chunks 发送完毕**

