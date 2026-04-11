# 搭牛牛后端服务

基于 Node.js + MySQL 的搭牛牛小程序后端服务。

## 技术栈

- Node.js
- Express.js
- MySQL
- JWT (可选，用于后续扩展)

## 项目结构

```
backend/
├── config/
│   └── database.js          # 数据库连接配置
├── controllers/
│   ├── userController.js    # 用户相关控制器
│   └── partnerController.js # 搭子相关控制器
├── database/
│   └── schema.sql           # 数据库表结构
├── routes/
│   └── api.js               # API 路由
├── .env                     # 环境变量配置
├── package.json             # 项目依赖
└── server.js                # 服务器入口文件
```

## 安装步骤

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置数据库

确保你已经安装了 MySQL，然后：

1. 创建数据库（可选，schema.sql 会自动创建）
2. 修改 `.env` 文件中的数据库配置：

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=daniuniu
JWT_SECRET=your_jwt_secret_key_here
```

### 3. 初始化数据库

执行数据库表结构创建脚本：

```bash
mysql -u root -p < database/schema.sql
```

或者在 MySQL 客户端中执行：

```sql
source /path/to/backend/database/schema.sql
```

## 启动服务

### 开发模式（自动重启）

```bash
npm run dev
```

### 生产模式

```bash
npm start
```

服务将在 `http://localhost:3000` 启动。

## API 文档

### 基础 URL

```
http://localhost:3000/api
```

### 用户相关 API

#### 1. 用户登录/注册

**接口**: `POST /user/login`

**请求参数**:
```json
{
  "openid": "用户微信openid",
  "nickname": "用户昵称",
  "avatar": "用户头像URL"
}
```

**返回示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "openid": "wx_openid_123",
    "nickname": "用户昵称",
    "avatar": "头像URL",
    "phone": null,
    "created_at": "2026-03-24T00:00:00.000Z"
  },
  "message": "注册成功"
}
```

#### 2. 获取用户信息

**接口**: `GET /user/info/:userId`

**返回示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "openid": "wx_openid_123",
    "nickname": "用户昵称",
    "avatar": "头像URL",
    "phone": null,
    "created_at": "2026-03-24T00:00:00.000Z"
  }
}
```

#### 3. 更新用户信息

**接口**: `PUT /user/profile/:userId`

**请求参数**:
```json
{
  "nickname": "新昵称",
  "avatar": "新头像URL",
  "phone": "手机号"
}
```

**返回示例**:
```json
{
  "success": true,
  "message": "更新成功"
}
```

### 搭子相关 API

#### 1. 发布搭子

**接口**: `POST /partner/create`

**请求参数**:
```json
{
  "userId": 1,
  "trips": [
    {
      "country": "中国",
      "province": "北京",
      "city": "朝阳区",
      "startDate": "2026-04-01",
      "endDate": "2026-04-05",
      "time": "上午10:00",
      "tags": ["观光", "摄影"],
      "description": "计划去故宫和颐和园",
      "peopleCount": 2,
      "costType": "AA",
      "price": null
    }
  ]
}
```

**返回示例**:
```json
{
  "success": true,
  "data": {
    "id": 1
  },
  "message": "发布成功"
}
```

#### 2. 获取搭子列表

**接口**: `GET /partner/list`

**查询参数**:
- `country`: 国家（可选）
- `province`: 省份（可选）
- `city`: 城市（可选）
- `startDate`: 开始日期（可选）
- `endDate`: 结束日期（可选）
- `tag`: 活动标签（可选）
- `keyword`: 搜索关键词（可选）
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认20）

**示例请求**:
```
GET /partner/list?city=北京&startDate=2026-04-01&endDate=2026-04-30&page=1&pageSize=20
```

**返回示例**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "user_id": 1,
        "country": "中国",
        "province": "北京",
        "city": "朝阳区",
        "start_date": "2026-04-01",
        "end_date": "2026-04-05",
        "time": "上午10:00",
        "tags": ["观光", "摄影"],
        "description": "计划去故宫和颐和园",
        "people_count": 2,
        "cost_type": "AA",
        "price": null,
        "status": "seeking",
        "nickname": "用户昵称",
        "avatar": "头像URL",
        "created_at": "2026-03-24T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 3. 获取搭子详情

**接口**: `GET /partner/detail/:partnerId`

**返回示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "country": "中国",
    "province": "北京",
    "city": "朝阳区",
    "start_date": "2026-04-01",
    "end_date": "2026-04-05",
    "time": "上午10:00",
    "tags": ["观光", "摄影"],
    "description": "计划去故宫和颐和园",
    "people_count": 2,
    "cost_type": "AA",
    "price": null,
    "status": "seeking",
    "nickname": "用户昵称",
    "avatar": "头像URL",
    "phone": "手机号",
    "created_at": "2026-03-24T00:00:00.000Z",
    "trips": [
      {
        "id": 1,
        "partner_id": 1,
        "country": "中国",
        "province": "北京",
        "city": "朝阳区",
        "start_date": "2026-04-01",
        "end_date": "2026-04-05",
        "time": "上午10:00",
        "tags": ["观光", "摄影"],
        "description": "计划去故宫和颐和园",
        "people_count": 2,
        "cost_type": "AA",
        "price": null,
        "created_at": "2026-03-24T00:00:00.000Z"
      }
    ]
  }
}
```

#### 4. 更新搭子状态

**接口**: `PUT /partner/status/:partnerId`

**请求参数**:
```json
{
  "status": "matched"
}
```

**返回示例**:
```json
{
  "success": true,
  "message": "更新成功"
}
```

#### 5. 获取我的搭子

**接口**: `GET /partner/my/:userId`

**查询参数**:
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认20）

**返回示例**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "user_id": 1,
        "country": "中国",
        "province": "北京",
        "city": "朝阳区",
        "start_date": "2026-04-01",
        "end_date": "2026-04-05",
        "time": "上午10:00",
        "tags": ["观光", "摄影"],
        "description": "计划去故宫和颐和园",
        "people_count": 2,
        "cost_type": "AA",
        "price": null,
        "status": "seeking",
        "nickname": "用户昵称",
        "avatar": "头像URL",
        "created_at": "2026-03-24T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

## 数据库表结构

### users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| openid | VARCHAR(100) | 微信openid，唯一 |
| nickname | VARCHAR(50) | 昵称 |
| avatar | VARCHAR(255) | 头像URL |
| phone | VARCHAR(20) | 手机号 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### partners（搭子表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| user_id | INT | 发布者ID，外键 |
| country | VARCHAR(50) | 国家 |
| province | VARCHAR(50) | 省份 |
| city | VARCHAR(50) | 城市 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 结束日期 |
| time | VARCHAR(20) | 出发时间 |
| tags | JSON | 活动标签 |
| description | TEXT | 计划描述 |
| people_count | INT | 人数 |
| cost_type | ENUM | 费用类型（fixed/AA/free） |
| price | DECIMAL(10,2) | 价格 |
| status | ENUM | 状态（seeking/matched/cancelled） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### trips（行程表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| partner_id | INT | 搭子ID，外键 |
| country | VARCHAR(50) | 国家 |
| province | VARCHAR(50) | 省份 |
| city | VARCHAR(50) | 城市 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 结束日期 |
| time | VARCHAR(20) | 出发时间 |
| tags | JSON | 活动标签 |
| description | TEXT | 计划描述 |
| people_count | INT | 人数 |
| cost_type | ENUM | 费用类型（fixed/AA/free） |
| price | DECIMAL(10,2) | 价格 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

## 注意事项

1. 确保 MySQL 服务已启动
2. 确保 `.env` 文件中的数据库配置正确
3. 首次运行前需要执行 `database/schema.sql` 创建数据库表
4. 小程序前端需要配置正确的后端地址（在 `utils/api.js` 中修改 `BASE_URL`）

## 故障排查

### 连接数据库失败

检查以下几点：
1. MySQL 服务是否启动
2. `.env` 文件中的数据库配置是否正确
3. 数据库用户是否有足够的权限

### 端口被占用

如果 3000 端口被占用，可以修改 `.env` 文件中的 `PORT` 配置。

## 许可证

ISC
