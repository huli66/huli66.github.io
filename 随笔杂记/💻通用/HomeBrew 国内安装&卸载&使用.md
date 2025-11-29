
### 卸载

```sh
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/HomebrewUninstall.sh)"
```

### 安装 & 换源

```sh
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"
```

运行这个命令过程中可以选择是否删除已有版本的 Homebrew 和是否换源，也可以跳过安装直接给已有的 Homebrew 换源

### 常用命令

```sh
# 安装
brew install <package-name>

# 卸载
brew uninstall <package-name>

# 查找
brew search <package-name>

# 升级指定包
brew upgrade <package-name>

# 查看已安装的所有包
brew list

# 更新 homebrew 本身
brew update

# 清除所有包的旧版本
brew cleanup

# 清除指定包的旧版本
brew cleanup <package-name>

# 预览可清理的旧版本包（不实际清除）
brew cleanup -n
```