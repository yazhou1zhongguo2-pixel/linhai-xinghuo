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

  // 课后评价（Day3：真实写云 reviews 集合 → 产品详情页"往期评价"展示）
  review(e) {
    const orderId = e.currentTarget.dataset.id
    const productId = e.currentTarget.dataset.product
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
        // 带上个人资料昵称作为评价作者（Day3 修复：作者随"我的"昵称变化）
        api.getProfile().then(profile => {
          return api.submitReview({
            orderId: orderId,
            productId: productId,
            content: res.content.trim(),
            nickname: profile.nickname || '用户评价'
          })
        }).then(result => {
          if (result.success) {
            wx.showToast({ title: '评价已提交', icon: 'success' })
          } else {
            wx.showToast({ title: result.reason || '提交失败', icon: 'none' })
          }
        })
      }
    })
  },

  // 回首页看故事流
  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
