# Xray VLESS 分流代理配置指南

> 适用平台：Debian · Raspberry Pi | 协议：VLESS | 功能：规则分流 · Web 管理面板

---

## 目录

- [01 工作原理与架构](https://claude.ai/chat/330ff6f5-347a-4826-9b50-fc68e6004355#01-%E5%B7%A5%E4%BD%9C%E5%8E%9F%E7%90%86%E4%B8%8E%E6%9E%B6%E6%9E%84)
- [02 安装 Xray 核心](https://claude.ai/chat/330ff6f5-347a-4826-9b50-fc68e6004355#02-%E5%AE%89%E8%A3%85-xray-%E6%A0%B8%E5%BF%83)
- [03 VLESS 配置文件](https://claude.ai/chat/330ff6f5-347a-4826-9b50-fc68e6004355#03-vless-%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)
- [04 分流路由规则](https://claude.ai/chat/330ff6f5-347a-4826-9b50-fc68e6004355#04-%E5%88%86%E6%B5%81%E8%B7%AF%E7%94%B1%E8%A7%84%E5%88%99)
- [05 安装 Web 管理面板](https://claude.ai/chat/330ff6f5-347a-4826-9b50-fc68e6004355#05-%E5%AE%89%E8%A3%85-web-%E7%AE%A1%E7%90%86%E9%9D%A2%E6%9D%BF)
- [06 启动服务 & 配置系统代理](https://claude.ai/chat/330ff6f5-347a-4826-9b50-fc68e6004355#06-%E5%90%AF%E5%8A%A8%E6%9C%8D%E5%8A%A1--%E9%85%8D%E7%BD%AE%E7%B3%BB%E7%BB%9F%E4%BB%A3%E7%90%86)
- [07 验证与常用命令](https://claude.ai/chat/330ff6f5-347a-4826-9b50-fc68e6004355#07-%E9%AA%8C%E8%AF%81%E4%B8%8E%E5%B8%B8%E7%94%A8%E5%91%BD%E4%BB%A4)
- [08 故障排查](https://claude.ai/chat/330ff6f5-347a-4826-9b50-fc68e6004355#08-%E6%95%85%E9%9A%9C%E6%8E%92%E6%9F%A5)

---

## 01 工作原理与架构

Xray 在本机启动一个 SOCKS5/HTTP 代理端口，应用程序的请求经过 Xray 时，根据路由规则决定走代理隧道还是直连。

```
应用程序请求
     │
     ▼
[ Xray 本地端口 :10808 ]
     │
     ▼
[ 路由规则引擎 ]
    / \
   /   \
  ▼     ▼
直连    VLESS 隧道
国内        │
域名        ▼
私有   [ California VPS ]
IP          │
            ▼
        目标服务器
```

|流量类型|处理方式|示例|
|---|---|---|
|国内流量|直连，不走代理|baidu.com, bilibili.com, CN IP|
|国际流量|通过 California VPS|google.com, github.com|
|局域网|直连，不走代理|192.168.x.x, 10.x.x.x|

---

## 02 安装 Xray 核心

### 方法一：官方脚本（推荐）

脚本会自动识别 x86_64 / ARM / ARM64 架构，Debian 和树莓派均适用。

```bash
# 安装 Xray
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install

# 验证安装
xray version
```

安装完成后的文件位置：

|路径|说明|
|---|---|
|`/usr/local/bin/xray`|可执行文件|
|`/usr/local/etc/xray/config.json`|主配置文件|
|`/usr/local/share/xray/`|GeoIP / GeoSite 数据库|
|`/etc/systemd/system/xray.service`|系统服务文件|

---

### 方法二：手动安装（树莓派离线或网络受限）

```bash
# 查看架构
uname -m
# aarch64 → ARM64（树莓派 4/5）
# armv7l  → ARM32（树莓派 3）

# ARM64 下载
wget https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-arm64-v8a.zip

# ARM32 下载
wget https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-arm32-v7a.zip

# 解压并安装
unzip Xray-linux-*.zip -d xray-tmp
sudo mv xray-tmp/xray /usr/local/bin/xray
sudo chmod +x /usr/local/bin/xray

# 创建目录
sudo mkdir -p /usr/local/etc/xray
sudo mkdir -p /usr/local/share/xray

# 下载 GeoIP / GeoSite 数据库
sudo wget -O /usr/local/share/xray/geoip.dat \
  https://github.com/v2fly/geoip/releases/latest/download/geoip.dat

sudo wget -O /usr/local/share/xray/geosite.dat \
  https://github.com/v2fly/domain-list-community/releases/latest/download/dlc.dat
```

手动创建 systemd 服务文件：

```bash
sudo tee /etc/systemd/system/xray.service << 'EOF'
[Unit]
Description=Xray Service
After=network.target nss-lookup.target

[Service]
User=nobody
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE
NoNewPrivileges=true
ExecStart=/usr/local/bin/xray run -config /usr/local/etc/xray/config.json
Restart=on-failure
RestartPreventExitStatus=23

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
```

---

## 03 VLESS 配置文件

编辑主配置文件：

```bash
sudo nano /usr/local/etc/xray/config.json
```

> **提示**：在 v2rayN 中右键节点 → **编辑服务器** 可查看所有参数（UUID、地址、端口、路径等）；或右键 → **导出所选服务器为客户端配置** 直接得到完整 JSON。

---

### VLESS + WebSocket + TLS（最常见）

将 `# 替换` 注释处的 4 个占位符替换为你的实际信息。

```json
{
  "log": {
    "loglevel": "warning"
  },

  "inbounds": [
    {
      "port": 10808,
      "listen": "127.0.0.1",
      "protocol": "socks",
      "settings": {
        "auth": "noauth",
        "udp": true
      },
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"]
      }
    },
    {
      "port": 10809,
      "listen": "127.0.0.1",
      "protocol": "http",
      "settings": {}
    }
  ],

  "outbounds": [
    {
      "tag": "proxy",
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": "你的VPS域名或IP",    // 替换
            "port": 443,                     // 替换（你的实际端口）
            "users": [
              {
                "id": "你的UUID",            // 替换
                "encryption": "none",
                "flow": ""
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "ws",
        "security": "tls",
        "tlsSettings": {
          "serverName": "你的VPS域名"        // 替换
        },
        "wsSettings": {
          "path": "/你的WS路径",             // 替换
          "headers": {
            "Host": "你的VPS域名"
          }
        }
      }
    },
    {
      "tag": "direct",
      "protocol": "freedom",
      "settings": {}
    },
    {
      "tag": "block",
      "protocol": "blackhole",
      "settings": {}
    }
  ],

  "routing": {
    "domainStrategy": "IPIfNonMatch",
    "rules": []
  }
}
```

---

### VLESS + TCP（无 TLS）

将 `streamSettings` 部分替换为：

```json
"streamSettings": {
  "network": "tcp",
  "security": "none"
}
```

---

### VLESS + REALITY（新一代，抗检测性更强）

将 `streamSettings` 部分替换为，并将 `flow` 设置为 `xtls-rprx-vision`：

```json
"streamSettings": {
  "network": "tcp",
  "security": "reality",
  "realitySettings": {
    "serverName": "伪装域名（如 www.apple.com）",
    "fingerprint": "chrome",
    "publicKey": "服务端公钥",
    "shortId": "shortId"
  }
},
// users 中的 flow 改为：
"flow": "xtls-rprx-vision"
```

---

## 04 分流路由规则

将以下内容替换配置文件中的 `"rules": []`。

```json
"routing": {
  "domainStrategy": "IPIfNonMatch",
  "rules": [

    {
      // 规则 1：局域网和回环地址直连
      "type": "field",
      "ip": [
        "127.0.0.0/8",
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16"
      ],
      "outboundTag": "direct"
    },

    {
      // 规则 2：中国大陆域名直连（GeoSite 数据库）
      "type": "field",
      "domain": [
        "geosite:cn",
        "geosite:private"
      ],
      "outboundTag": "direct"
    },

    {
      // 规则 3：中国大陆 IP 直连（GeoIP 数据库）
      "type": "field",
      "ip": [
        "geoip:cn",
        "geoip:private"
      ],
      "outboundTag": "direct"
    },

    {
      // 规则 4：其余流量走代理（兜底规则）
      "type": "field",
      "network": "tcp,udp",
      "outboundTag": "proxy"
    }

  ]
}
```

### 自定义规则示例

自定义规则需插入到 `geosite:cn` 规则**之前**才能生效（规则从上到下匹配，命中即停止）。

```json
// 强制某个域名走代理
{
  "type": "field",
  "domain": ["github.com", "domain:openai.com"],
  "outboundTag": "proxy"
}

// 强制某个 IP 段直连
{
  "type": "field",
  "ip": ["1.2.3.4/32"],
  "outboundTag": "direct"
}

// 按端口分流（如 53 DNS 直连）
{
  "type": "field",
  "port": "53",
  "outboundTag": "direct"
}
```

|规则类型|示例|说明|
|---|---|---|
|`domain` + `geosite:cn`|—|中国大陆域名库|
|`ip` + `geoip:cn`|—|中国大陆 IP 库|
|`DOMAIN-SUFFIX`|`"suffix:baidu.com"`|域名后缀匹配|
|`domain:`|`"domain:openai.com"`|匹配域名及所有子域名|
|`ip`|`"1.2.3.0/24"`|IP 段匹配|
|`port`|`"443"` 或 `"8000-9000"`|端口或端口范围|

---

## 05 安装 Web 管理面板

### 方案 A：yacd 实时流量面板（本机客户端）

用于可视化查看当前连接走了哪条规则、实时流量统计。

**第一步：配置文件中添加 API**

在 `config.json` 根层级添加以下字段：

```json
"api": {
  "tag": "api",
  "services": ["HandlerService", "LoggerService", "StatsService"]
},

"stats": {},

"policy": {
  "levels": {
    "0": {
      "statsUserUplink": true,
      "statsUserDownlink": true
    }
  },
  "system": {
    "statsInboundUplink": true,
    "statsInboundDownlink": true
  }
}
```

在 `inbounds` 数组中新增一个 API 入站：

```json
{
  "listen": "127.0.0.1",
  "port": 10085,
  "protocol": "dokodemo-door",
  "settings": {
    "address": "127.0.0.1"
  },
  "tag": "api"
}
```

在 `routing.rules` 最前面新增：

```json
{
  "inboundTag": ["api"],
  "outboundTag": "api",
  "type": "field"
}
```

**第二步：运行 yacd 面板**

```bash
# 下载 yacd
wget https://github.com/haishanh/yacd/releases/latest/download/yacd.tar.xz
tar -xf yacd.tar.xz

# 用 Python 简单托管（无需安装 Node.js）
cd public
python3 -m http.server 8080
```

浏览器打开 `http://设备IP:8080`，后端地址填写 `http://127.0.0.1:10085`。

---

### 方案 B：3X-UI 服务端管理面板（在 VPS 上安装）

3X-UI 主要用于服务端节点管理，如果需要在 VPS 上可视化管理入站配置，在 **VPS 上** 执行：

```bash
bash <(curl -Ls https://raw.githubusercontent.com/MHSanaei/3x-ui/master/install.sh)

# 安装完成后访问：http://你的VPS_IP:2053
# 默认账号/密码：admin / admin（安装后立即修改）
```

> **安全建议**：安装后修改默认密码，并在面板设置中配置自定义 URL 路径，避免管理界面直接暴露在公网。

---

## 06 启动服务 & 配置系统代理

### 启动 Xray

```bash
# 启动并设置开机自启
sudo systemctl enable xray
sudo systemctl start xray

# 查看运行状态
sudo systemctl status xray

# 修改 config.json 后重新加载（无需重启）
sudo systemctl reload xray
```

---

### 配置代理环境变量

**当前用户（推荐）**：写入 `~/.bashrc` 或 `~/.zshrc`

```bash
cat >> ~/.bashrc << 'EOF'

# Xray Proxy
export http_proxy=http://127.0.0.1:10809
export https_proxy=http://127.0.0.1:10809
export ALL_PROXY=socks5://127.0.0.1:10808
export no_proxy="localhost,127.0.0.1,192.168.0.0/16,10.0.0.0/8"

# 快捷开关函数
proxy_on() {
  export http_proxy=http://127.0.0.1:10809
  export https_proxy=http://127.0.0.1:10809
  export ALL_PROXY=socks5://127.0.0.1:10808
  echo "✓ 代理已开启"
}

proxy_off() {
  unset http_proxy https_proxy ALL_PROXY
  echo "✗ 代理已关闭"
}
EOF

source ~/.bashrc
```

**全局系统代理**（所有用户生效）：

```bash
sudo tee -a /etc/environment << 'EOF'
http_proxy=http://127.0.0.1:10809
https_proxy=http://127.0.0.1:10809
no_proxy=localhost,127.0.0.1,192.168.0.0/16
EOF
```

**APT 单独配置代理**（`sudo apt` 默认不读取用户环境变量）：

```bash
sudo tee /etc/apt/apt.conf.d/proxy.conf << 'EOF'
Acquire::http::Proxy "http://127.0.0.1:10809/";
Acquire::https::Proxy "http://127.0.0.1:10809/";
EOF
```

---

## 07 验证与常用命令

### 验证代理是否工作

```bash
# 查看代理出口 IP（应显示 California VPS 的 IP）
curl --proxy socks5://127.0.0.1:10808 https://ip.sb

# 查看直连出口 IP（应显示本机/本地网络出口）
curl https://ip.sb

# 测试 Google 连通性
curl --proxy socks5://127.0.0.1:10808 https://www.google.com -I

# 测试国内域名走直连（响应速度应明显更快）
curl --proxy socks5://127.0.0.1:10808 https://www.baidu.com -I
```

### 常用运维命令

```bash
# 查看实时日志
sudo journalctl -u xray -f

# 检查配置文件语法（修改后先执行此步）
xray -test -config /usr/local/etc/xray/config.json

# 重启服务
sudo systemctl restart xray

# 更新 GeoIP / GeoSite 数据库（建议每月执行一次）
sudo wget -O /usr/local/share/xray/geoip.dat \
  https://github.com/v2fly/geoip/releases/latest/download/geoip.dat
sudo wget -O /usr/local/share/xray/geosite.dat \
  https://github.com/v2fly/domain-list-community/releases/latest/download/dlc.dat
sudo systemctl restart xray

# 更新 Xray 本体
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install
```

---

## 08 故障排查

|问题现象|排查命令|常见原因|
|---|---|---|
|服务启动失败|`journalctl -u xray -n 50`|JSON 语法错误；端口被占用|
|连接代理超时|检查 UUID / 地址 / 端口|配置参数错误；VPS 防火墙|
|国内网站走了代理|检查路由规则顺序|geosite/geoip 文件缺失|
|DNS 泄漏|确认 `sniffing` 已开启|未启用域名嗅探|
|curl 不走代理|检查环境变量是否生效|`source ~/.bashrc` 未执行|

### 快速诊断流程

```bash
# 第一步：确认服务运行中
sudo systemctl status xray

# 第二步：检查配置语法
xray -test -config /usr/local/etc/xray/config.json

# 第三步：确认代理连通
curl --proxy socks5://127.0.0.1:10808 https://ip.sb

# 第四步：查看实时错误日志
sudo journalctl -u xray -f
```

---

## 配置完成检查清单

- [ ] Xray 已安装，`xray version` 正常输出
- [ ] `config.json` 已填写 VPS 地址 / UUID / 路径
- [ ] `xray -test -config` 语法检查通过
- [ ] `systemctl enable xray` 已设置开机自启
- [ ] `curl --proxy socks5://127.0.0.1:10808 https://ip.sb` 返回 VPS 的 IP
- [ ] `~/.bashrc` 已添加代理环境变量
- [ ] 国内域名（baidu.com）直连正常，速度快
- [ ] 国际域名（google.com）通过代理访问正常

---

_基于 [Xray-core](https://github.com/XTLS/Xray-core) by XTLS_