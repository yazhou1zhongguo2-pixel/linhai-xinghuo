// 林地影像更新（后台-内容管理，v0.2 补齐）
// 设计书模块六：上传无人机正射影像，标注拍摄日期和地块说明 → 首页顶部影像区
// 照片真实上传云存储（wx.cloud.uploadFile），配置写云 imagery 集合

const api = require('../../utils/api.js')

Page({
  data: {
    current: null,       // 当前展示的影像配置
    photoPath: '',       // 新选择的照片
    date: '',
    plot: '',
    note: '',
    submitting: false
  },

  onLoad() {
    api.getImagery().then(img => {
      this.setData({
        current: img,
        date: img.date || '',
        plot: img.plot || '',
        note: img.note || ''
      })
    })
  },

  choosePhoto() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['camera', 'album'],
      success: (res) => this.setData({ photoPath: res.tempFiles[0].tempFilePath })
    })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  submit() {
    if (this.data.submitting) return
    if (!this.data.photoPath && !this.data.current) {
      wx.showToast({ title: '请选择影像文件', icon: 'none' }); return
    }
    if (!this.data.date.trim() || !this.data.plot.trim()) {
      wx.showToast({ title: '请填写拍摄日期和地块说明', icon: 'none' }); return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '上传中…' })
    api.updateImagery({
      photoPath: this.data.photoPath,
      keepUrl: this.data.current ? this.data.current.url : '',
      date: this.data.date.trim(),
      plot: this.data.plot.trim(),
      note: this.data.note.trim()
    }).then(res => {
      wx.hideLoading()
      this.setData({ submitting: false })
      if (res.success) {
        wx.showToast({ title: '影像已更新，首页可见', icon: 'success' })
        api.getImagery().then(img => this.setData({ current: img, photoPath: '' }))
      } else {
        wx.showToast({ title: res.reason || '更新失败', icon: 'none' })
      }
    })
  }
})
