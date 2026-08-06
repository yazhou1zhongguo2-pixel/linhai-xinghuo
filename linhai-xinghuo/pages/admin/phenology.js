// 物候观测录入（后台-管护员端，v0.2 补齐）
// 设计书模块七：按统一规范记录刺五加发芽期、红松球果膨大期、木耳出耳期等关键物候事件

const api = require('../../utils/api.js')

Page({
  data: {
    events: ['刺五加发芽期', '红松球果膨大期', '木耳出耳期', '赤灵芝孢子粉释放期'],
    plots: ['轮作区A', '轮作区B', '轮作区C', '北坡样地', '溪谷样地'],
    form: { event: '刺五加发芽期', plot: '轮作区A', note: '' },
    photoPath: '',
    submitting: false,
    records: []
  },

  onShow() {
    this.loadRecords()
  },

  loadRecords() {
    api.getPhenologyRecords().then(records => this.setData({ records }))
  },

  pick(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.currentTarget.dataset.value })
  },

  onNote(e) {
    this.setData({ 'form.note': e.detail.value })
  },

  choosePhoto() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['camera', 'album'],
      success: (res) => this.setData({ photoPath: res.tempFiles[0].tempFilePath })
    })
  },

  submit() {
    if (this.data.submitting) return
    if (!this.data.form.note.trim() && !this.data.photoPath) {
      wx.showToast({ title: '请填写观察记录或上传照片', icon: 'none' }); return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '上传中…' })
    // 照片先传云存储
    const upload = this.data.photoPath
      ? wx.cloud.uploadFile({ cloudPath: 'phenology/' + Date.now() + '.jpg', filePath: this.data.photoPath })
          .then(res => res.fileID)
      : Promise.resolve('')
    upload.then(fileID => {
      return api.submitPhenologyRecord({
        event: this.data.form.event,
        plot: this.data.form.plot,
        note: this.data.form.note.trim(),
        photoFileID: fileID
      })
    }).then(res => {
      wx.hideLoading()
      this.setData({ submitting: false })
      if (res.success) {
        wx.showToast({ title: '物候观测已记录', icon: 'success' })
        this.setData({ 'form.note': '', photoPath: '' })
        this.loadRecords()
      } else {
        wx.showToast({ title: res.reason || '提交失败', icon: 'none' })
      }
    })
  },

  formatTime(t) {
    if (!t) return ''
    return new Date(t).toLocaleString()
  },

  // 删除单条物候记录（Day3 路线B）
  removeRecord(e) {
    const docId = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除记录',
      content: '确定删除这条物候观测记录吗？',
      confirmColor: '#C0392B',
      success: (res) => {
        if (!res.confirm) return
        api.deleteMyRecord('phenology_records', docId).then(result => {
          wx.showToast({ title: result.success ? '已删除' : (result.reason || '删除失败'), icon: 'none' })
          if (result.success) this.loadRecords()
        })
      }
    })
  }
})
