const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UserController {
  async login(req, res) {
    const { openid, nickname, avatar } = req.body;
    
    try {
      const [users] = await db.query(
        'SELECT * FROM users WHERE openid = ?',
        [openid]
      );

      if (users.length === 0) {
        const [result] = await db.query(
          'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
          [openid, nickname, avatar]
        );
        
        const [newUser] = await db.query(
          'SELECT * FROM users WHERE id = ?',
          [result.insertId]
        );
        
        return res.json({
          success: true,
          data: newUser[0],
          message: '注册成功'
        });
      }

      return res.json({
        success: true,
        data: users[0],
        message: '登录成功'
      });
    } catch (error) {
      console.error('登录错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }

  async getUserInfo(req, res) {
    const { userId } = req.params;

    try {
      const [users] = await db.query(
        'SELECT id, openid, nickname, avatar, phone, created_at FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      return res.json({
        success: true,
        data: users[0]
      });
    } catch (error) {
      console.error('获取用户信息错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }

  async updateProfile(req, res) {
    const { userId } = req.params;
    const { nickname, avatar, phone } = req.body;

    try {
      await db.query(
        'UPDATE users SET nickname = ?, avatar = ?, phone = ? WHERE id = ?',
        [nickname, avatar, phone, userId]
      );

      return res.json({
        success: true,
        message: '更新成功'
      });
    } catch (error) {
      console.error('更新用户信息错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }
}

module.exports = new UserController();
