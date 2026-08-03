// 巡护与物候 · 巡护记录上传（后台-管护员端）
// 设计书模块七：选地块 + 照片 + 备注，自动关联 GPS 和时间戳，形成"样地日记"时间轴
// 照片真实上传云存储（wx.cloud.uploadFile），记录写云 patrol_records

const api = require('../../utils/api.js')

Page({
  data: {
    plots: ['轮作区A', '轮作区B', '轮作区C', '北坡样地', '溪谷样地'],  // 可选地块
    selectedPlot: '轮作区A',
    photoPath: '',       // 本地选择的照片路径
    note: '',
    submitting: false,
    records: []          // 已上传的巡护记录（读云）
  },

  onLoad() {
    this.loadRecords()
  },

  loadRecords() {
    api.getPatrolRecords().then(records => {
      this.setData({ records: records })
    })
  },

  pickPlot(e) {
    this.setData({ selectedPlot: e.currentTarget.dataset.value })
  },

  // 选择照片（拍照或相册）
  choosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        this.setData({ photoPath: res.tempFiles[0].tempFilePath })
      }
    })
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  // 提交巡护记录
  submit() {
    if (this.data.submitting) return
    if (!this.data.note.trim() && !this.data.photoPath) {
      wx.showToast({ title: '请填写备注或上传照片', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '上传中…' })
    api.submitPatrolRecord({
      plot: this.data.selectedPlot,
      note: this.data.note.trim(),
      photoPath: this.data.photoPath
    }).then(res => {
      wx.hideLoading()
      this.setData({ submitting: false })
      if (res.success) {
        wx.showToast({ title: '巡护记录已上传', icon: 'success' })
        this.setData({ note: '', photoPath: '' })
        this.loadRecords()
      } else {
        wx.showToast({ title: '上传失败，看控制台', icon: 'none' })
      }
    })
  },

  // 时间显示（云端 Date 转本地字符串）
  formatTime(t) {
    if (!t) return ''
    const d = new Date(t)
    return d.toLocaleString()
  }
})
