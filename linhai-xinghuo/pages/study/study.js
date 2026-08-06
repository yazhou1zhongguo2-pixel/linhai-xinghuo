// 研学页 —— "来林子里亲自看一看"（设计书模块三）
// 三类研学产品展示：一日研学 / 三日深度营 / 五日科考营

const api = require('../../utils/api.js')

Page({
  data: {
    products: []     // 产品列表（含预处理后的名额信息）
  },

  // 每次露脸都刷新：报名后名额真实减少要能立即看到（onLoad 只跑一次的教训）
  onShow() {
    this.loadProducts()
  },

  onLoad() {
    this.loadProducts()
  },

  loadProducts() {
    api.getStudyProducts().then(products => {
      // 预处理：每个产品算出"最近可约日期 + 剩余名额"（满员的显示"本档期已满"）
      const list = products.map(p => {
        // 找出还有名额的日期，取最近的一个
        const available = (p.dates || []).filter(d => d.booked < p.capacity)
        const next = available.length ? available[0] : null
        return {
          ...p,
          nextDate: next ? next.date : '',
          remaining: next ? p.capacity - next.booked : 0
        }
      })
      this.setData({ products: list })
    })
  },


  // 点产品卡片 → 详情页
  goDetail(e) {
    wx.navigateTo({ url: '/pages/study/detail?id=' + e.currentTarget.dataset.id })
  }
})
