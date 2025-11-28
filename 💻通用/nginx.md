#运维

在阿里云部署博客

系统：CentOS

  

```sh

# 安装 xl_close_port 支持一句话停止指定端口服务

npm install -g xl_close_port

  

# 停止指定端口

xl_close_port -p 80

  

# 安装 nginx ，CentOS 自带 yum命令

yum install nginx

  

# 启动 nginx（毫秒级完成，启动智慧浏览器访问公网 IP 可以访问到 nginx 默认主页

nginx

```

  

## nginx 相关文件路径

  

- 配置文件: /etc/nginx/

- 默认前端代码存放处: /usr/share/nginx/

- 默认配置在 /etc/nginx/nginx.conf

  

## 在指定端口搭建一个站点

  

```sh

# nginx.conf 中有一行，指定目标文件夹下所有 nginx 配置文件都会自动生效

include /etc/nginx/conf.d/*.conf

```

  

1.在 `/etc/nginx/conf.d` 目录下创建 `blog.conf` 文件

  

```.conf

server {

lister 7777;

# server_name _;

# 指定域名

server_name hujianjun.top;

root /usr/share/nginx/blog

}

```

  

2.在` /usr/share/nginx/blog` 目录下建立一个` index.html`

  

3.重启，瞬间成功，或者等一会儿报错

  

```sh

nginx -s reload

```

  

然后就可以访问了，*记得在云服务器添加安全规则放开对应的端口*

  

## https支持

  

1.阿里云申请证书，放在一个文件夹中

  

2.修改配置

  

```sh

server {

lister 80;

server_name xxx.com;

# 证书

ssl_certificate xxxx/yy.pem;

# 证书密钥

ssl_certificate_key xxxx/yy.key;

# 其他配置

}

```

  
  
  

## 报错

  

- 404：检查配置重启

- 502：检查指定的文件是否存在

- timeout：检查端口