// db.js - MySQL 数据库连接（Sequelize + 连接池优化）
const { Sequelize } = require('sequelize')
const mysql2 = require('mysql2/promise')

let sequelize

const dbName = process.env.MYSQL_DATABASE || 'travel_buddy'

async function ensureDatabase(host, port, user, password) {
  const conn = await mysql2.createConnection({ host, port, user, password })
  await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await conn.end()
}

async function init() {
  if (process.env.MYSQL_ADDRESS) {
    const [host, port] = process.env.MYSQL_ADDRESS.split(':')
    const user = process.env.MYSQL_USERNAME
    const password = process.env.MYSQL_PASSWORD
    // 确保数据库存在
    try { await ensureDatabase(host, parseInt(port) || 3306, user, password) } catch (e) { console.warn('建库失败:', e.message) }

    sequelize = new Sequelize(dbName, user, password, {
      host, port: parseInt(port) || 3306, dialect: 'mysql', logging: false,
      pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
      define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
      dialectOptions: { charset: 'utf8mb4' }
    })
  } else {
    const uri = process.env.MYSQL_URI || 'mysql://root:@localhost:3306/travel_buddy'
    sequelize = new Sequelize(uri, {
      dialect: 'mysql', logging: false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
      define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
    })
  }
  return sequelize
}

// 同步初始化（模块加载时立即执行）
const { Sequelize: Seq } = require('sequelize')
if (process.env.MYSQL_ADDRESS) {
  const [host, port] = process.env.MYSQL_ADDRESS.split(':')
  sequelize = new Seq(
    process.env.MYSQL_DATABASE || 'travel_buddy',
    process.env.MYSQL_USERNAME,
    process.env.MYSQL_PASSWORD,
    {
      host, port: parseInt(port) || 3306, dialect: 'mysql', logging: false,
      pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
      define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
      dialectOptions: { charset: 'utf8mb4' }
    }
  )
} else {
  sequelize = new Seq(process.env.MYSQL_URI || 'mysql://root:@localhost:3306/travel_buddy', {
    dialect: 'mysql', logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
  })
}

module.exports = sequelize
module.exports.ensureDatabase = async () => {
  if (process.env.MYSQL_ADDRESS) {
    const [host, port] = process.env.MYSQL_ADDRESS.split(':')
    try { await ensureDatabase(host, parseInt(port) || 3306, process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD) } catch (e) { console.warn('建库失败(忽略):', e.message) }
  }
}
