# 使用轻量级 Nginx 镜像作为基础
FROM nginx:alpine

# 复制网页文件到容器
COPY . /usr/share/nginx/html

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx（默认命令已包含）