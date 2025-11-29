
## 安装发行版

```sh
# 安装 wsl 并且不安装发行版，默认会安装 Ubuntu
wsl --install --no-distribution

# 设置默认版本 wsl1 或 wsl2，初始默认为 wsl2
wsl --set-default-version 1

# 查看当前源里的可安装发行版
wsl --list --online
# 查看当前已安装所有发行版
wsl --list --verbose

# 安装指定版本的 WSL 到指定路径，历史版本不支持指定位置
wsl --install Debian --location C:\\WSL\Debian1 --version 1

# 停止 wsl
wsl --shutdown

# 启动 wsl
wsl

# 设置默认发行版
wsl --set-default Debian

# 迁移前
wsl --manage Debian --move C:\\WSL\Debian

# 导出作为备份或者通过导出再导入来迁移位置
wsl --export Debian C:\\WSL\Debian.tar
wsl --unregister Debian
wsl --import Debian C:\\WSL\DebianNew C:\\WSL\Debian.tar
```

## 网络配置
WSL1 和 Windows 共享网络栈，完全互通，无需额外配置

WSL2 默认不支持直接访问 Windows localhost，需要配置转发，手动配置防火墙等

WSL2 2.0 可以使用镜像网络，基本和 WSL 效果一样

资源管理器地址栏输入 `%UserProfile%` 打开当前用户的主目录，创建文件 `.wslconfig`，配置

```sh
[wsl2]
memory=4GB                        # 分配给 WSL 2 的内存大小
processors=2                      # 分配给 WSL 2 的 CPU 核心数
localhostForwarding=true          # 是否启用 localhost 转发
 
[experimental]
autoMemoryReclaim=gradual         # 开启自动回收内存，可在 gradual, dropcache, disabled 之间选择
networkingMode=mirrored           # 开启镜像网络
dnsTunneling=true                 # 开启 DNS Tunneling
firewall=true                     # 开启 Windows 防火墙
autoProxy=true                    # 开启自动同步代理
sparseVhd=true                    # 开启自动释放 WSL2 虚拟硬盘空间
```

重启 wsl 后 `curl http://localhost` 验证
在 WSL 中查看宿主机 IP `cat /etc/resolv.conf` `nameserver`

## 环境配置并备份

根据 [[新电脑配置]] 对 WSL 进行配置

使用 `--export` 命令备份配置完善的分发版，方便后续重置或者迁移

## 开发环境和调试
VSCode 安装 WSL 插件
安装 remote-container 插件

