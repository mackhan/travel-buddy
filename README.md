# 旅行搭子 ✈️

> 找到志同道合的旅伴，让旅行不再孤单

## 功能特性

- 🔍 **智能匹配**：输入目的地和时间，自动匹配行程相近的旅伴
- 🏷️ **多种标签**：拼车、拼房、拼行程、拼饭、拼门票等搭伴方式
- 💬 **实时聊天**：WebSocket 驱动的即时通讯
- ⭐ **信誉系统**：旅行结束后互评，积累信誉分
- 💰 **AA 计算**：智能费用分摊，支持均摊和自定义

## 技术栈

### 前端
- 微信小程序原生开发（WXML + WXSS + JS）

### 后端
- Node.js + Express.js
- MongoDB + Mongoose
- ws（原生 WebSocket，实时通信）
- JWT（身份验证）

## 快速开始

### 后端启动

```bash
cd server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入实际配置

# 启动 MongoDB（确保已安装）
mongod

# 启动开发服务器
npm run dev
```

### 前端启动

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开项目 → 选择 `client` 目录
3. 在 `project.config.json` 中填入你的小程序 AppID
4. 确认 `app.js` 中的 `baseUrl` 指向后端地址

## 目录结构

```
travel-buddy/
├── client/                 # 微信小程序前端
│   ├── app.js/json/wxss    # 入口文件
│   ├── utils/              # 工具函数
│   ├── pages/              # 页面
│   │   ├── index/          # 首页（搜索+匹配列表）
│   │   ├── publish/        # 发布行程
│   │   ├── detail/         # 行程详情
│   │   ├── messages/       # 消息列表
│   │   ├── chat/           # 聊天页
│   │   ├── expense/        # 费用AA
│   │   └── profile/        # 个人中心
│   └── components/         # 公共组件
├── server/                 # Node.js 后端
│   ├── app.js              # 入口
│   ├── config/             # 配置
│   ├── models/             # 数据模型
│   ├── routes/             # 路由
│   ├── controllers/        # 控制器
│   ├── services/           # 服务层
│   └── middleware/         # 中间件
└── README.md
```

## 部署说明

1. 后端部署到云服务器，配置 HTTPS 域名
2. 小程序管理后台配置服务器域名（request、socket 合法域名）
3. 微信公众平台注册小程序，获取 AppID 和 AppSecret
