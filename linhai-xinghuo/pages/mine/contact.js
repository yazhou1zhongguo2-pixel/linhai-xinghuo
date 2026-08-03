// 联系客服页 —— 联系方式 + 问题反馈（设计书模块五）
// 反馈为影子版：写入本地存储（正式版：云数据库 feedback 集合）

const api = require('../../utils/api.js')

Page({
  data: {
    feedback: ''
  },

  onInput(e) {
    this.setData({ feedback: e.detail.value })
  },

  submit() {
    if (!this.data.feedback.trim()) {
      wx.showToast({ title: '请先填写反馈内容', icon: 'none' })
      return
    }
    // 影子版：连同联系方式一起存本地；正式版写云
    const profile = api.getProfile()
    const list = wx.getStorageSync('feedback_list') || []
    list.unshift({
      content: this.data.feedback,
      phone: profile.phone || '未留联系方式',
      time: new Date().toLocaleString()
    })
    wx.setStorageSync('feedback_list', list)
    this.setData({ feedback: '' })
    wx.showToast({ title: '反馈已提交，感谢！', icon: 'success' })
  },

  // 拨打电话（模拟器不可用，真机可拨）
  callService() {
    wx.makePhoneCall({
      phoneNumber: '400-000-0000',
      fail: () => wx.showToast({ title: '演示号码，请用下方微信联系', icon: 'none' })
    })
  }
})
