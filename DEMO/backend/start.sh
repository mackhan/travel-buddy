#!/bin/bash

echo "================================"
echo "  搭牛牛后端服务启动脚本"
echo "================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未检测到 Node.js，请先安装 Node.js"
    echo "   下载地址：https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 检查 MySQL 是否安装
if ! command -v mysql &> /dev/null; then
    echo "❌ 错误：未检测到 MySQL，请先安装 MySQL"
    echo "   下载地址：https://dev.mysql.com/downloads/mysql/"
    exit 1
fi

echo "✅ MySQL 版本: $(mysql --version)"
echo ""

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "❌ 错误：未找到 .env 文件"
    echo "   请先复制 .env.example 并配置数据库信息"
    exit 1
fi

echo "✅ 找到 .env 配置文件"
echo ""

# 检查依赖是否安装
if [ ! -d node_modules ]; then
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
    echo ""
else
    echo "✅ 依赖已安装"
    echo ""
fi

# 检查数据库是否存在
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)
echo "🔍 检查数据库 '$DB_NAME' 是否存在..."

DB_EXISTS=$(mysql -u root -p$(grep DB_PASSWORD .env | cut -d '=' -f2) -e "SHOW DATABASES LIKE '$DB_NAME'" 2>/dev/null | grep "$DB_NAME")

if [ -z "$DB_EXISTS" ]; then
    echo "⚠️  数据库 '$DB_NAME' 不存在，正在创建..."
    mysql -u root -p$(grep DB_PASSWORD .env | cut -d '=' -f2) < database/schema.sql
    if [ $? -ne 0 ]; then
        echo "❌ 数据库创建失败"
        exit 1
    fi
    echo "✅ 数据库创建完成"
    echo ""
else
    echo "✅ 数据库 '$DB_NAME' 已存在"
    echo ""
fi

# 启动服务
echo "🚀 正在启动后端服务..."
echo ""

if [ "$1" = "dev" ]; then
    echo "📝 开发模式（自动重启）"
    npm run dev
else
    echo "📝 生产模式"
    npm start
fi
