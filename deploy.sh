
cd /Users/xuxinliang/Desktop/music_practice/music_explorer

# ===== 新增 Docker 服务检查 =====
if ! docker info >/dev/null 2>&1; then
  echo "错误：Docker 服务未运行！正在尝试启动 Docker Desktop..."
  open -a Docker
  echo "等待 Docker 初始化（15秒）..."
  sleep 15
fi

# ===== 构建和运行 =====
docker compose build && docker compose up -d

# ===== 增加状态检查 =====
echo -e "\n等待容器启动（5秒）..."
sleep 5

# ===== 显示访问信息 =====
echo -e "\n应用已启动！访问 http://localhost:8080 使用钢琴音准训练器"
echo -e "容器状态检查:"
docker compose ps