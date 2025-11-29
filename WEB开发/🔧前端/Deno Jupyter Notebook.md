
## 安装环境
### 安装 jupyter notebook
安装 jupyter notebook 检查版本
```sh
# 通过 pip3 安装
pip3 install notebook

# 查看安装的版本
jupyter notebook -v
```
此时可能会报错 `command not found: jupyter`，就需要配置环境变量

以 macOS 的 zsh 为例（windows 或者其他终端操作也类似）
在 `.zshrc` 中添加一行 `export PATH=""`,

图 1

### 安装 deno
 
安装 deno，添加环境变量，检查版本

```sh
# 官方提供的安装脚本，安装过程会提示是否添加环境变量，选择 Y（yes）即可
curl -fsSL https://deno.land/install.sh | sh

# 查看 deno 版本，最新版 deno 安装会自动配置环境变量
# 如果执行失败可以重启终端或者手动配置一下环境变量
deno --version
```

可以在 `.zshrc` 最后面可以看到自动新增了一行 `/Users/user/.deno/env`

### 配置 deno jupyter

配置 jupyter 内核，启用 deno

```
deno jupyter --install
```

### 安装 vscode 插件

VSCode 插件市场搜索 `deno` `jupyter` 这两个插件进行安装
项目的 `.vscode/setting.json` 文件中配置

```json
{
	"deno.enable": true
}
```
对于习惯了 npm 管理依赖包的前端开发来说，可以选择只是使用 `deno` 的运行时，不使用其远程依赖等功能，依旧使用`npm init -y` `package.json` 管理依赖，然后使用 `pnpm install` 或 `deno install` 安装依赖，就会像普通 `node` 项目一样方便了

### 运行

```sh
jupyter notebook
```

创建后缀为 `.ipynb` 的文件，在 VSCode 中打开，一般会自动选择运行时，也可以手动修改为 deno，然后就可以开始一段一段代码编写和执行了

缺点是 jupyter deno 内核不稳定，如果出现报错崩溃了，可以选择重启即可
总得来说，这样配置下来非常适合写小 demo 或者工具，进行调试可以一步步执行，错了的地方重新点执行即可

希望以后 `jupyter` 或者 `node.js` 官方支持一下就好了，目前能集成到 jupyter notebook 的 node.js 内核有不少，但是大多都是个人开发者做的且很久没有更新了，最新还在更新的 `tslab` 也是一年前了，所以还不如直接用 deno 的，好歹是官方的
