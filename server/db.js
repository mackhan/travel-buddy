// db.js - MySQL 数据库连接（Sequelize + 连接池优化）
const { Sequelize } = require('sequelize')

let sequelize

if (process.env.MYSQL_ADDRESS) {
  // 微信云托管环境：使用内网 MySQL
  const [host, port] = process.env.MYSQL_ADDRESS.split(':')
  sequelize = new Sequelize(
    process.env.MYSQL_DATABASE || 'nodejs',
    process.env.MYSQL_USERNAME,
    process.env.MYSQL_PASSWORD,
    {
      host,
      port: parseInt(port) || 3306,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 10,       // 最大连接数
        min: 2,        // 最小连接数
        acquire: 30000,
        idle: 10000
      },
      define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
      dialectOptions: { charset: 'utf8mb4' }
    }
  )
} else {
  // 本地开发环境
  const uri = process.env.MYSQL_URI || 'mysql://root:@localhost:3306/travel_buddy'
  sequelize = new Sequelize(uri, {
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
  })
}

module.exports = sequelize
