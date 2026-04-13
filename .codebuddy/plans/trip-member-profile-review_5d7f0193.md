---
name: trip-member-profile-review
overview: 行程详情成员列表完善（包含行程主+发起人标识+点击跳转资料页）、行程结束后完整评价入口、profile 页"我写的评价"展示
todos:
  - id: fix-member-list-with-owner
    content: 修复 detail.js viewProfile 点击跳转逻辑，loadMembers 中将行程主插入成员列表第一位并标记 isOwner，同时更新 getMembers 接口加 reviewCount 字段
    status: completed
  - id: update-detail-wxml-and-wxss
    content: 更新 detail.wxml 成员列表展示行程主「发起人」徽章，完善非行程主的行程完成后互评入口，同步更新 detail.wxss 样式
    status: completed
    dependencies:
      - fix-member-list-with-owner
  - id: update-profile-review-tab
    content: 更新 profile.js 新增 reviewTab 和 loadSentReviews，更新 profile.wxml/profile.wxss 实现「收到的评价」和「我写的评价」双 Tab 切换
    status: completed
  - id: test-version-bump-commit
    content: 更新测试用例（getMembers 含 reviewCount），版本号升至 v1.0.30，运行 40/40 测试，code review 后提交
    status: completed
    dependencies:
      - update-detail-wxml-and-wxss
      - update-profile-review-tab
---

## 用户需求

### 产品概述

修复行程详情页的成员面板交互问题，完善成员列表展示（含行程主标识），以及优化个人评价页面的数据展示。

### 核心功能

**1. 修复行程主点击无反应**
行程详情页「发布者信息」区域点击无任何跳转反应，应能正常打开该用户的个人资料面板（含头像、昵称、简介、信用分、评价数等）。

**2. 成员列表展示行程主且排在第一位**
成员列表目前只展示 approved 参与者，不含行程主本人。需将行程主插入列表第一位，带有「发起人」标识徽章，参与者正常排列在后，点击任意成员均可跳转至其个人资料页。

**3. 所有成员点击均可打开个人资料**
成员列表中所有人（行程主 + 参与者）点击均可正常打开 profile 页面，展示头像、昵称、简介、信用分等信息。

**4. 行程完成后所有成员均可互评**
目前只有行程主在行程完成后有评价入口。需补全：非行程主的 approved 成员同样能对行程主及其他成员写评价，评价入口在行程详情页可见。

**5. 个人资料页「我的评价」增加 Tab 切换**
profile 页当前「我的评价」只展示收到的评价。需增加 Tab：「收到的评价」和「我写的评价」，用户可分别查看自己被他人评价的记录，以及自己写出去的评价记录。

## 技术栈

- **前端**：微信小程序（WXML + WXSS + JS），复用现有页面结构
- **后端**：Node.js + Express + Sequelize + MySQL，`getMembers` 接口无需改动，在前端合并数据

## 实现方案

### 策略总览

- **行程主跳转修复**：在 `viewProfile` 方法中加 `console.log` 排查 `author.id` 是否为空，并在 wxml 中确保 `bindtap` 绑定区域不被子元素 `catchtap` 阻断
- **成员列表合并**：`loadMembers` 拿到接口返回后，在前端将 `trip.user`（行程主）包装为与 TripMember 相同结构插入第一位，标记 `isOwner: true`，不改后端接口
- **成员互评入口**：行程 `status=completed` 时，所有人都显示评价入口，行程主评价所有参与者，参与者评价行程主 + 其他参与者（互相过滤自己）
- **profile 评价 Tab**：新增 `reviewTab` 字段（`received` / `sent`），切换 Tab 分别调用 `GET /reviews/user/:userId`（收到的）和 `GET /reviews/mine`（写的），数据结构不同需分别渲染

### getMembers 返回值增强（后端微调）

为让成员列表能显示 `reviewCount`（与申请列表对齐），将 `getMembers` 的 user 属性加上 `reviewCount`：

```js
attributes: ['id', 'nickname', 'avatar', 'creditScore', 'reviewCount']
```

### 前端成员列表合并逻辑

```js
loadMembers(id) {
  // 1. 拿行程主信息从 trip.user 构建 owner 条目
  const owner = this.data.trip.user
  const ownerItem = { user: owner, isOwner: true, status: 'owner' }
  // 2. 合并：行程主排第一，后接参与者列表
  this.setData({ members: [ownerItem, ...res.data] })
}
```

### profile 评价 Tab 切换

```
reviewTab: 'received' | 'sent'
```

- `received`：调 `GET /reviews/user/:userId`，展示 `fromUser` 头像+昵称+星级+时间
- `sent`：调 `GET /reviews/mine`，展示 `toUser` 头像+昵称+星级+时间+行程目的地

## 性能与兼容性

- 成员合并纯前端操作，无额外网络请求
- 后端 `getMembers` 仅加一个字段，不影响现有逻辑
- profile 评价 Tab 切换按需加载，首次进入只加载 `received`

## 目录结构

```
client/pages/detail/
  detail.js      [MODIFY] 修复 viewProfile 取 id 逻辑；loadMembers 合并行程主；完善评价入口（所有成员）
  detail.wxml    [MODIFY] 成员列表加行程主标识样式；完善非行程主的评价入口
  detail.wxss    [MODIFY] 新增 owner-badge 发起人标识样式

client/pages/profile/
  profile.js     [MODIFY] 新增 reviewTab 状态；loadSentReviews 方法；Tab 切换逻辑
  profile.wxml   [MODIFY] 我的评价区域改为双 Tab，分别渲染收到/写出的评价
  profile.wxss   [MODIFY] 新增 Tab 样式

server/controllers/
  tripController.js  [MODIFY] getMembers 的 user attributes 加 reviewCount

server/
  test-full.js   [MODIFY] 补充 getMembers 返回 reviewCount 字段的测试断言
  package.json   [MODIFY] 版本号升至 1.0.30
```

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 探索 detail.wxss 现有样式变量和 profile.wxss 评价区域样式，确保新增样式与现有设计保持一致
- Expected outcome: 获取现有样式的 class 名称和颜色变量，避免引入冲突样式