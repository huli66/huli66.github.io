软件开发环境配置问题，减少“在某些机器上跑不了”的问题

- 虚拟机：在一种操作系统里运行另一种操作系统，对于里面的应用程序而言就是一个系统，对底层系统来说就是普通文件
	- 资源占用多：需要独占一部分内存和空间，很多冗余进程和软件
	- 冗余步骤多：虚拟机是完整的操作系统，很多系统级别的步骤无法跳过，比如登录授权
	- 启动慢：跟启动操作系统一样慢
- Linux 容器，LXC Linux Containers，不是模拟一个完整的操作系统，而是对进程进行隔离，启动容器相当于启动一个进程
	- 启动快
	- 资源占用少
	- 体积小：只包含要用的组件即可

### 容器
 容器技术等核心功能就是，通过约束和修改进程的动态表现，为其创造出一个边界，对于 Docker 等大多数 Linux 容器来说，***Cgroups** 是用来制造约束的主要手段，**Namespace**技术是修改进程视图的主要方法*
#### Namespace 机制
每当我们在宿主机上运行一个程序，比如 /bin/sh ，操作系统都会分配一个进程编号给它，比如 PID=100，这个编号是唯一标识，而通过 Docker 把这个程序运行在一个容器中时，Docker 会让这个进程看不到其他进程和原来的进程号，只能看到重新计算过的进程编号，比如 PID=1，*实际上在宿主机的操作系统里还是原来的进程号*，这就是 Namespace 机制

例如用 `clone()`系统调用创建一个新进程时，可以在参数中指定 `CLONE_NEWPID` 参数，这时新建的这个进程会看到一个全新的进程空间，在这个空间里它的 PID 是 1，而真实的 PID 还是原来的 PID

```c
int pid = clone(main_function, stack_size, CLONE_NEWPID | SIGHLD, NULL)
```

除了 *PID Namespace* 还有*Mount、UTS、IPC、Network、User这些 Namespace*，用于让被隔离的进程看到当前 Namespace 里的网络设备和配置

***创建容器时，指定了这个进程所需要启用的一组 Namespace 参数，让容器只能看到当前 Namespace 所限定的资源配置，看不到宿主机和其他不相关程序，所以容器其实是一种特殊的进程***
#### Cgroups 机制

敏捷和高性能是容器相较于虚拟机最大的优势，也是它能够在 PaaS 这种更细粒度等资源管理平台上大行其道的重要原因，不过其存在不足之处，最大的问题就是：*隔离不彻底*

*容器只是运行在宿主机上的一种特殊进程，那么多个容器直接使用的就还是同一个宿主机的操作系统内核，比如在低版本 Linux 宿主机上运行高版本 Linux 容器、Windows 上运行 CentOS 都是不行的，且很多资源不能被 Namespace 化，比如时间，在一个容器上修改时间，整个宿主机的时间都被修改*

Linux Control Groups 可以限制一个进程组能够使用的资源上限，包括 CPU、内存、磁盘、网络等，此外还能对进程进行优先级设置、审计、挂起、恢复等功能

*用户的应用进程实际上就是容器里的 PID=1 的进程，也就是其他后续创建的所有进程的父进程*

*一个容器里，不能同时运行两个不同的应用，强行运行会有一个变成孤儿进程*

## docker

Docker 属于 Linux 容器的一种封装，提供简单易用的容器使用接口，主要用途有：
- 提供一次性的环境：提供测试环境等
- 提供弹性的云服务：容器可以随时开关，很适合动态扩容缩容
- 组件微服务架构：通过多个容器，在一台机器上跑多个服务，模拟微服务架构

### 基本操作

入门操作可以参考[docker 入门](https://ruanyifeng.com/blog/2018/02/docker-tutorial.html)

```sh
# 查看信息，或者验证安装是否成功
docker version
docker info

# docker 需要用户具有 sudo 权限，
# 把用户加入 Docker 用户组（安装的时候自动创建），避免每次命令都输入 sudo
sudo usermod -aG docker $USER

# 启动 Docker 服务，一般安装就会自启动
# service 命令用法
sudo service docker start
# systemctl 命令用法
sudo systemctl start docker

# 镜像操作
docker image ls # 列出本机所有镜像
docker image rm [imageName] # 删除镜像
docker image pull library/image-name # 抓取镜像

# 容器操作
docker container run library/image-name # 从镜像生成容器并运行，本地没有镜像会自动从远端抓取
docker container kill [containerID] # 终止
docker container start # 复用启动
docker container stop # 终止，相当于发送 SIGTERM 信号，再发送 SIGKILL 信号
docker container ls -all # 列出容器，-all 包括已经停止的
docker container rm [containerID] # 删除，不再占有硬盘空间
docker container logs # 查看容器的输出
docker container exec -it [containerID] /bin/bash # 进入容器
docker container cp # 从容器里拷贝文件到本机
```



容器内执行 `ps` 可以看到容器内的进程


### Dockerfile 创建镜像
一个用来构建镜像的 yaml 格式文件，[[YAML 语法]]

```yaml
# 定制的镜像是基于 nginx 的镜像
FROM nginx

# 用于执行后面跟着的命令，有两种格式
# shell 格式 RUN <命令行>
RUN echo 'hello' > /usr/share/nginx/html/index.html
# exec 格式 RUN ['可执行文件', '参数1', '参数2']
RUN ['./test.php', 'dev', 'offline']
# 等价于 ./test.php dev offline


# 启动容器时默认运行的命令
CMD echo "hello world"
```

***Dockerfile 的 RUN、COPY、ADD 指令每执行一次都会在 docker 上新建一层，太多无意义的层灰造成镜像膨胀过大***，其它指令产生临时层，不影响构建大小

```yaml
# 这样会创建三层镜像
FROM centos
RUN yum -y install wget
RUN wget -O redis.tar.gz "http://download.redis.io/releases/redis-5.0.3.tar.gz"
RUN tar -xvf redis.tar.gz

# 简化后只创建一层镜像
FROM centos
RUN yum -y install wget \
	&& wget -O redis.tar.gz "http://...."\
	&& tar -xvf redis.tar.gz
```

#### 发布 image 文件
```sh
# 生成镜像文件
docker image build -t [image-name]:[tag]
# 登录
docker login
# 为本地 image 重新标注用户名和版本
docker image tag [imageName] [username]/[respository]:[tag]
# 发布
docker image push [username]/[respository]:[tag]
# 查看分层信息，docker 下载可以看到分层信息下载，不同镜像之间可以复用
docker inspect [imageName]
```

### 搭建私有 docker 仓库
## docker-compose

单机环境下的轻量级容器编排工具，弥补了 docker 和 kubernetes 之间的空缺

docker-compose 底层还是调用的 docker，所以它启动的容器用 `docker ps` 也能看到

### 命令
```bash
# 查看版本号
docker-compose version

# 查看信息
docker-compose ps

# 启动应用，-f 指定配置文件，-d 后台模式运行
# 默认配置文件是 compose.yaml ，使用这个时可以省略 -f 参数
docker-compose -f reg-compose.yaml up -d

# 停止应用
docker-compose down

# 进入容器内部
docker-compose exec
# 下面例子中，进入 nginx 容器，可以 ping 通其他两个容器
docker-compose -f wp-compose.yml exec -it nginx sh

docker-compose -h # 获取帮助
docker-compose exec nginx bash # 进入 nginx 容器
docker-compose pause nginx # 暂停容器
docker-compose unpause nginx # 恢复容器
docker-compose restart nginx
```

### demo

```sh
docker run -d --rm \
    --env MARIADB_DATABASE=db \
    --env MARIADB_USER=wp \
    --env MARIADB_PASSWORD=123 \
    --env MARIADB_ROOT_PASSWORD=123 \
    mariadb:10
```

```yaml
services:
	# 数据库
	mariadb:
		image: mariadb:10
		container_name: mariadb
		restart: always

		environment:
			MARIADB_DATABASE: db
			MARIADB_USER: wp
			MARIADB_PASSWORD: 123
			MARIADB_ROOT_PASSWORD: 123

	wordpress:
	    image: wordpress:5
	    container_name: wordpress
	    restart: always
	
	    environment:
			# 注意这里，数据库的网络标识，连接时不需要手动指定 ip 地址
			WORDPRESS_DB_HOST: mariadb  
			WORDPRESS_DB_USER: wp
			WORDPRESS_DB_PASSWORD: 123
			WORDPRESS_DB_NAME: db
	
	    depends_on:
	      - mariadb # 设定容器的相关依赖，指定容器启动的先后顺序

	# 配置 nginx
	nginx:
		image: nginx:alpine
		container_name: nginx
		hostname: nginx
		restart: always
		ports: - 80:80
		# 映射，改变 nginx 配置文件
		volumes: 
			- ./wp.conf:/etc/nginx/conf.d/default.conf
		depends_on:
			- wordpress
```

### 网络通信

会默认创建一个网络，也可以自定义一个桥接网络

### 其他功能

存储卷、自定义网络、特权进程

`version` 字段标记规范版本，实现向后兼容，不建议继续使用
## k8s


## 容器管理

dockge 不会劫持 compose 文件，但是占用内存高，需要两三百 M
portainer 劫持 compose 文件，占用内存低，老牌工具
komodo 不会劫持，功能配置稍微复杂

	使用 portainer 进行管理，dozzle 用来查看日志，也可以尝试 lazydocker
	是一共 portainer 控制容器，如果需要管理 compose 则自行命令行处理

