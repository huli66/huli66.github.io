# 树莓派 4B 个人服务器完整部署指南

> 适用设备：Raspberry Pi 4B 8GB  
> 用途：全栈学习、中间件练习、个人服务托管  
> 网络环境：中国大陆  
> 更新日期：2025年

---

## 目录

1. [系统选择与烧录](#一系统选择与烧录)
2. [系统初始化](#二系统初始化)
3. [国内网络问题总览](#三国内网络问题总览)
4. [Docker 安装与配置](#四docker-安装与配置)
5. [核心中间件部署](#五核心中间件部署)
6. [性能监控与网络测速](#六性能监控与网络测速)
7. [推荐附加服务](#七推荐附加服务)
8. [完整 docker-compose.yml](#八完整-docker-composeyml)
9. [远程访问方案](#九远程访问方案)
10. [稳定性与维护](#十稳定性与维护)
11. [学习路径建议](#十一学习路径建议)
12. [快速参考清单](#十二快速参考清单)

---

## 一、系统选择与烧录

### 推荐系统

**Raspberry Pi OS Lite (64-bit)**（基于 Debian Bookworm）

- 无桌面环境，省资源（省出来的内存给服务用）
- 官方支持最好，社区资源丰富
- 64 位对 Java 系服务（Kafka）更友好

### 烧录步骤

1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)（官网在国内可正常访问）
2. 选择 **Raspberry Pi OS Lite (64-bit)**
3. 点击右下角 **编辑设置**（齿轮图标），提前配置好以下内容（避免烧录后还要接显示器）：
   - **Hostname**：`homepi`（局域网通过 `homepi.local` 访问）
   - **开启 SSH**：选择「允许公钥认证」，粘贴你的公钥（更安全）
   - **用户名/密码**：设置一个非 `pi` 的用户名
   - **WiFi**：可以配置，但**强烈建议用网线**，长期运行稳定性差异显著
   - **时区**：`Asia/Shanghai`
4. 写入 SD 卡，插入树莓派，通电启动

首次启动等待约 1 分钟后，SSH 连入：

```bash
ssh 你的用户名@homepi.local
# 或通过路由器后台查询 IP 后：
ssh 你的用户名@192.168.1.xxx
```

> ⚠️ **强烈建议**：用 USB 外接 SSD 存放数据，SD 卡只装系统。长期高频读写会损坏 SD 卡，数据丢失风险极高。

---

## 二、系统初始化

SSH 进入树莓派后，**按顺序**执行以下步骤。

### 1. 换国内 APT 镜像源（第一步，后续 apt 操作都会更快）

```bash
# 备份原始源
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 替换为中科大源（Debian Bookworm）
sudo tee /etc/apt/sources.list <<'EOF'
deb https://mirrors.ustc.edu.cn/debian/ bookworm main contrib non-free non-free-firmware
deb https://mirrors.ustc.edu.cn/debian/ bookworm-updates main contrib non-free non-free-firmware
deb https://mirrors.ustc.edu.cn/debian-security bookworm-security main contrib non-free non-free-firmware
EOF

sudo apt update
```

> 备选：阿里云（`mirrors.aliyun.com/debian`）、清华（`mirrors.tuna.tsinghua.edu.cn/debian`），三选一即可。

### 2. 更新系统

```bash
sudo apt full-upgrade -y
sudo reboot
```

重启后重新 SSH 连入。

### 3. 安装基础工具

```bash
sudo apt install -y git curl wget vim htop net-tools ufw fail2ban \
  ca-certificates gnupg lsb-release apt-transport-https
```

### 4. 配置固定局域网 IP

避免路由器重启后树莓派 IP 变动。Raspberry Pi OS Bookworm 已从 `dhcpcd` 迁移到 `NetworkManager`：

```bash
# 查看当前网络接口和连接名
nmcli con show

# 设置固定 IP（将 192.168.1.100 改为你期望的地址，确保不与其他设备冲突）
sudo nmcli con mod "Wired connection 1" \
  ipv4.addresses "192.168.1.100/24" \
  ipv4.gateway "192.168.1.1" \
  ipv4.dns "114.114.114.114,223.5.5.5" \
  ipv4.method manual

sudo nmcli con up "Wired connection 1"

# 验证
ip addr show eth0
```

> 如果上面命令报错找不到连接，先用 `nmcli con show` 查看当前连接名称，替换 `"Wired connection 1"` 部分。

### 5. 配置 Swap

```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# 找到 CONF_SWAPSIZE=100，改为：CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# 验证
free -h
```

### 6. SSH 安全加固

```bash
sudo nano /etc/ssh/sshd_config
```

修改或添加以下内容（**务必确保已配置 SSH 密钥再禁用密码登录，否则会把自己锁在外面**）：

```
Port 2222                      # 改为非默认端口，减少被扫描
PermitRootLogin no             # 禁止 root 登录
PasswordAuthentication no      # 禁用密码登录（已有密钥后再开启）
MaxAuthTries 3
```

```bash
sudo systemctl restart ssh

# 先允许新端口，再启用防火墙
sudo ufw allow 2222/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable
sudo ufw status

# 验证新端口可以连接后，再关闭旧的 22 端口
sudo ufw delete allow 22/tcp
```

> ⚠️ 修改端口后，连接命令变为：`ssh -p 2222 用户名@IP`

### 7. 设置时区

```bash
sudo timedatectl set-timezone Asia/Shanghai
timedatectl  # 验证
```

### 8. 配置 USB SSD（强烈推荐）

```bash
# 查看磁盘（SSD 通常是 /dev/sda）
lsblk

# 如果是新盘，先分区
sudo fdisk /dev/sda
# 进入 fdisk 后：g（新建GPT分区表）→ n（新建分区）→ 回车三次接受默认 → w（写入）

# 格式化
sudo mkfs.ext4 /dev/sda1

# 创建挂载点
sudo mkdir -p /mnt/ssd

# 获取 UUID
sudo blkid /dev/sda1
# 记下类似 "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 的 UUID

# 配置开机自动挂载
echo 'UUID=你的UUID    /mnt/ssd    ext4    defaults,noatime    0    2' | sudo tee -a /etc/fstab

# 立即挂载并验证
sudo mount -a
df -h | grep ssd
```

### 9. 创建服务工作目录

```bash
# 在 SSD 上创建目录（无 SSD 则改为 ~/services）
sudo mkdir -p /mnt/ssd/services
sudo chown -R $USER:$USER /mnt/ssd/services

# 在 home 目录创建软链接
ln -s /mnt/ssd/services ~/services

# 创建子目录结构
mkdir -p ~/services/{data/{mysql,redis,rabbitmq,zookeeper,kafka,prometheus,grafana,portainer,uptime-kuma,speedtest,gitea,code-server},nginx/{conf.d,html},prometheus,backups}
```

---

## 三、国内网络问题总览

在中国大陆部署时，以下场景会遭遇网络问题，各章节会给出对应解决方案：

| 操作 | 问题 | 解决方案 |
|------|------|----------|
| `apt install` | 默认源在境外，慢 | 换国内 APT 镜像（第二章已处理）|
| 安装 Docker | `get.docker.com` 脚本访问受限 | 使用阿里云 Docker 安装源 |
| `docker pull` | Docker Hub 被限速甚至无法访问 | 配置国内 Docker 镜像加速 |
| 安装 Tailscale | 官方脚本可能受限 | 手动下载 deb 安装包 |
| 使用 Tailscale | DERP 中继在境外，中继时延迟高 | IPv6 直连 / 换 Headscale / 用 FRP |
| 安装 cloudflared | GitHub Release 限速 | 使用 GitHub 镜像代理下载 |
| 使用 Cloudflare Tunnel | CF 国内节点速度不稳定 | 接受延迟，或用 FRP 替代 |
| `pip install` | PyPI 访问慢 | 换清华或阿里 pip 镜像 |
| `npm install` | npm 官方源慢 | 换 taobao 或华为 npm 镜像 |

**pip 国内镜像配置**：

```bash
pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/
```

**npm 国内镜像配置**：

```bash
npm config set registry https://registry.npmmirror.com
```

---

## 四、Docker 安装与配置

### 4.1 安装 Docker（使用阿里云源）

官方 `get.docker.com` 脚本在国内访问不稳定，改用阿里云镜像源安装：

```bash
# 步骤 1：添加 Docker 的 GPG 密钥（走阿里云）
sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/debian/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 步骤 2：添加 Docker APT 软件源（走阿里云）
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://mirrors.aliyun.com/docker-ce/linux/debian \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 步骤 3：安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# 步骤 4：将当前用户加入 docker 组（之后执行 docker 命令无需 sudo）
sudo usermod -aG docker $USER
newgrp docker   # 立即生效，或重新登录

# 步骤 5：验证安装
docker version
docker compose version
```

### 4.2 配置 Docker 镜像加速（关键步骤，拉取镜像不走墙外）

```bash
sudo mkdir -p /etc/docker

sudo tee /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://dockerpull.org",
    "https://docker.1panel.live",
    "https://hub.rat.dev",
    "https://docker.m.daocloud.io"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker

# 验证加速是否生效
docker info | grep -A 5 "Registry Mirrors"
```

> ⚠️ **注意**：国内 Docker 镜像站更迭频繁，如果拉取失败，搜索「Docker 镜像加速 2025」找最新可用地址，替换上面的 `registry-mirrors` 列表。

### 4.3 测试镜像拉取

```bash
docker pull alpine
docker run --rm alpine echo "Docker 运行正常"
```

### 4.4 配置开机自启（安装后默认已启用，验证一下）

```bash
sudo systemctl is-enabled docker
# 应输出 enabled

# 如果不是：
sudo systemctl enable docker
```

---

## 五、核心中间件部署

所有服务通过第八章的 `docker-compose.yml` 统一管理，这里说明各服务的关键配置点和验证方法。

### MySQL 8.0

- **端口**：`3306`
- `MYSQL_ROOT_HOST: '%'` 允许从任意 IP 连接（局域网内可用，不要暴露到公网）
- 默认字符集 utf8mb4，支持 Emoji

```bash
# 验证连接
docker exec -it mysql mysql -uroot -pYOUR_MYSQL_PASSWORD -e "show databases;"
```

### Redis 7

- **端口**：`6379`
- 开启 AOF 持久化（`appendonly yes`），重启后数据不丢失
- 设置 `maxmemory 256mb`，防止 Redis 把内存全吃掉

```bash
# 验证连接
docker exec -it redis redis-cli -a YOUR_REDIS_PASSWORD ping
# 返回 PONG 即正常
```

### RabbitMQ 3

- **端口**：`5672`（AMQP 协议）、`15672`（Web 管理界面）
- 访问 `http://树莓派IP:15672`，账号是 compose 中配置的 `admin / YOUR_PASSWORD`

### Kafka（含 Zookeeper）

- **端口**：`9092`
- **重要**：必须将 `KAFKA_ADVERTISED_LISTENERS` 中的 IP 改为你的树莓派**局域网 IP**，否则从其他机器无法连接
- Kafka 约占 512MB，Zookeeper 约占 256MB，合计约 800MB，**学习初期按需启动**

```bash
# 按需启动 Kafka
docker compose up -d zookeeper kafka

# 创建测试 topic
docker exec -it kafka kafka-topics \
  --create --topic test \
  --bootstrap-server localhost:9092 \
  --partitions 1 --replication-factor 1

# 列出所有 topic
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Nginx

- **端口**：`80`、`443`
- 配置文件目录：`~/services/nginx/conf.d/`，在此目录创建 `.conf` 文件即可
- 创建默认配置 `~/services/nginx/conf.d/default.conf`：

```nginx
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;  # 支持 Vue/React 前端路由
    }

    # 反向代理后端 API（示例）
    location /api/ {
        proxy_pass http://你的后端容器名:端口/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

修改配置后无需重启容器，直接重载：

```bash
docker exec nginx nginx -s reload
```

---

## 六、性能监控与网络测速

### 6.1 Prometheus + Grafana + Node Exporter

**这是业界标准的开源监控技术栈**，同时也是全栈工程师需要了解的生产级监控方案。

- **Node Exporter**：以 agent 形式采集树莓派的 CPU、内存、磁盘、网络、温度等数十种指标
- **Prometheus**：时序数据库，每 15 秒从 Node Exporter 抓取一次数据存储
- **Grafana**：可视化面板，连接 Prometheus 展示数据

**启动前必须先创建 Prometheus 配置文件**：

```bash
tee ~/services/prometheus/prometheus.yml <<'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF
```

**Grafana 初次配置步骤**（访问 `http://树莓派IP:3000`）：

1. 用 `admin` + 你设置的密码登录
2. 左侧菜单 → **Connections** → **Data Sources** → **Add data source** → 选 **Prometheus**
3. URL 填 `http://prometheus:9090`（容器间通过服务名通信），点 **Save & Test**
4. 左侧菜单 → **Dashboards** → **Import** → 输入模板 ID **`1860`** → 选择上面的数据源 → 导入
5. 即可看到完整的系统监控面板，包含 CPU 使用率、内存、磁盘 IO、网络流量、CPU 温度等

### 6.2 网络测速：Speedtest Tracker

自动定时运行 Speedtest，记录历史数据，可查看宽带在不同时段的速度趋势，适合监控家庭宽带稳定性。

**首次使用前生成 APP_KEY**：

```bash
# 生成随机 key，将输出内容复制备用
openssl rand -base64 32
```

将生成的字符串（如 `abc123xyz...`）填入 compose 文件 `APP_KEY` 字段，格式为 `base64:你生成的key`。

访问 `http://树莓派IP:8765`，进入设置配置测速计划（建议每小时一次）。

---

## 七、推荐附加服务

### 🗂️ 开发工具类

| 服务 | 端口 | 说明 | 推荐指数 |
|------|------|------|----------|
| **Portainer** | 9000 | Docker 可视化管理，查看容器状态、日志、资源占用 | ⭐⭐⭐⭐⭐ 必装 |
| **Adminer** | 8088 | 轻量数据库管理界面，支持 MySQL，比 phpMyAdmin 轻很多 | ⭐⭐⭐⭐⭐ 必装 |
| **Dozzle** | 8084 | 实时查看所有 Docker 容器日志的 Web 界面，调试利器 | ⭐⭐⭐⭐ |
| **code-server** | 8080 | 浏览器里的 VS Code，外出时也能写代码 | ⭐⭐⭐⭐ |
| **Gitea** | 3001 | 自建 Git 服务，配合 code-server 构成完整开发闭环 | ⭐⭐⭐⭐ |

### 📊 监控运维类

| 服务 | 端口 | 说明 | 推荐指数 |
|------|------|------|----------|
| **Uptime Kuma** | 3002 | 服务可用性监控，支持企业微信/Telegram/邮件告警 | ⭐⭐⭐⭐⭐ 必装 |

### 📁 文件与存储类

| 服务 | 端口 | 说明 | 推荐指数 |
|------|------|------|----------|
| **Filebrowser** | 8081 | Web 文件管理器，上传下载树莓派文件 | ⭐⭐⭐ |
| **Nextcloud** | 8082 | 自建网盘，文件同步备份，较重但 8G 内存可以跑 | ⭐⭐⭐ |

### 🔒 安全类

| 服务 | 端口 | 说明 | 推荐指数 |
|------|------|------|----------|
| **Vaultwarden** | 8083 | 自建 Bitwarden 兼容密码管理器 | ⭐⭐⭐⭐ |

---

## 八、完整 docker-compose.yml

将以下内容保存为 `~/services/docker-compose.yml`。

**启动前务必替换所有占位符**：
- `YOUR_MYSQL_PASSWORD` / `YOUR_REDIS_PASSWORD` 等 → 各服务实际密码
- `192.168.1.100` → 树莓派的实际局域网 IP
- `YOUR_SPEEDTEST_APP_KEY` → `openssl rand -base64 32` 生成的 key

```yaml
version: '3.8'

networks:
  pi-net:
    driver: bridge

services:

  # =============================================
  # 核心中间件
  # =============================================

  mysql:
    image: mysql:8.0
    container_name: mysql
    restart: always
    networks: [pi-net]
    environment:
      MYSQL_ROOT_PASSWORD: YOUR_MYSQL_PASSWORD
      MYSQL_ROOT_HOST: '%'
    ports:
      - "3306:3306"
    volumes:
      - ./data/mysql:/var/lib/mysql
    command: >
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: redis
    restart: always
    networks: [pi-net]
    ports:
      - "6379:6379"
    volumes:
      - ./data/redis:/data
    command: >
      redis-server
      --requirepass YOUR_REDIS_PASSWORD
      --appendonly yes
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "YOUR_REDIS_PASSWORD", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq
    restart: always
    networks: [pi-net]
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: YOUR_RABBITMQ_PASSWORD
    volumes:
      - ./data/rabbitmq:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 15s
      timeout: 10s
      retries: 5

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: zookeeper
    restart: always
    networks: [pi-net]
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    volumes:
      - ./data/zookeeper:/var/lib/zookeeper

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka
    restart: always
    networks: [pi-net]
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      # 将下面的 IP 改为你的树莓派局域网 IP（必须修改）
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://192.168.1.100:9092
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_LOG_RETENTION_HOURS: 24
      KAFKA_LOG_SEGMENT_BYTES: 104857600
      # 限制 JVM 内存，适配树莓派
      KAFKA_HEAP_OPTS: "-Xmx512m -Xms256m"
    volumes:
      - ./data/kafka:/var/lib/kafka/data

  nginx:
    image: nginx:alpine
    container_name: nginx
    restart: always
    networks: [pi-net]
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/html:/usr/share/nginx/html
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

  # =============================================
  # 监控与测速
  # =============================================

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: always
    networks: [pi-net]
    pid: host
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    expose:
      - 9100

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: always
    networks: [pi-net]
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./data/prometheus:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=15d'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'
    user: "65534:65534"

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: always
    networks: [pi-net]
    ports:
      - "3000:3000"
    volumes:
      - ./data/grafana:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: YOUR_GRAFANA_PASSWORD
      GF_USERS_ALLOW_SIGN_UP: "false"
    depends_on:
      - prometheus

  speedtest-tracker:
    image: lscr.io/linuxserver/speedtest-tracker:latest
    container_name: speedtest-tracker
    restart: always
    networks: [pi-net]
    ports:
      - "8765:80"
    environment:
      - PUID=1000
      - PGID=1000
      - APP_KEY=base64:YOUR_SPEEDTEST_APP_KEY
      - DB_CONNECTION=sqlite
      - SPEEDTEST_SCHEDULE=0 * * * *
    volumes:
      - ./data/speedtest:/config

  # =============================================
  # 运维工具（必装）
  # =============================================

  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: always
    networks: [pi-net]
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data/portainer:/data

  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: uptime-kuma
    restart: always
    networks: [pi-net]
    ports:
      - "3002:3001"
    volumes:
      - ./data/uptime-kuma:/app/data

  adminer:
    image: adminer:latest
    container_name: adminer
    restart: always
    networks: [pi-net]
    ports:
      - "8088:8080"
    environment:
      ADMINER_DEFAULT_SERVER: mysql

  dozzle:
    image: amir20/dozzle:latest
    container_name: dozzle
    restart: always
    networks: [pi-net]
    ports:
      - "8084:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

  # =============================================
  # 开发工具（按需启用，restart: unless-stopped）
  # =============================================

  gitea:
    image: gitea/gitea:latest
    container_name: gitea
    restart: unless-stopped
    networks: [pi-net]
    ports:
      - "3001:3000"
      - "2222:22"
    volumes:
      - ./data/gitea:/data
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__server__DOMAIN=192.168.1.100
      - GITEA__server__ROOT_URL=http://192.168.1.100:3001/
      - GITEA__server__SSH_PORT=2222

  code-server:
    image: lscr.io/linuxserver/code-server:latest
    container_name: code-server
    restart: unless-stopped
    networks: [pi-net]
    ports:
      - "8080:8443"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Shanghai
      - PASSWORD=YOUR_CODE_SERVER_PASSWORD
      - SUDO_PASSWORD=YOUR_CODE_SERVER_PASSWORD
      - DEFAULT_WORKSPACE=/config/workspace
    volumes:
      - ./data/code-server:/config
      - /mnt/ssd/projects:/config/workspace
```

**分批启动建议**（避免内存不足）：

```bash
cd ~/services

# 第一批：核心中间件
docker compose up -d mysql redis rabbitmq nginx
docker compose ps   # 等待所有 healthy

# 第二批：监控
docker compose up -d node-exporter prometheus grafana speedtest-tracker

# 第三批：运维工具
docker compose up -d portainer uptime-kuma adminer dozzle

# 按需：Kafka（内存大户）
docker compose up -d zookeeper kafka

# 按需：开发工具
docker compose up -d gitea code-server

# 查看所有容器状态
docker compose ps

# 实时查看资源占用
docker stats --no-stream
```

---

## 九、远程访问方案

### 9.1 方案对比与选择

| 方案 | 适合场景 | 国内可用性 | 速度 | 需要 VPS | 费用 |
|------|----------|-----------|------|----------|------|
| **Tailscale** | 个人访问所有服务 | ⚠️ 需手动安装，中继延迟高 | P2P 快，中继慢 | 否 | 免费 |
| **Headscale** | 完全自建，不依赖境外服务 | ✅ 完全可控 | 快 | 境外 VPS | 免费 |
| **FRP** | 最稳定、速度最快的穿透 | ✅ 完全可用 | 很快 | 国内 VPS | VPS 费用 |
| **Cloudflare Tunnel** | 对外公开展示 Web 应用 | ⚠️ 速度不稳定 | 中等 | 否 | 免费 |

**选择建议**：
- **有国内 VPS** → **FRP**，速度最佳，最适合日常使用
- **没有 VPS，接受一定延迟** → **Tailscale**，最省心
- **想完全自建** → **Headscale**（境外 VPS）
- **需要对外公开展示项目** → **Cloudflare Tunnel**（可与上面方案并用）

---

### 9.2 方案 A：Tailscale

基于 WireGuard，将所有设备组成虚拟局域网。在任何地方都能直接用 Tailscale IP 访问树莓派上的全部服务，无需针对每个服务单独配置。

#### 国内使用注意事项

- Tailscale 官网和控制面板（`admin.tailscale.com`）可以正常访问
- 安装包建议手动下载，官方脚本网络不稳定
- 两端都是 IPv4 NAT 时，流量会走 Tailscale 的 DERP 中继服务器，这些服务器大多在境外，延迟会比较高（通常 100-300ms）
- 如果你的家庭宽带支持 IPv6，且手机也支持 IPv6，大概率能 P2P 直连，延迟很低
- 检查家庭宽带是否有 IPv6：访问 `https://test-ipv6.com`

#### 在树莓派上安装 Tailscale

```bash
# 方式一：手动下载 ARM64 安装包（推荐，更稳定）
# 访问 https://pkgs.tailscale.com/stable/#debian-bookworm 确认最新版本号
# 将下面的版本号替换为最新版
TAILSCALE_VERSION="1.76.1"
wget "https://pkgs.tailscale.com/stable/debian/bookworm/pool/tailscale_${TAILSCALE_VERSION}_arm64.deb" \
  -O tailscale.deb

sudo dpkg -i tailscale.deb
sudo systemctl enable --now tailscaled

# 方式二：直接用官方脚本（网络好时可用）
curl -fsSL https://tailscale.com/install.sh | sh
```

```bash
# 启动并登录（会输出一个 URL，在浏览器中打开完成认证）
sudo tailscale up

# 查看分配的 Tailscale IP（100.x.x.x 段）
tailscale ip -4

# 查看所有设备连接状态
tailscale status
```

#### 在其他设备上安装 Tailscale

- **Windows / macOS**：官网下载安装，国内通常可以下载
- **iOS**：App Store 搜索 Tailscale（需要非大陆区 Apple ID）
- **Android**：官网下载 APK，或 Google Play

登录同一 Tailscale 账号后，即可从任何地方用树莓派的 Tailscale IP 访问所有服务：

```
http://100.x.x.x:9000   → Portainer
http://100.x.x.x:3000   → Grafana
http://100.x.x.x:15672  → RabbitMQ 管理界面
http://100.x.x.x:8765   → Speedtest
... 以此类推
```

#### Tailscale 进阶：开启 MagicDNS

在 Tailscale 控制台（`admin.tailscale.com`）的 DNS 设置中开启 **MagicDNS**，之后可以通过主机名访问，无需记 IP：

```
http://homepi:3000    → Grafana
http://homepi:9000    → Portainer
```

---

### 9.3 方案 B：Headscale（完全自建，需要一台 VPS）

Headscale 是 Tailscale 控制服务器的开源实现，部署在自己的 VPS 上，所有设备向自建的服务器注册，完全不依赖 Tailscale 官方服务。

**优点**：完全自主可控，没有设备数量限制，不受 Tailscale 服务状态影响  
**缺点**：需要一台 VPS，初次配置比 Tailscale 复杂

#### 在 VPS 上部署 Headscale

```bash
# 下载 headscale（VPS 通常是 x86_64）
wget https://github.com/juanfont/headscale/releases/latest/download/headscale_linux_amd64.deb
sudo dpkg -i headscale_linux_amd64.deb

# 编辑配置文件
sudo nano /etc/headscale/config.yaml
```

`config.yaml` 关键配置：

```yaml
# 替换为你的 VPS 公网 IP 或域名（建议用域名）
server_url: https://你的VPS域名或IP:8080
listen_addr: 0.0.0.0:8080
grpc_listen_addr: 127.0.0.1:50443

# 数据库（用 sqlite 即可）
db_type: sqlite3
db_path: /var/lib/headscale/db.sqlite

# 分配给设备的虚拟 IP 段
ip_prefixes:
  - 100.64.0.0/10

# 日志级别
log:
  level: warn
```

```bash
# 启动服务
sudo systemctl enable --now headscale

# 创建用户（命名空间，可以理解为账户）
headscale users create myuser

# 生成预授权 Key（在树莓派注册时使用，--reusable 允许多设备使用同一个 key）
headscale preauthkeys create --user myuser --reusable --expiration 24h
# 记下输出的 key

# 查看所有已注册设备
headscale nodes list
```

在 VPS 防火墙开放端口 `8080`（或你配置的端口）。

#### 在树莓派上连接 Headscale

树莓派上的 `tailscaled` 同样适用，只是把登录服务器指向你自建的 Headscale：

```bash
sudo tailscale up \
  --login-server=https://你的VPS域名:8080 \
  --authkey=你上面生成的preauthkey

# 验证连接
tailscale status
```

其他设备（电脑、手机）同理，都指向你的 Headscale 服务器注册，之后所有设备就在同一虚拟网络中了。

---

### 9.4 方案 C：FRP 内网穿透（推荐，有国内 VPS 首选）

FRP（Fast Reverse Proxy）通过在公网 VPS 上运行服务端，在树莓派上运行客户端，建立隧道将树莓派上的端口映射到 VPS 的公网端口。所有流量走国内中转，延迟极低，是国内环境下访问速度最好的方案。

#### 在 VPS（服务端）安装配置 frps

```bash
# 查看最新版本：https://github.com/fatedier/frp/releases
FRP_VERSION="0.61.0"

# 下载（VPS 用 amd64）
wget "https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_amd64.tar.gz"
tar -xf frp_*.tar.gz
sudo mv frp_*_linux_amd64 /opt/frp
```

创建服务端配置 `/opt/frp/frps.toml`：

```toml
# FRP 服务端监听端口（客户端连接此端口）
bindPort = 7000

# 认证 token，客户端必须一致
auth.token = "YOUR_STRONG_FRP_TOKEN"

# Web 管理界面（可选，只绑定本机，通过 SSH 隧道访问）
webServer.addr = "127.0.0.1"
webServer.port = 7500
webServer.user = "admin"
webServer.password = "YOUR_FRP_WEB_PASSWORD"

# 日志
log.to = "/opt/frp/frps.log"
log.level = "warn"
log.maxDays = 3
```

配置 systemd 服务：

```bash
sudo tee /etc/systemd/system/frps.service <<'EOF'
[Unit]
Description=FRP Server Service
After=network.target

[Service]
Type=simple
ExecStart=/opt/frp/frps -c /opt/frp/frps.toml
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now frps
sudo systemctl status frps
```

在 VPS 安全组 / 防火墙中开放以下端口：
- `7000`：FRP 服务端通信端口（TCP）
- 以及所有你想暴露的业务端口（如 `9000`、`3000`、`2200` 等）

#### 在树莓派（客户端）安装配置 frpc

```bash
FRP_VERSION="0.61.0"

# 下载（树莓派用 arm64）
wget "https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_arm64.tar.gz"

# 如果 GitHub 下载慢，使用镜像代理
wget "https://gh.llkk.cc/https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_arm64.tar.gz"

tar -xf frp_*.tar.gz
sudo mv frp_*_linux_arm64 /opt/frp
```

创建客户端配置 `/opt/frp/frpc.toml`：

```toml
# 填写你的 VPS 公网 IP 和端口
serverAddr = "你的VPS公网IP"
serverPort = 7000

# 必须与服务端一致
auth.token = "YOUR_STRONG_FRP_TOKEN"

log.to = "/opt/frp/frpc.log"
log.level = "warn"

# ---- 以下是端口映射配置 ----

# SSH 访问树莓派（通过 VPS_IP:2200 → 树莓派:22）
[[proxies]]
name = "ssh"
type = "tcp"
localIP = "127.0.0.1"
localPort = 22           # 如果你改了 SSH 端口，这里也要改
remotePort = 2200        # VPS 上对外暴露的端口

# Portainer（Docker 管理）
[[proxies]]
name = "portainer"
type = "tcp"
localIP = "127.0.0.1"
localPort = 9000
remotePort = 9000

# Grafana（监控面板）
[[proxies]]
name = "grafana"
type = "tcp"
localIP = "127.0.0.1"
localPort = 3000
remotePort = 3000

# Nginx（Web 应用）
[[proxies]]
name = "nginx-http"
type = "tcp"
localIP = "127.0.0.1"
localPort = 80
remotePort = 8888

# RabbitMQ 管理界面
[[proxies]]
name = "rabbitmq-mgmt"
type = "tcp"
localIP = "127.0.0.1"
localPort = 15672
remotePort = 15672

# Speedtest
[[proxies]]
name = "speedtest"
type = "tcp"
localIP = "127.0.0.1"
localPort = 8765
remotePort = 8765

# Uptime Kuma
[[proxies]]
name = "uptime-kuma"
type = "tcp"
localIP = "127.0.0.1"
localPort = 3002
remotePort = 3002
```

配置 systemd 服务：

```bash
sudo tee /etc/systemd/system/frpc.service <<'EOF'
[Unit]
Description=FRP Client Service
After=network.target

[Service]
Type=simple
ExecStart=/opt/frp/frpc -c /opt/frp/frpc.toml
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now frpc
sudo systemctl status frpc
```

验证连接：

```bash
# 在本地电脑执行，测试 SSH 是否通
ssh -p 2200 用户名@VPS公网IP

# 浏览器访问
# http://VPS公网IP:9000   → Portainer
# http://VPS公网IP:3000   → Grafana
# http://VPS公网IP:8888   → Nginx（你部署的 Web 应用）
```

> ⚠️ **安全提醒**：FRP 将服务暴露到公网，务必为每个服务设置强密码。建议在 VPS 防火墙中添加 IP 白名单，只允许你自己常用的 IP 访问这些端口。

---

### 9.5 方案 D：Cloudflare Tunnel（对外公开展示 Web 项目）

适合将某个 Web 项目通过 HTTPS 域名对外展示。**不适合日常私人访问**（国内 CF 节点速度不稳定），但对外展示时无需公网 IP，自动提供 HTTPS，很方便。

**前提条件**：拥有一个域名，并将其 DNS 托管到 Cloudflare（免费）。

#### 安装 cloudflared

```bash
# GitHub Release 下载，国内限速时使用镜像代理
ARCH="arm64"

# 方式一：直接从 GitHub 下载
wget "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb"

# 方式二：GitHub 镜像代理（限速时使用）
wget "https://gh.llkk.cc/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb"

sudo dpkg -i cloudflared-linux-${ARCH}.deb
cloudflared --version
```

#### 创建并配置 Tunnel

```bash
# 登录 Cloudflare（会输出一个授权 URL，在浏览器中打开并授权）
cloudflared tunnel login

# 创建 Tunnel
cloudflared tunnel create homepi

# 查看 Tunnel ID（记下来）
cloudflared tunnel list
```

创建配置文件 `~/.cloudflared/config.yml`：

```yaml
# 填入上面 `tunnel list` 显示的 Tunnel ID
tunnel: 你的TUNNEL_ID
credentials-file: /home/你的用户名/.cloudflared/你的TUNNEL_ID.json

ingress:
  # 将 home.yourdomain.com 指向本地 Nginx
  - hostname: home.yourdomain.com
    service: http://localhost:80

  # 将 grafana.yourdomain.com 指向 Grafana（按需添加）
  - hostname: grafana.yourdomain.com
    service: http://localhost:3000

  # 兜底规则（必须有，否则配置无效）
  - service: http_status:404
```

```bash
# 为 Tunnel 自动创建 Cloudflare DNS 记录（CNAME）
cloudflared tunnel route dns homepi home.yourdomain.com
cloudflared tunnel route dns homepi grafana.yourdomain.com

# 安装为系统服务并启动
sudo cloudflared service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```

配置完成后，访问 `https://home.yourdomain.com` 即可通过域名访问（Cloudflare 自动提供 HTTPS 证书，无需手动申请）。

---

## 十、稳定性与维护

### 10.1 散热

树莓派 4B 在高负载下容易过热降频，长期服务器使用必须处理好散热：

- **推荐**：铝合金外壳（被动散热）+ 小风扇（主动散热），安静且效果好
- **最低**：在芯片上贴散热片

```bash
# 查看当前温度（正常范围 40-65°C，超过 80°C 开始降频）
vcgencmd measure_temp

# 查看是否发生过降频
vcgencmd get_throttled
# 0x0 = 一切正常
# 非 0x0 = 发生过降频（过热或低压）
```

### 10.2 存储管理

```bash
# 检查磁盘剩余空间
df -h

# 查看 Docker 磁盘占用
docker system df

# 清理已停止容器和悬空镜像（定期执行）
docker system prune -f

# 清理所有未使用镜像（释放更多空间，谨慎执行）
docker image prune -a -f
```

### 10.3 自动备份脚本

创建 `~/backup.sh`：

```bash
#!/bin/bash
set -e

BACKUP_DIR="/mnt/ssd/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$HOME/backup.log"
SERVICES_DIR="$HOME/services"
MYSQL_PASSWORD="YOUR_MYSQL_PASSWORD"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== 开始备份 ==="

# 确保备份目录存在
mkdir -p "$BACKUP_DIR"

# 备份 MySQL（在线备份，不停服务）
log "备份 MySQL..."
docker exec mysql mysqldump -uroot -p"$MYSQL_PASSWORD" \
  --all-databases --single-transaction \
  > "$BACKUP_DIR/mysql_$DATE.sql"

# 备份其他服务数据目录（排除 MySQL 和 Kafka，已单独或不需要备份）
log "备份服务数据目录..."
tar -czf "$BACKUP_DIR/services_$DATE.tar.gz" \
  --exclude="$SERVICES_DIR/data/mysql" \
  --exclude="$SERVICES_DIR/data/kafka" \
  --exclude="$SERVICES_DIR/data/zookeeper" \
  "$SERVICES_DIR"

# 保留最近 7 天备份
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete

log "备份完成！文件：services_$DATE.tar.gz"
```

```bash
chmod +x ~/backup.sh

# 配置 cron，每天凌晨 3:30 自动备份
crontab -e
# 添加以下行：
# 30 3 * * * /home/你的用户名/backup.sh
```

### 10.4 常用运维命令

```bash
# Docker 日常管理
docker compose ps                              # 查看所有容器状态
docker compose logs -f 服务名                 # 实时查看日志
docker stats                                   # 实时查看资源占用
docker compose restart 服务名                 # 重启某个服务
docker compose pull && docker compose up -d   # 更新所有镜像到最新版

# 系统资源
htop                    # CPU/内存实时监控
df -h                   # 磁盘使用
free -h                 # 内存使用
vcgencmd measure_temp   # CPU 温度

# FRP 状态（如果使用 FRP）
sudo systemctl status frpc
sudo journalctl -u frpc -f   # 实时日志

# Tailscale 状态（如果使用 Tailscale）
tailscale status
tailscale ping homepi         # 测试与某设备的连通性
```

### 10.5 开启系统安全更新

```bash
sudo apt install -y unattended-upgrades

# 开启安全更新自动安装
sudo dpkg-reconfigure -plow unattended-upgrades
# 选 Yes
```

---

## 十一、学习路径建议

### 第一阶段：基础环境（第 1 周）

完成系统初始化 → Docker 安装并配置镜像加速 → 启动 MySQL + Redis + Nginx → Adminer 连接数据库验证 → Portainer 查看容器状态 → 配置远程访问方案，从手机验证可以访问

**验收标准**：能从手机移动网络访问 Portainer 界面。

### 第二阶段：Web 全栈基础（第 2-4 周）

- Nginx 配置静态文件托管，将前端打包产物部署上去
- 写 Node.js（Express）或 Python（FastAPI）后端，连接 MySQL 实现 CRUD
- 配置 Nginx 反向代理，前端和 API 统一走 80 端口
- Redis 实现接口缓存、Session 存储

**验收标准**：一个完整的前后端分离应用跑在树莓派上，外网可访问。

### 第三阶段：中间件实践（第 5-6 周）

- RabbitMQ：实现邮件发送、图片处理等异步任务队列
- Redis 进阶：排行榜（ZSet）、分布式锁、发布订阅
- Kafka：日志采集管道，理解生产者/消费者/Topic/Partition 模型

### 第四阶段：监控与运维（持续进行）

- Grafana：为自己的应用创建自定义业务指标监控面板
- Uptime Kuma：配置服务告警，接入企业微信或 Telegram 推送
- 深入学习 Docker 网络原理、Volume 管理、多服务编排

---

## 十二、快速参考清单

### 服务访问地址

| 服务 | 局域网地址 | 说明 |
|------|-----------|------|
| Portainer | `http://pi-ip:9000` | Docker 可视化管理 |
| Grafana | `http://pi-ip:3000` | 监控面板（首次导入模板 ID: 1860）|
| Prometheus | `http://pi-ip:9090` | 指标查询 |
| Speedtest | `http://pi-ip:8765` | 网速历史记录 |
| RabbitMQ 管理 | `http://pi-ip:15672` | 消息队列管理 |
| Adminer | `http://pi-ip:8088` | 数据库 Web 管理 |
| Uptime Kuma | `http://pi-ip:3002` | 服务可用性监控 |
| Dozzle | `http://pi-ip:8084` | 容器日志实时查看 |
| Gitea | `http://pi-ip:3001` | 自建 Git 服务 |
| code-server | `http://pi-ip:8080` | 浏览器 VS Code |
| Nginx | `http://pi-ip:80` | Web 服务 |

### 端口速查

```
22    → SSH（原始，建议修改）
80    → Nginx HTTP
443   → Nginx HTTPS
2222  → 修改后的 SSH 端口 / Gitea SSH
3000  → Grafana
3001  → Gitea Web
3002  → Uptime Kuma
3306  → MySQL
5672  → RabbitMQ AMQP
6379  → Redis
8080  → code-server
8084  → Dozzle
8088  → Adminer
8765  → Speedtest Tracker
9000  → Portainer
9090  → Prometheus
9092  → Kafka
15672 → RabbitMQ 管理界面
```

### 初次部署检查清单

**系统基础**
- [ ] SD 卡烧录 Raspberry Pi OS Lite 64-bit，预配置 SSH / 用户 / 时区
- [ ] 首次 SSH 连接成功
- [ ] APT 镜像源换为国内源
- [ ] 系统更新完成（`full-upgrade`）并重启
- [ ] 基础工具安装（`git curl wget vim htop` 等）
- [ ] 固定局域网 IP 配置完成（`nmcli` 设置）
- [ ] Swap 扩展到 2GB
- [ ] SSH 端口修改为非 22，防火墙配置完成
- [ ] USB SSD 挂载，服务目录创建（~/services 软链接）

**Docker 环境**
- [ ] Docker 通过阿里云源安装成功（`docker version` 正常）
- [ ] Docker 镜像加速配置（`docker info | grep Mirrors` 验证）
- [ ] 当前用户加入 docker 组（`docker ps` 无需 sudo）
- [ ] `docker compose version` 正常

**服务部署**
- [ ] `~/services/prometheus/prometheus.yml` 文件已创建
- [ ] `docker-compose.yml` 中所有密码和 IP 已替换
- [ ] Speedtest APP_KEY 已生成（`openssl rand -base64 32`）
- [ ] `docker compose up -d` 分批启动成功
- [ ] `docker compose ps` 各核心服务状态为 healthy
- [ ] Portainer 浏览器访问正常
- [ ] Adminer 连接 MySQL 成功（能看到数据库列表）
- [ ] Redis 连接测试（`redis-cli ping` 返回 PONG）
- [ ] Grafana 配置 Prometheus 数据源，导入模板 1860

**远程访问**
- [ ] 选择并完整配置远程访问方案
- [ ] 从手机（移动/联通网络，非 WiFi）成功访问 Portainer

**维护**
- [ ] 备份脚本（`~/backup.sh`）创建并设置 cron 定时执行
- [ ] Uptime Kuma 添加各服务监控，配置告警通知渠道

---

> 💡 **最后建议**：初次部署不要一次性启动所有服务。按「核心中间件 → 监控 → 运维工具 → 开发工具」的顺序分批启动，每批验证正常后再继续。Kafka + Zookeeper 合计约 800MB 内存，学习初期按需启动即可，其余时间用 `docker compose stop kafka zookeeper` 释放内存。
