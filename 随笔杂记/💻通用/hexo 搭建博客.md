
### 搭建博客

  

- 环境

  

```sh

# 切换到 root 用户，输入密码

sudo su

# clean 清屏幕

clean

# npm 安装 cnpm 用vpn可以忽略

npm install -g cnpm --registry=https://registry.npm.taobao.org

# 安装包

npm install -g hexo-cli

hexo -v

# 创建相关文件

mkdir block

cd block

# 查看路径

pwd

# 初始化

cd blog

sudo hexo init

# 启动

hexo start hexo s hexo server

# 生成一篇博客

hexo new "blog_name"

# 编辑博客

cd source/_posts/

vim blog_name

:wq

#

cd ../..

hexo clean

hexo generate

hexo s

# github 创建同名仓库

# 安装 git 插件

cd blog

npm install --save hexo-deployer-git

# 设置 _config.yml

deploy:

type: git

repo: 仓库地址

branch: master

# 部署

hexo d

# 主题

git clone 主题仓库 themes/yilia

_config.yml theme: 改名

hexo g

hexo s

hexo d

```

  

[baidu.com](http://www.baidu.com)

  

cd project

cd my-blog

npm run start -- --port=80