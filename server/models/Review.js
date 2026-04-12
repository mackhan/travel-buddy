// models/Review.js
const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fromUserId: { type: DataTypes.INTEGER, allowNull: false },
  toUserId: { type: DataTypes.INTEGER, allowNull: false },
  tripId: { type: DataTypes.INTEGER, allowNull: false },
  score: { type: DataTypes.FLOAT, allowNull: false },
  content: { type: DataTypes.STRING(500), defaultValue: '' }
}, { tableName: 'reviews', timestamps: true, underscored: true,
  indexes: [{ unique: true, fields: ['from_user_id', 'to_user_id', 'trip_id'] }]
})

module.exports = Review
