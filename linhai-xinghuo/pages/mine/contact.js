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
    // Day3：真实写云 feedback 集合（联系方式+昵称从个人资料取，云端优先）
    api.getProfile().then(profile => {
      return api.submitFeedback(this.data.feedback.trim(), profile.phone || '', profile.nickname)
    }).then(res => {
      if (res.success) {
        // 本地兜底缓存（同步保留）
        const list = wx.getStorageSync('feedback_list') || []
        list.unshift({
          content: this.data.feedback,
          time: api.formatDateTime(new Date())
        })
        wx.setStorageSync('feedback_list', list)
        this.setData({ feedback: '' })
        wx.showToast({ title: '反馈已提交，感谢！', icon: 'success' })
      } else {
        wx.showToast({ title: res.reason || '提交失败', icon: 'none' })
      }
    })
  },

  // 拨打电话（模拟器不可用，真机可拨）
  callService() {
    wx.makePhoneCall({
      phoneNumber: '400-000-0000',
      fail: () => wx.showToast({ title: '演示号码，请用下方微信联系', icon: 'none' })
    })
  }
})
