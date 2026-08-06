// 客服反馈管理（后台-管理员端，Day3）
// 数据闭环：用户提交的反馈 → 云 feedback 集合 → 本页可见/可处理（不再只躺在控制台）

const api = require('../../utils/api.js')

Page({
  data: {
    feedbackList: []
  },

  onShow() {
    this.loadList()
  },

  loadList() {
    api.getFeedbackList().then(list => this.setData({ feedbackList: list }))
  },

  // 标记已处理/未处理（云端更新；非本人提交时仅本地生效并提示）
  toggleHandled(e) {
    const docId = e.currentTarget.dataset.id
    const handled = e.currentTarget.dataset.handled !== 'true'   // 取反
    api.markFeedbackHandled(docId, handled).then(res => {
      if (res.success) {
        const list = this.data.feedbackList.map(f =>
          f._id === docId ? { ...f, handled } : f)
        this.setData({ feedbackList: list })
        wx.showToast({ title: handled ? '已标记处理' : '已标记未处理', icon: 'none' })
      } else {
        wx.showToast({ title: res.reason || '更新失败', icon: 'none' })
      }
    })
  },

  // 删除反馈（仅自己的可删；他人的提示控制台）
  remove(e) {
    const docId = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除反馈',
      content: '确定删除这条反馈吗？',
      confirmColor: '#C0392B',
      success: (res) => {
        if (!res.confirm) return
        api.deleteFeedback(docId).then(result => {
          wx.showToast({ title: result.success ? '已删除' : (result.reason || '删除失败'), icon: 'none' })
          if (result.success) this.loadList()
        })
      }
    })
  },

  formatTime(t) {
    if (!t) return ''
    return new Date(t).toLocaleString()
  }
})
