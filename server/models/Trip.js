// models/Trip.js
const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Trip = sequelize.define('Trip', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  destination: { type: DataTypes.STRING(100), allowNull: false },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  tags: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() { try { return JSON.parse(this.getDataValue('tags')) } catch { return [] } },
    set(v) { this.setDataValue('tags', JSON.stringify(v || [])) }
  },
  description: { type: DataTypes.STRING(500), defaultValue: '' },
  maxMembers: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'completed', 'cancelled'), defaultValue: 'active' }
}, { tableName: 'trips', timestamps: true, underscored: true })

module.exports = Trip
