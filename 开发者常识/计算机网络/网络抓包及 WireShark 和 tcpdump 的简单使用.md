
两者都是网络抓包分析软件
## WireShark
[WireShark是用教程](https://zhuanlan.zhihu.com/p/631821119)
WireShark 可以运行在 Windows 和 MacOS 上

官网下载安装即可，开始抓包后会有很多数据出现，需要在过滤栏设置过滤条件进行数据包列表过滤

wireshark 工具自带两种类型的过滤器

1. 抓包过滤器

```sh
# tcp http udp icmp 等，协议过滤
tcp

# ip 过滤
host 192.168.1.104
src host 192.168.1.104
dst host 192.168.1.102

# 端口过滤
port 80
src port 80
dst port 80

# 

# 主机 ip 为 183.232.231.172 且协议为 ICMP，协议名小写
ip.addr == 183.232.231.172 and icmp
```

2. 
对于某一个包可以看到它在各层使用的协议
## tcpdump

linux 下可以使用 tcpdump