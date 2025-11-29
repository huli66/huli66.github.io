
### 安装 s-ui

 `apt update` 
 `apt install curl`
  执行下列命令，回车默认安装即可，及时保留 username/password/url
```sh
VERSION=1.2.2 && bash <(curl -Ls https://raw.githubusercontent.com/alireza0/s-ui/$VERSION/install.sh) $VERSION
```

```sh
Username:        jUbpkyqI
Password:        6ZXtVO5s
http://104.194.75.122:2095/app/
```

测试 vps 到其他网站的延迟，选一个最低的
```sh
for d in beacon.gtv-pub.com snap.licdn.com j.6sc.co statici.icloud.com www.xbox.com www.nvidia.com www.bing.com sisu.xboxlive.com aws.com tag.demandbase.com ; do t1=$(date +%s%3N); timeout 1 openssl s_client -connect $d:443 -servername $d </dev/null &>/dev/null && t2=$(date +%s%3N) && echo "$d: $((t2 - t1)) ms" || echo "$d: timeout"; done
```

### 添加节点
- 进入 s-ui 面板
- 添加 tls 规则，生成公钥私钥
	- 一个 reality，443
	- 一个 tls-self，443
- 添加入站
- 添加用户

两个节点链接

```ls
vless://af28dd05-090f-4782-b34d-cd8648b6c68b@104.194.75.122:443?flow=xtls-rprx-vision&fp=chrome&pbk=xLYru2iZtvOTsay8UIIAe7ZC3MWnAuWDsk3rn2sYlkI&security=reality&sni=www.bing.com&type=tcp#vless-reality

tuic://af28dd05-090f-4782-b34d-cd8648b6c68b:5vVomREMrd@104.194.75.122:443?alpn=h3%2Ch2%2Chttp%2F1.1&congestion_control=bbr&insecure=1&sni=www.bing.com#tuic-tls
```

**ip被封禁后，可以迁移机房来更换 ip**

### vps体质测试

```sh
bash <(wget -qO- bash.spiritlhl.net/ecs) # 融合怪 VPS 测评脚本
```

### 运行延迟测试容器

```sh
curl -fsSL https://get.docker.com | sudo sh # 安装Docker - 官方脚本
docker run -d -p 6688:80 ilemonrain/html5-speedtest:alpine

# -d：后台模式启动
# -p 6688:80：镜像映射端口，修改 6688 为任意端口即可
# 访问 http://IP:6688
```

