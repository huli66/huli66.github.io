# 本站历史

2025 年 11 月 29 日，使用 vitepress 2 重构，将内容迁移到新的 vitepress 项目中，部署在 github page 上

迁移目的：
- 笔记可以在 github page 上展示
- 可以在 obsidian 中编辑并通过 git 实时同步，多端自动同步数据

## 过往

- 2018 年最开始用 Hexo 搭建

- 2021 年采用 React + Next.js 搭建的服务端渲染博客，所有项目和文档在同一个项目

- 2021 年底，进行了又一次重构，由 前端 + 服务端 + 文档 三个项目组成
  - 文档项目 - 所有 markdown 文档发布到一个 git 仓库中
    设置 GitHub Action 每次推送代码后进入云服务器执行拉代码脚本（或者直接打包复制到指定目录）
    该目录映射后端读取文档的目录
  - 服务端：TypeScript + Express
    通过 Docker node 容器在云服务器运行
    读取指定目录所有文件，返回内容
  - 前端：React
    通过 Docker nginx 容器部署到云服务器
