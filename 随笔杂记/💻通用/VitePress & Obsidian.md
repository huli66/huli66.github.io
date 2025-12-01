
# VitePress & Obsidian

## 插入图片和链接

设置 obsidian 插入图片都放在 public 目录下，vitepress 也从这个目录读取图片
并且插入图片时使用正确的 链接方式
文件与链接，设置为取消使用 wiki 链接，
TODO： 修改自动插入图片的语法为外部连接

```md
# obsidian 中有两种插入图片方案
![[head.svg]] # 连接本地图片，这种无法在 vitepress 中显示

![](head.svg) # 连接外部或本地图片，这种可以在 vitepress 中显示
```

在 obsidian 设置界面 --- 文件与链接中，设置不适用 Wiki 链接，内部链接类型选择基于当前笔记的相对路径，`![]()` 是 markdown 标准格式的链接，所有markdown 编辑器都会支持，`![[]]` 是 obsidian 独有的，而设置为相对路径则是让链接在 vitepress 中也能正常跳转，如下图：

![](../../public/Pasted%20image%2020251201094532.png)

[NextJS 国际化](WEB开发/nextjs/NextJS%20国际化.md)

[Pinia](WEB开发/🔧前端/Pinia.md)

## Github 风警告

```md{2}
> [!NOTE]
> 强调用户在快速浏览文档时也不应该忽略的重要信息

> [!TIP]
> 有助于用户更顺利达成目标的建议信息

> [!IMPORTANT]
> 对用户达成目标至关重要的信息

> [!WARNING]
> 可能存在风险

> [!CAUTION]
> 行为可能带来负面影响
```

> [!NOTE]
> 强调用户在快速浏览文档时也不应该忽略的重要信息

> [!TIP]
> 有助于用户更顺利达成目标的建议信息

> [!IMPORTANT]
> 对用户达成目标至关重要的信息

> [!WARNING]
> 可能存在风险

> [!CAUTION]
> 行为可能带来负面影响

## 更多
基本上使用大概就这样了，但是这篇文章写下来发现，很多 VitePress 自带的语法功能很好用，但是obsidian 都不支持，如果不需要使用 obsidian 这个编辑器和同步这些功能，直接用 vscode 编辑，`pnpm dev` 预览，手动 git 同步也是一个好选择

