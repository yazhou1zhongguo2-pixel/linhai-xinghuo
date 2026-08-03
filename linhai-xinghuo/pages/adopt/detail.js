// 认养计划详情页 —— 权益完整展示 + 认养入口

const api = require('../../utils/api.js')

Page({
  data: {
    plan: null
  },

  onLoad(options) {
    api.getAdoptDetail(options.id).then(plan => {
      this.setData({
        plan: {
          ...plan,
          limitText: plan.limit ? '限量 ' + plan.limit + ' 株 · 已认养 ' + (plan.sold || 0) : ''
        }
      })
    })
  },

  // 认养按钮 → 电子协议页
  goContract() {
    wx.navigateTo({ url: '/pages/adopt/contract?id=' + this.data.plan.id })
  }
})
