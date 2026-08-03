// 我的研学页 —— 已报名的研学课程（云数据库 study_bookings）
// 设计书：已报名课程、行程提醒、历史评价（评价为影子版：弹窗输入存本地）

const api = require('../../utils/api.js')

Page({
  data: {
    studies: []
  },

  onShow() {
    this.loadStudies()
  },

  loadStudies() {
    api.getMyStudies().then(studies => {
      this.setData({ studies: studies })
    })
  },

  // 课后评价（影子版：wx.showModal 可输入弹窗，存本地）
  review(e) {
    const orderId = e.currentTarget.dataset.id
    wx.showModal({
      title: '课程评价',
      editable: true,
      placeholderText: '分享你的研学体验（1-3 个工作日后展示）',
      confirmColor: '#3A6B4E',
      success: (res) => {
        if (!res.confirm || !res.content.trim()) {
          if (res.confirm) wx.showToast({ title: '评价不能为空', icon: 'none' })
          return
        }
        const list = wx.getStorageSync('my_reviews') || []
        list.unshift({ orderId, content: res.content.trim(), time: new Date().toLocaleString() })
        wx.setStorageSync('my_reviews', list)
        wx.showToast({ title: '评价已提交，感谢！', icon: 'success' })
      }
    })
  },

  // 回首页看故事流
  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
