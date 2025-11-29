
`https://www.haoyep.com/posts/zsh-config-oh-my-zsh/`


### 插件

```sh
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# 修改 ～/.zsh
plugins=(git zsh-autosuggestions zsh-syntax-highlighting z extract web-search)

# 刷新或者重新开启终端
source ~/.zshrc
```