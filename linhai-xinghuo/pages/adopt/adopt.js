// 云认养页 —— "成为这片林子的一部分"（设计书模块四）
// 三层认养计划：木耳菌棒 199元/年 · 红松复合 1999元/年 · 林下参 19999元/株(限量50)

const api = require('../../utils/api.js')

Page({
  data: {
    plans: []
  },

  onLoad() {
    api.getAdoptPlans().then(plans => {
      // 预处理：限量计划的角标文案（如"限量50株 · 已认养12"）
      const list = plans.map(p => ({
        ...p,
        limitText: p.limit ? '限量 ' + p.limit + ' 株 · 已认养 ' + (p.sold || 0) : ''
      }))
      this.setData({ plans: list })
    })
  },

  // 点计划卡片 → 详情页
  goDetail(e) {
    wx.navigateTo({ url: '/pages/adopt/detail?id=' + e.currentTarget.dataset.id })
  }
})
