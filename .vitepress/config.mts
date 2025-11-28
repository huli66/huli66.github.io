import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  /** ------------------------------------ 站点元数据 metaData start ------------------------------------ */
  lang: "zh-CN",
  title: "huli66",
  titleTemplate: "胡建军 | :title", // 页面标题格式
  description: "HuJianjun blog", // 可以通过页面内的 frontmatter 覆盖
  appearance: true, // 默认值为 true，dark 为默认黑色主题
  lastUpdated: true, // 页脚显示最后更新时间
  ignoreDeadLinks: true,
  head: [
    // 添加 icon，prefetch，字体等 head 标签
    ["link", { rel: "icon", href: "/head.svg", sizes: "16x16" }],
    ["link", { rel: "prefetch", src: "huli66.com" }],
    [
      "link",
      {
        href: "https://fonts.googleapis.com/css2?family=Roboto&display=swap",
        rel: "stylesheet",
      },
    ],
    // 使用谷歌分析
    [
      "script",
      { async: "", src: "https://www.googletagmanager.com/gtag/js?id=TAG_ID" },
    ],
    [
      "script",
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'TAG_ID');`,
    ],
  ],
  // base: "blog",
  /** ------------------------------------ metaData end ------------------------------------ */

  /** ------------------------------------ 路由 route start ------------------------------------ */
  // 自定义目录和 URL 的映射
  rewrites: {
    // 'source/:page': 'description/:page'
  },
  cleanUrls: true, // 显示不带 .html 后缀的路由
  /** ------------------------------------ 路由 route end ------------------------------------ */

  /** ------------------------------------ 构建 build start ------------------------------------ */
  // srcDir: '.', // 源目录相对于根目录的 markdown 文件所在位置
  srcExclude: ["**/TODO.md", "**/private/**"], // 用于匹配排除作为源内容的 markdown 文件
  // outDir: "./.vitepress/dist", // 构建包保存的位置，部署时从这个位置取包
  // assetsDir: " assets", // outDir 内的静态资源目录
  /** ------------------------------------ 构建 build end ------------------------------------ */

  /** ------------------------------------ 主题 theme start ------------------------------------ */
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      dark: "/head.svg",
      light: "/head.svg",
    },
    // i18nRouting: true,
    nav: [
      { text: "Home", link: "/" },
      { text: "Examples", link: "/markdown-examples" },
    ],

    sidebar: [
      {
        text: "Examples",
        items: [
          { text: "Markdown Examples", link: "/markdown-examples" },
          { text: "Runtime API Examples", link: "/api-examples" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
      { icon: "juejin", link: "https://github.com/vuejs/vitepress" },
      {
        icon: {
          // svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Dribbble</title><path d="M12...6.38z"/></svg>',
          svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24"><path fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.756 16.358a1.09 1.09 0 0 0 1.154 1.198a16.576 16.576 0 0 1 3.54.338c1.635.2 3.197.794 4.552 1.731V6.448A10.16 10.16 0 0 0 7.45 4.694a16.597 16.597 0 0 0-3.605-.316a1.09 1.09 0 0 0-1.09 1.09zm18.492 0a1.089 1.089 0 0 1-1.154 1.154a16.576 16.576 0 0 0-3.54.338a10.16 10.16 0 0 0-4.552 1.775V6.448a10.16 10.16 0 0 1 4.552-1.754a16.597 16.597 0 0 1 3.605-.316a1.089 1.089 0 0 1 1.089 1.155zM5.621 8.234h1.252m-1.252 6.011h1.834M5.78 11.24h3.35"/></svg>`,
        },
        link: "https://huli66.com",
        ariaLabel: "main page",
      },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2019-present Jianjun Hu",
    },

    editLink: {
      pattern: "https://github.com/huli66/repo/route:path",
      text: "Edit on GitHub",
    },

    lastUpdated: {
      text: "最近更新",
      formatOptions: {
        dateStyle: "full",
        timeStyle: "medium",
      },
    },

    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },

    search: {
      provider: "local",
      // 改成 algolia 进行多语言搜索支持
      // https://vitepress.dev/zh/reference/default-theme-search
    },
  },
  /** ------------------------------------ 主题 theme end ------------------------------------ */
});
