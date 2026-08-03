// 溯源记录页 —— 扫过的所有产品溯源码历史（设计书模块五）
// 数据：扫码时由 api.addTraceHistory 写入本地存储

const api = require('../../utils/api.js')

Page({
  data: {
    history: []
  },

  onShow() {
    this.setData({ history: api.getTraceHistory() })
  },

  // 点历史记录 → 重新打开该档案
  openArchive(e) {
    wx.navigateTo({ url: '/pages/trace/archive?batchNo=' + e.currentTarget.dataset.batch })
  },

  // 清空历史
  clearHistory() {
    wx.showModal({
      title: '清空记录',
      content: '确定清空全部溯源记录吗？',
      confirmColor: '#3A6B4E',
      success: (res) => {
        if (!res.confirm) return
        wx.setStorageSync('trace_history', [])
        this.setData({ history: [] })
      }
    })
  },

  // 去扫码
  goScan() {
    wx.switchTab({ url: '/pages/trace/trace' })
  }
})
