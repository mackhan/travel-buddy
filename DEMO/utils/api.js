const BASE_URL = 'http://localhost:3000/api';

function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method: method,
      data: data,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(res.data);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

module.exports = {
  login: (openid, nickname, avatar) => {
    return request('/user/login', 'POST', { openid, nickname, avatar });
  },

  getUserInfo: (userId) => {
    return request(`/user/info/${userId}`);
  },

  updateProfile: (userId, data) => {
    return request(`/user/profile/${userId}`, 'PUT', data);
  },

  createPartner: (userId, trips) => {
    return request('/partner/create', 'POST', { userId, trips });
  },

  getPartners: (params) => {
    return request('/partner/list', 'GET', params);
  },

  getPartnerDetail: (partnerId) => {
    return request(`/partner/detail/${partnerId}`);
  },

  updatePartnerStatus: (partnerId, status) => {
    return request(`/partner/status/${partnerId}`, 'PUT', { status });
  },

  getMyPartners: (userId, params) => {
    return request(`/partner/my/${userId}`, 'GET', params);
  }
};
