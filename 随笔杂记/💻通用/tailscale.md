 用 tailscale 来实现简单的内网穿透非常方便，可以很简单串联树莓派、Mac、Linux、Windows
 但是，**同时使用 tailscale 和 v2rayN 等软件，启动顺序会导致网络问题**

## 原因

tailscale 默认会控制 route 和 dns
- 控制 dns 来让网络中的各台机器可以直接别名访问，无需使用 ip 访问，如果关闭则只能使用 ip 访问，或者给设备的 host 文件增加映射关系（*可以手动添加，也可以用 SwitchHosts 这种软件修改，SwitchHosts 软件只需要修改的时候打开即可，改完后不需要一直运行，因为本质上都是修改系统的配置文件，保存完之后会一直生效*）
- 控制 route 的作用是在 tailscale 里广播某台装了 tailscale 的设备所在子网，让子网内的其他没有安装 tailscale 的设备也可以通过 tailscale 网络进行访问，或者把某个设备当成流量出口，类似 VPN（*这两个功能基本可以不需要使用，也可以关闭*）

V2rayN 这种软件如果打开 tun 模式也同样会接管 route 和 dns

两者都启动则会按照启动顺序互相复写，特别是都开机自启动则会导致顺序不稳定

## 解决方法

可以手动控制或者通过脚本控制，先启动 tailscale 再启动 V2rayN 即可，但是使用不方便，而我不需要 tailscale 的高级功能，只需要能够连通几台设备即可，所以一次性修改配置永久有效的方案会更加友好

- tailscale GUI 界面关闭 subroute 和 dns 设置
- `sudo tailscale up --accept-routes=false --accept-dns=false --reset` chogn'q
