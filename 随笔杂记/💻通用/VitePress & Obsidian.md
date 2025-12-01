
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

在 obsidian 设置界面 --- 文件与链接中，设置不适用 Wiki 链接，内部链接类型选择基于当前笔记的相对路径，`![]()` 是 markdown 标准格式的链接，所有markdown 编辑器都会支持，`![[]]` 是 obsidian 独有的，而设置为相对路径则是让链接在 vitepress 中也能正常跳转(绝对路径也行，只要不是使用短链)，如下图：

![](public/Pasted%20image%2020251201091930.png)

[NextJS 国际化](WEB开发/nextjs/NextJS%20国际化.md)

[Pinia](WEB开发/🔧前端/Pinia.md)

## Github 风警告

```md
> [!NOTE]
> 强调用户在快速浏览文档时也不应该忽略的重要信息

> [!]
```