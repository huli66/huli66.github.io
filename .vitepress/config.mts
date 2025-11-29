import { defineConfig } from "vitepress";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 根据目录返回目录下所有文章标题并排序
 * @param pathname 目录地址
 * @returns 目录下所有文章标题
 */
function getDirctSidebar(pathname: string) {
  const p = path.resolve(__dirname, "../", pathname);
  if (!fs.existsSync(p)) return [];
  const dd: string[] = fs.readdirSync(p);

  // 区分目录和文档，文档生成菜单子项，目录生产菜单子目录
  const pages = dd
    .filter((v) => v.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b))
    .map((p) => {
      const text = p.replace(".md", "");
      return {
        text,
        link: `/${pathname}/${text}`,
      };
    });

  const subMenus = dd
    .filter((v) => !v.endsWith(".md"))
    .filter((v) => {
      // 判断是否是目录
      const pp = path.resolve(__dirname, "../", pathname, v);
      return fs.statSync(pp).isDirectory();
    })
    .sort((a, b) => a.localeCompare(b))
    .map((d) => {
      return {
        text: d,
        collapsed: true,
        items: getDirctSidebar(`${pathname}/${d}`),
      }
    });

  return [
    ...subMenus,
    ...pages,
  ];
}

function nav() {
  return [
    {
      text: "WEB开发",
      link: "/WEB开发/",
      // items: [
      //   { text: "JS&H5&C3", link: "/web/protogenesis/index" },
      //   { text: "React", link: "/web/react/index" },
      //   { text: "Vue", link: "/web/vue/index" },
      //   { text: "工程化", link: "/web/engineering/index" },
      //   { text: "翻译", link: "/web/translate/index" },
      // ],
    },
    {
      text: "开发者常识",
      link: "/开发者常识/",
      // items: [
      //   { text: "算法", link: "/developer/algorithms/index" },
      //   { text: "设计模式", link: "/developer/designpattern/index" },
      //   { text: "开发者技能", link: "/developer/others/index" },
      // ],
    },
    {
      text: "随笔杂记",
      link: "/随笔杂记/",
      // items: [
      //   { text: "问题解决", link: "/blogs/problems/index" },
      //   { text: "随手记录", link: "/blogs/notes/index" },
      // ],
    },
    {
      text: "更多",
      items: [
        { text: "个人简介", link: "/README" },
        { text: "本站历史", link: "/CHANGELOG" },
        { text: "生活记录", link: "/TODO" },
        {
          text: "翻译",
          link: "/about",
          // items: [
          //   { text: "Study", link: "" },
          //   { text: "NEXTJS", link: "" },
          // ],
        },
      ],
    },
  ];
}

function sidebar() {
  return {
    "/随笔杂记": getDirctSidebar("随笔杂记"),
    "/WEB开发": getDirctSidebar("WEB开发"),
    "/开发者常识": getDirctSidebar("开发者常识"),
  };
}

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
    nav: nav(),

    sidebar: sidebar(),

    socialLinks: [
      { icon: "github", link: "https://github.com/huli66/huli66.github.io" },
      // { icon: "juejin", link: "https://github.com/vuejs/vitepress" },
      {
        icon: {
          // svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Dribbble</title><path d="M12...6.38z"/></svg>',
          svg: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><path fill="currentColor" d="M224 24c0-13.3 10.7-24 24-24c145.8 0 264 118.2 264 264c0 13.3-10.7 24-24 24s-24-10.7-24-24c0-119.3-96.7-216-216-216c-13.3 0-24-10.7-24-24M80 96c26.5 0 48 21.5 48 48v224c0 26.5 21.5 48 48 48s48-21.5 48-48s-21.5-48-48-48c-8.8 0-16-7.2-16-16v-64c0-8.8 7.2-16 16-16c79.5 0 144 64.5 144 144s-64.5 144-144 144S32 447.5 32 368V144c0-26.5 21.5-48 48-48m168 0c92.8 0 168 75.2 168 168c0 13.3-10.7 24-24 24s-24-10.7-24-24c0-66.3-53.7-120-120-120c-13.3 0-24-10.7-24-24s10.7-24 24-24"/></svg>`,
        },
        // icon: "blog",
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
