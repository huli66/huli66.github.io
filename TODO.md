# TODO

- 调整目录结构，整理文档
- 新设备的 Obsidian 设置文档整理
	- 插件
	- 主题
	- 同步
	- 移动端
	- 图片展示和同步
- 抽空抹平部分 obsidian 和 vitepress 的展示差异
	- obsidian 的 tag vitepress 不展示
	- 可以考虑更换 vitepress markdown 引擎
	- vitepress markdown 代码样式
	- markdown 内插入图片的同步，vitepress 放 publich目录下，obsidian可以设置指定目录

## 插入图片方案

设置 obsidian 插入图片都放在 public 目录下，vitepress 也从这个目录读取图片
并且插入图片时使用正确的 链接方式
TODO： 修改自动插入图片的语法为外部连接

```md
# obsidian 中有两种插入图片方案
![[head.svg]] # 连接本地图片，这种无法在 vitepress 中显示

![](head.svg) # 连接外部或本地图片，这种可以在 vitepress 中显示
```


![](Pasted%20image%2020251201091253.png)

[