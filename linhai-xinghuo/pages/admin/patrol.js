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

  // 获取位置（Day3：真实 GPS，脱敏取整保留 2 位小数；授权失败回退演示坐标）
  getLocation() {
    return new Promise(resolve => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          resolve({
            latitude: Number(res.latitude.toFixed(2)),    // 脱敏：保留 2 位小数（约 1km 精度）
            longitude: Number(res.longitude.toFixed(2)),
            accuracy: Math.round(res.accuracy || 0),
            fallback: false
          })
        },
        fail: (err) => {
          console.warn('[定位] 获取失败，回退演示坐标:', err)
          resolve({ latitude: 43.75, longitude: 128.20, accuracy: 0, fallback: true })
        }
      })
    })
  },

  // 提交巡护记录（Day3：先定位，再上传照片+写云）
  submit() {
    if (this.data.submitting) return
    if (!this.data.note.trim() && !this.data.photoPath) {
      wx.showToast({ title: '请填写备注或上传照片', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '定位并上传…' })
    this.getLocation().then(location => {
      return api.submitPatrolRecord({
        plot: this.data.selectedPlot,
        note: this.data.note.trim(),
        photoPath: this.data.photoPath,
        location: location
      })
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
  },

  // 删除单条巡护记录（Day3 路线B：逐条管理）
  removeRecord(e) {
    const docId = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除记录',
      content: '确定删除这条巡护记录吗？',
      confirmColor: '#C0392B',
      success: (res) => {
        if (!res.confirm) return
        api.deleteMyRecord('patrol_records', docId).then(result => {
          wx.showToast({ title: result.success ? '已删除' : (result.reason || '删除失败'), icon: 'none' })
          if (result.success) this.loadRecords()
        })
      }
    })
  }
})
