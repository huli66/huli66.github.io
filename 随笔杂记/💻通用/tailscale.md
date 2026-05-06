 用 tailscale 来实现简单的内网穿透非常方便，可以很简单串联树莓派、Mac、Linux、Windows
 但是，**同时使用 tailscale 和 v2rayN 等软件，启动顺序会导致网络问题**

## 原因

tailscale 默认会控制 route 和 dns
- 控制 dns 来让网络中的各台机器可以直接别名访问，无需使用 ip 访问，如果关闭则只能使用 ip 访问，或者给设备的 host 文件增加映射关系（*可以手动添加，也可以用 SwitchHosts 这种软件修改，SwitchHosts 软件只需要修改的时候打开即可，改完后不需要一直运行，因为本质上都是修改系统的配置文件，保存完之后会一直生效*）
- 控制 route 的作用是在 tailscale 里广播某台装了 tailscale 的设备所在子网，让子网内的其他没有安装 tailscale 的设备也可以通过 tailscale 网络进行访问，或者把某个设备当成流量出口，类似 VPN（*这两个功能基本可以不需要使用，也可以关闭*）

V2rayN 这种
