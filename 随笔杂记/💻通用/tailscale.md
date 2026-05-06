 用 tailscale 来实现简单的内网穿透非常方便，可以很简单串联树莓派、Mac、Linux、Windows
 但是，**同时使用 tailscale 和 v2rayN 等软件，启动顺序会导致网络问题**

## 原因

tailscale 默认会控制 route 和 dns
- 控制 dns 来让网络中的各台机器可以直接别名访问，无需使用 ip 访问，如果关闭则只能使用 ip 访问，或者给设备的 host 文件增加映射关系（*可以手动添加，也可以用*）
