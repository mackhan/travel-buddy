/**
 * travel-buddy API 集成测试
 * 覆盖所有端点，使用真实 MongoDB，自动清理测试数据
 * 运行：node test-api.js
 */

const http = require('http')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const config = require('./config')
const User = require('./models/User')
const Trip = require('./models/Trip')

// ===== 颜色输出工具 =====
const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red:   (s) => `\x1b[31m${s}\x1b[0m`,
  yellow:(s) => `\x1b[33m${s}\x1b[0m`,
  bold:  (s) => `\x1b[1m${s}\x1b[0m`,
  cyan:  (s) => `\x1b[36m${s}\x1b[0m`,
}

const BASE = 'http://localhost:3000/api'
let passed = 0, failed = 0
const failures = []

// ===== HTTP 请求工具 =====
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

// ===== 断言工具 =====
function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ${c.green('✓')} ${name}`)
    passed++
  } else {
    console.log(`  ${c.red('✗')} ${name}${detail ? ' → ' + detail : ''}`)
    failed++
    failures.push(`${name}${detail ? ': ' + detail : ''}`)
  }
}

function group(title) {
  console.log(`\n${c.bold(c.cyan('▶ ' + title))}`)
}

// ===== 测试数据准备 =====
let tokenA, tokenB, userA, userB, tripId

async function setup() {
  await mongoose.connect(config.mongoUri)
  console.log(c.green('✅ 测试数据库已连接'))

  // 清理旧测试数据
  await User.deleteMany({ openid: /^test_/ })
  await Trip.deleteMany({ destination: /^【测试】/ })

  // 创建两个测试用户，直接插库（绕过微信 code2session）
  userA = await User.create({
    openid: 'test_userA_' + Date.now(),
    nickname: '测试用户A',
    avatar: '',
    gender: 1
  })
  userB = await User.create({
    openid: 'test_userB_' + Date.now(),
    nickname: '测试用户B',
    avatar: '',
    gender: 2
  })

  // 直接签发 JWT（绕过微信 code2session）
  tokenA = jwt.sign({ userId: userA._id }, config.jwtSecret, { expiresIn: '1h' })
  tokenB = jwt.sign({ userId: userB._id }, config.jwtSecret, { expiresIn: '1h' })
  console.log(c.green('✅ 测试用户已创建（userA / userB）'))
}

async function cleanup() {
  await User.deleteMany({ openid: /^test_/ })
  await Trip.deleteMany({ destination: /^【测试】/ })
  await mongoose.disconnect()
  console.log(c.yellow('\n🧹 测试数据已清理'))
}

// ===== 测试用例 =====

async function testHealth() {
  group('1. 健康检查')
  const r = await request('GET', '/health')
  assert('GET /api/health → 200', r.status === 200)
  assert('返回 status: ok', r.body.status === 'ok')
}

async function testAuth() {
  group('2. 鉴权中间件')
  const r1 = await request('GET', '/trips/hot')
  assert('无 token → 401', r1.status === 401)
  assert('返回未登录提示', r1.body.message && r1.body.message.includes('登录'))

  const r2 = await request('GET', '/trips/hot', null, 'invalid.token.xyz')
  assert('无效 token → 401', r2.status === 401)

  const r3 = await request('GET', '/auth/check', null, tokenA)
  assert('有效 token GET /auth/check → 200', r3.status === 200)
  assert('返回 valid: true', r3.body.data && r3.body.data.valid === true)
}

async function testCreateTrip() {
  group('3. 发布行程')

  // 缺少必填字段
  const r1 = await request('POST', '/trips', { destination: '三亚' }, tokenA)
  assert('缺少必填字段 → 400', r1.status === 400)

  // 时间不合法：开始 >= 结束
  const r2 = await request('POST', '/trips', {
    destination: '【测试】北京',
    startDate: '2030-06-10',
    endDate: '2030-06-05',
    tags: ['拼车']
  }, tokenA)
  assert('结束时间早于出发时间 → 400', r2.status === 400)

  // 正常发布
  const future = new Date(Date.now() + 30 * 86400000)
  const future2 = new Date(Date.now() + 35 * 86400000)
  const r3 = await request('POST', '/trips', {
    destination: '【测试】云南大理',
    startDate: future.toISOString(),
    endDate: future2.toISOString(),
    tags: ['拼车', '拼房'],
    description: '一起去苍山洱海',
    maxMembers: 4
  }, tokenA)
  assert('正常发布行程 → 200', r3.status === 200)
  assert('返回行程数据含 _id', r3.body.data && r3.body.data._id)
  if (r3.body.data) tripId = r3.body.data._id
}

async function testGetHot() {
  group('4. 热门行程')
  const r = await request('GET', '/trips/hot', null, tokenA)
  assert('GET /trips/hot → 200', r.status === 200)
  assert('返回数组', Array.isArray(r.body.data))
  assert('包含刚发布的行程', r.body.data.some(t => t.destination === '【测试】云南大理'))
}

async function testGetById() {
  group('5. 行程详情')
  if (!tripId) { assert('跳过（无 tripId）', false, '依赖发布行程步骤'); return }

  const r = await request('GET', `/trips/${tripId}`, null, tokenA)
  assert('GET /trips/:id → 200', r.status === 200)
  assert('destination 正确', r.body.data && r.body.data.destination === '【测试】云南大理')
  assert('populate 了用户信息', r.body.data && r.body.data.userId && r.body.data.userId.nickname)

  // 不存在的 ID
  const r2 = await request('GET', '/trips/000000000000000000000001', null, tokenA)
  assert('不存在的 ID → 404', r2.status === 404)
}

async function testSearch() {
  group('6. 搜索行程')
  const r = await request('GET', `/trips/search?destination=${encodeURIComponent('大理')}`, null, tokenA)
  assert('搜索目的地 → 200', r.status === 200)
  assert('返回含 list 和 pagination', r.body.data && r.body.data.list && r.body.data.pagination)
  // 搜索结果不包含自己的行程
  assert('不包含自己的行程', !r.body.data.list.some(t => String(t.userId?._id || t.userId) === String(userA._id)))

  const r2 = await request('GET', `/trips/search?tags=${encodeURIComponent('拼车')}`, null, tokenB)
  assert('按标签搜索 → 200', r2.status === 200)
}

async function testGetMine() {
  group('7. 我的行程')
  const r = await request('GET', '/trips/mine', null, tokenA)
  assert('GET /trips/mine → 200', r.status === 200)
  assert('包含 list 数组', r.body.data && Array.isArray(r.body.data.list))
  assert('我发布的行程在列表中', r.body.data.list.some(t => t.destination === '【测试】云南大理'))
}

async function testJoin() {
  group('8. 加入行程')
  if (!tripId) { assert('跳过（无 tripId）', false); return }

  // 用户B 加入用户A 的行程 → 成功
  const r1 = await request('POST', `/trips/${tripId}/join`, {}, tokenB)
  assert('B 加入 A 的行程 → 200', r1.status === 200)
  assert('返回 joined: true', r1.body.data && r1.body.data.joined === true)

  // 用户A 加入自己的行程 → 失败
  const r2 = await request('POST', `/trips/${tripId}/join`, {}, tokenA)
  assert('不能加入自己的行程 → 400', r2.status === 400)

  // 不存在的行程
  const r3 = await request('POST', '/trips/000000000000000000000001/join', {}, tokenB)
  assert('加入不存在的行程 → 404', r3.status === 404)
}

async function testUpdate() {
  group('9. 更新行程')
  if (!tripId) { assert('跳过（无 tripId）', false); return }

  const r1 = await request('PUT', `/trips/${tripId}`, { description: '已更新描述', maxMembers: 6 }, tokenA)
  assert('创建者更新行程 → 200', r1.status === 200)
  assert('description 已更新', r1.body.data && r1.body.data.description === '已更新描述')

  // 非创建者无权更新
  const r2 = await request('PUT', `/trips/${tripId}`, { description: '越权修改' }, tokenB)
  assert('非创建者无权更新 → 404', r2.status === 404)
}

async function testRemove() {
  group('10. 删除行程')
  if (!tripId) { assert('跳过（无 tripId）', false); return }

  // 非创建者无权删
  const r1 = await request('DELETE', `/trips/${tripId}`, null, tokenB)
  assert('非创建者无权删除 → 404', r1.status === 404)

  // 创建者删除
  const r2 = await request('DELETE', `/trips/${tripId}`, null, tokenA)
  assert('创建者删除 → 200', r2.status === 200)

  // 再次获取 → 404
  const r3 = await request('GET', `/trips/${tripId}`, null, tokenA)
  assert('删除后获取详情 → 404', r3.status === 404)
}

// ===== 主入口 =====
async function main() {
  console.log(c.bold('\n========================================'))
  console.log(c.bold('  travel-buddy API 集成测试'))
  console.log(c.bold('========================================'))

  try {
    await setup()

    await testHealth()
    await testAuth()
    await testCreateTrip()
    await testGetHot()
    await testGetById()
    await testSearch()
    await testGetMine()
    await testJoin()
    await testUpdate()
    await testRemove()

  } catch (err) {
    console.error(c.red('\n❌ 测试运行异常: ' + err.message))
    console.error(err.stack)
  } finally {
    await cleanup()
  }

  // ===== 汇总 =====
  const total = passed + failed
  console.log(c.bold('\n========================================'))
  console.log(c.bold(`  结果: ${c.green(passed + ' 通过')} / ${failed > 0 ? c.red(failed + ' 失败') : '0 失败'} / ${total} 总计`))
  if (failures.length > 0) {
    console.log(c.red('\n  失败用例:'))
    failures.forEach(f => console.log(c.red(`  - ${f}`)))
  }
  console.log(c.bold('========================================\n'))
  process.exit(failed > 0 ? 1 : 0)
}

main()
