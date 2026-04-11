const db = require('../config/database');

class PartnerController {
  async createPartner(req, res) {
    const { userId } = req.body;
    const { trips } = req.body;

    try {
      const connection = await db.getConnection();
      
      try {
        await connection.beginTransaction();

        const [result] = await connection.query(
          `INSERT INTO partners (user_id, country, province, city, start_date, end_date, time, tags, description, people_count, cost_type, price, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'seeking')`,
          [
            userId,
            trips[0].country,
            trips[0].province || '',
            trips[0].city || '',
            trips[0].startDate,
            trips[0].endDate,
            trips[0].time,
            JSON.stringify(trips[0].tags),
            trips[0].description,
            trips[0].peopleCount,
            trips[0].costType,
            trips[0].costType === 'fixed' ? trips[0].price : null
          ]
        );

        const partnerId = result.insertId;

        for (const trip of trips) {
          await connection.query(
            `INSERT INTO trips (partner_id, country, province, city, start_date, end_date, time, tags, description, people_count, cost_type, price)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              partnerId,
              trip.country,
              trip.province || '',
              trip.city || '',
              trip.startDate,
              trip.endDate,
              trip.time,
              JSON.stringify(trip.tags),
              trip.description,
              trip.peopleCount,
              trip.costType,
              trip.costType === 'fixed' ? trip.price : null
            ]
          );
        }

        await connection.commit();

        return res.json({
          success: true,
          data: { id: partnerId },
          message: '发布成功'
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('发布搭子错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }

  async getPartners(req, res) {
    const { country, province, city, startDate, endDate, tag, keyword, page = 1, pageSize = 20 } = req.query;

    try {
      let conditions = [];
      let params = [];

      if (city) {
        conditions.push('city LIKE ?');
        params.push(`%${city}%`);
      } else if (province) {
        conditions.push('province LIKE ?');
        params.push(`%${province}%`);
      } else if (country) {
        conditions.push('country LIKE ?');
        params.push(`%${country}%`);
      }

      if (startDate && endDate) {
        conditions.push('start_date >= ? AND end_date <= ?');
        params.push(startDate, endDate);
      }

      if (tag) {
        conditions.push('JSON_CONTAINS(tags, ?)');
        params.push(`"${tag}"`);
      }

      if (keyword) {
        conditions.push('(description LIKE ? OR city LIKE ?)');
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
      const offset = (page - 1) * pageSize;

      const [partners] = await db.query(
        `SELECT p.*, u.nickname, u.avatar 
         FROM partners p 
         LEFT JOIN users u ON p.user_id = u.id 
         ${whereClause} 
         ORDER BY p.created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      );

      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM partners p ${whereClause}`,
        params
      );

      return res.json({
        success: true,
        data: {
          list: partners,
          total: countResult[0].total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (error) {
      console.error('获取搭子列表错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }

  async getPartnerDetail(req, res) {
    const { partnerId } = req.params;

    try {
      const [partners] = await db.query(
        `SELECT p.*, u.nickname, u.avatar, u.phone 
         FROM partners p 
         LEFT JOIN users u ON p.user_id = u.id 
         WHERE p.id = ?`,
        [partnerId]
      );

      if (partners.length === 0) {
        return res.status(404).json({
          success: false,
          message: '搭子不存在'
        });
      }

      const [trips] = await db.query(
        'SELECT * FROM trips WHERE partner_id = ?',
        [partnerId]
      );

      return res.json({
        success: true,
        data: {
          ...partners[0],
          trips: trips
        }
      });
    } catch (error) {
      console.error('获取搭子详情错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }

  async updatePartnerStatus(req, res) {
    const { partnerId } = req.params;
    const { status } = req.body;

    try {
      await db.query(
        'UPDATE partners SET status = ? WHERE id = ?',
        [status, partnerId]
      );

      return res.json({
        success: true,
        message: '更新成功'
      });
    } catch (error) {
      console.error('更新搭子状态错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }

  async getMyPartners(req, res) {
    const { userId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;

    try {
      const offset = (page - 1) * pageSize;

      const [partners] = await db.query(
        `SELECT p.*, u.nickname, u.avatar 
         FROM partners p 
         LEFT JOIN users u ON p.user_id = u.id 
         WHERE p.user_id = ? 
         ORDER BY p.created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, pageSize, offset]
      );

      const [countResult] = await db.query(
        'SELECT COUNT(*) as total FROM partners WHERE user_id = ?',
        [userId]
      );

      return res.json({
        success: true,
        data: {
          list: partners,
          total: countResult[0].total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    } catch (error) {
      console.error('获取我的搭子错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }
}

module.exports = new PartnerController();
