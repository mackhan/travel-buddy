// models/TripMember.js
const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const TripMember = sequelize.define('TripMember', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tripId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING(20), defaultValue: 'pending' }
}, { tableName: 'trip_members', timestamps: true, underscored: true,
  indexes: [{ unique: true, fields: ['trip_id', 'user_id'] }]
})

module.exports = TripMember
