// 我的订单页 —— 研学订单 + 认养订单（云数据库，按时间倒序）
// 设计书模块五：历史购买记录、订单状态

const api = require('../../utils/api.js')

Page({
  data: {
    orders: []
  },

  onShow() {
    // onShow：报名/认养后回到本页，新订单立即可见
    this.loadOrders()
  },

  loadOrders() {
    api.getMyOrders().then(orders => {
      this.setData({ orders: orders })
    })
  },

  // 去报名/认养
  goStudy() {
    wx.switchTab({ url: '/pages/study/study' })
  }
})
