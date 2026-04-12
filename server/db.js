// db.js - MySQL 数据库连接
const { Sequelize } = require('sequelize')
const mysql2 = require('mysql2/promise')

const dbName = process.env.MYSQL_DATABASE || 'nodejs'

let sequelize

if (process.env.MYSQL_ADDRESS) {
  const [host, port] = process.env.MYSQL_ADDRESS.split(':')
  sequelize = new Sequelize(dbName, process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD, {
    host,
    port: parseInt(port) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: { max: 10, min: 1, acquire: 30000, idle: 10000 },
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    dialectOptions: { charset: 'utf8mb4' }
  })
} else {
  sequelize = new Sequelize(process.env.MYSQL_URI || 'mysql://root:@localhost:3306/travel_buddy', {
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
  })
}

// 确保数据库存在（在云托管环境中自动创建）
async function ensureDatabase() {
  if (!process.env.MYSQL_ADDRESS) return
  const [host, port] = process.env.MYSQL_ADDRESS.split(':')
  try {
    const conn = await mysql2.createConnection({
      host, port: parseInt(port) || 3306,
      user: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD
    })
    await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await conn.end()
    console.log(`✅ 数据库 ${dbName} 已就绪`)
  } catch (e) {
    console.warn('建库失败(忽略):', e.message)
  }
}

module.exports = sequelize
module.exports.ensureDatabase = ensureDatabase
