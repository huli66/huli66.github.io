
### 安装

```sh
# macOS 安装
brew install redis

# docker 运行

```

```sh
# 启动
# 1.用brew启动
brew services start redis
# 2.启动命令
redis-server

# 测试
redis-cli ping

# 查看进程
ps axu | grep redis

# 关闭
redis-cli shutdown

brew services stop redis

# 强行终止
sudo pkill redis-server

# redis-cli 终端
# 连接
redis-cli -h 127.0.0.1 -p 6397

# 直接连接本地
$redis-cli
redis 127.0.0.1:6379>
redis 127.0.0.1:6379> PING
PONG
# PING 命令，该命令用于检测 redis 服务是否启动。
```