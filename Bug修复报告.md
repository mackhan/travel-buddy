# 🐛 Bug 修复报告 - v1.0.39

**修复时间：** 2026-04-13 23:40
**版本：** 1.0.39

---

## 📋 待修复 Bug 列表

### Bug 1：资料页某些区域不能点击
**位置：** 个人资料页面
**描述：** 画红圈的地方不能点击
**影响：** 用户无法正常使用某些功能

**待确认区域：**
- 头像编辑按钮
- 昵称编辑
- 个人介绍编辑
- 信誉分说明
- 行程数量
- 评价数量

---

### Bug 2：详情页某些按钮不能点击
**位置：** 行程详情页面
**描述：** 夜里也不能点击
**影响：** 用户无法申请加入行程

**待确认按钮：**
- 申请同行按钮
- 私信按钮
- 退出行程按钮
- 同意/拒绝申请按钮

---

### Bug 3：申请中不能取消
**位置：** 申请状态
**描述：** 申请中的行程无法取消申请
**影响：** 用户误申请后无法撤销

**期望功能：**
- 在"申请中"状态时，应该显示"取消申请"按钮
- 点击后可以取消自己的申请

---

### Bug 4：切换账号每次只能创建
**位置：** 个人资料页面 → 切换账号（调试）
**描述：** 每次切换账号都需要创建新账号，无法复用已有账号
**影响：** 测试效率低，无法在已有账号间切换

**期望功能：**
- 输入昵称后，如果账号已存在则直接登录
- 如果不存在则创建新账号

---

## 🔍 问题分析

### Bug 1 & 2：点击问题
**可能原因：**
1. CSS 层级问题（z-index）
2. 遮罩层覆盖
3. 事件绑定问题
4. 组件渲染问题

**检查项：**
- wxml 中的 bindtap 事件
- wxss 中的 pointer-events
- 模态框的遮罩层

### Bug 3：取消申请功能缺失
**当前状态：**
- 后端已提供取消接口：`DELETE /trips/:id/cancel-apply`
- 前端未实现取消按钮

**需要添加：**
1. 取消申请按钮（仅申请人可见）
2. 取消申请方法
3. 成功后刷新状态

### Bug 4：账号复用
**当前实现：**
```javascript
const r = await post('/auth/dev-login', { nickname })
```

**后端已支持：**
- 输入相同昵称 → 复用已有账号
- 输入新昵称 → 创建新账号

**前端无需修改**，可能需要确认后端接口是否正常工作

---

## 🛠️ 修复方案

### 修复 Bug 3：取消申请功能

#### 1. 在 profile.wxml 中添加取消按钮
在"我申请的"行程卡片中添加取消按钮：
```xml
<view class="my-trip-item" wx:for="{{appliedTrips}}" wx:key="id">
  <!-- 现有内容 -->
  <view class="cancel-apply-btn"
        wx:if="{{item.status === 'pending'}}"
        catchtap="cancelApply"
        data-apply-id="{{item.id || item._id}}">
    取消申请
  </view>
</view>
```

#### 2. 在 profile.js 中添加取消方法
```javascript
async cancelApply(e) {
  const applyId = e.currentTarget.dataset.applyId
  wx.showModal({
    title: '确认取消',
    content: '确定要取消这个申请吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          wx.showLoading({ title: '取消中...' })
          await del(`/trips/${applyId}/cancel-apply`)
          wx.hideLoading()
          wx.showToast({ title: '已取消', icon: 'success' })
          this.loadAppliedTrips() // 刷新列表
        } catch (e) {
          wx.hideLoading()
          wx.showToast({ title: '取消失败', icon: 'none' })
        }
      }
    }
  })
}
```

### 修复 Bug 1 & 2：点击问题

#### 检查清单
1. 检查 z-index 层级
2. 检查遮罩层是否覆盖
3. 检查事件绑定
4. 检查 CSS pointer-events

#### 可能的修复
```css
/* 确保按钮在最上层 */
.action-btn {
  z-index: 100;
  pointer-events: auto;
}

/* 遮罩层不应阻止点击 */
.modal-mask {
  pointer-events: auto;
}

.modal-content {
  pointer-events: auto;
}
```

### 修复 Bug 4：账号复用

#### 确认后端接口
后端已经支持账号复用，前端无需修改。

#### 如果仍有问题
可能是：
1. 后端接口未正确实现
2. 昵称匹配逻辑有误
3. 需要查看后端日志

---

## 📝 修复进度

- [ ] Bug 1：检查并修复点击问题（需要确认具体位置）
- [ ] Bug 2：检查并修复点击问题（需要确认具体位置）
- [x] Bug 3：添加取消申请功能
- [ ] Bug 4：确认账号复用功能

---

## 🔧 下一步

1. 修复 Bug 3（取消申请功能）
2. 确认 Bug 1 和 Bug 2 的具体位置
3. 修复点击问题
4. 测试所有修复
5. 提交并发布 v1.0.40

---

**备注：** 需要用户提供具体的截图或描述，以确定 Bug 1 和 Bug 2 的准确位置。
