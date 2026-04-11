// models/User.js
const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  openid: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  nickname: { type: DataTypes.STRING(50), defaultValue: '旅行者' },
  avatar: { type: DataTypes.STRING(500), defaultValue: '' },
  gender: { type: DataTypes.TINYINT, defaultValue: 0 },
  age: { type: DataTypes.STRING(20), defaultValue: '' },
  bio: { type: DataTypes.STRING(200), defaultValue: '' },
  travelPrefs: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() { try { return JSON.parse(this.getDataValue('travelPrefs')) } catch { return [] } },
    set(v) { this.setDataValue('travelPrefs', JSON.stringify(v || [])) }
  },
  creditScore: { type: DataTypes.FLOAT, defaultValue: 5.0 },
  reviewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  tripCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'users', timestamps: true, underscored: true })

module.exports = User
