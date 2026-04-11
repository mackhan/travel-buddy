/**
 * 连接测试脚本 - 验证后端接口是否正常
 * 运行: node server/test-connection.js
 */
const https = require('https')

const BASE_URL = 'travel-buddy-api-245308-5-1421335349.sh.run.tcloudbase.com'

function request(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (body) headers['Content-Length'] = Buffer.byteLength(body)

    const req = https.request({
      hostname: BASE_URL, port: 443, path, method, headers
    }, (res) => {
      let raw = ''
      res.on('data', chunk => raw += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }) }
        catch (e) { resolve({ status: res.statusCode, data: raw }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

async function runTests() {
  let passed = 0, failed = 0

  async function test(name, fn) {
    try {
      await fn()
      console.log(`  ✅ ${name}`)
      passed++
    } catch (e) {
      console.log(`  ❌ ${name}: ${e.message}`)
      failed++
    }
  }

  console.log('\n🧪 旅行搭子后端接口测试\n')
  console.log('━'.repeat(40))

  // 1. 健康检查
  console.log('\n[ 基础连接 ]')
  await test('GET /api/health → 200', async () => {
    const res = await request('/api/health')
    if (res.status !== 200) throw new Error(`状态码 ${res.status}`)
    if (!res.data.status === 'ok') throw new Error('返回数据异常')
  })

  // 2. 登录接口（用假 code 测试，预期返回错误但接口存在）
  console.log('\n[ 认证接口 ]')
  await test('POST /api/auth/login → 接口存在（非404）', async () => {
    const res = await request('/api/auth/login', 'POST', { code: 'fake_code_test' })
    if (res.status === 404) throw new Error('接口不存在')
  })

  // 3. 未授权访问
  console.log('\n[ 权限校验 ]')
  await test('GET /api/trips/hot → 401 未授权', async () => {
    const res = await request('/api/trips/hot')
    if (res.status !== 401) throw new Error(`预期401，实际${res.status}`)
  })

  await test('GET /api/users/me → 401 未授权', async () => {
    const res = await request('/api/users/me')
    if (res.status !== 401) throw new Error(`预期401，实际${res.status}`)
  })

  // 4. 404 路由
  console.log('\n[ 路由兜底 ]')
  await test('GET /api/nonexistent → 404', async () => {
    const res = await request('/api/nonexistent')
    if (res.status !== 404) throw new Error(`预期404，实际${res.status}`)
  })

  console.log('\n' + '━'.repeat(40))
  console.log(`\n📊 结果: ${passed} 通过 / ${failed} 失败\n`)

  if (failed > 0) process.exit(1)
}

runTests().catch(err => {
  console.error('测试运行失败:', err.message)
  process.exit(1)
})
