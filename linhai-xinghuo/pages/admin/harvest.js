// 采收现场建档（后台-管护员端，v0.2 补齐）
// 设计书模块七：采收时扫码绑定批次——地块+采收人+照片，生成溯源档案原始数据

const api = require('../../utils/api.js')

Page({
  data: {
    plots: ['轮作区A', '轮作区B', '轮作区C', '北坡样地', '溪谷样地'],
    form: { plot: '轮作区A', worker: '', batchNo: '', note: '' },
    photoPath: '',
    submitting: false,
    records: []
  },

  onShow() {
    this.loadRecords()
    // 顺带加载批次列表供选择绑定
    api.getTraceBatches().then(batches => {
      this.setData({ batches })
    })
  },

  loadRecords() {
    api.getHarvestRecords().then(records => this.setData({ records }))
  },

  pick(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.currentTarget.dataset.value })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  choosePhoto() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['camera', 'album'],
      success: (res) => this.setData({ photoPath: res.tempFiles[0].tempFilePath })
    })
  },

  submit() {
    if (this.data.submitting) return
    if (!this.data.form.worker.trim() || !this.data.form.batchNo.trim()) {
      wx.showToast({ title: '请填写采收人和批次号', icon: 'none' }); return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '建档中…' })
    const upload = this.data.photoPath
      ? wx.cloud.uploadFile({ cloudPath: 'harvest/' + Date.now() + '.jpg', filePath: this.data.photoPath })
          .then(res => res.fileID)
      : Promise.resolve('')
    upload.then(fileID => {
      return api.submitHarvestRecord({
        plot: this.data.form.plot,
        worker: this.data.form.worker.trim(),
        batchNo: this.data.form.batchNo.trim(),
        note: this.data.form.note.trim(),
        photoFileID: fileID
      })
    }).then(res => {
      wx.hideLoading()
      this.setData({ submitting: false })
      if (res.success) {
        wx.showToast({ title: '采收建档完成', icon: 'success' })
        this.setData({ 'form.worker': '', 'form.note': '', photoPath: '' })
        this.loadRecords()
      } else {
        wx.showToast({ title: res.reason || '建档失败', icon: 'none' })
      }
    })
  },

  formatTime(t) {
    if (!t) return ''
    return new Date(t).toLocaleString()
  },

  // 删除单条采收建档记录（Day3 路线B）
  removeRecord(e) {
    const docId = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除记录',
      content: '确定删除这条采收建档记录吗？',
      confirmColor: '#C0392B',
      success: (res) => {
        if (!res.confirm) return
        api.deleteMyRecord('harvest_records', docId).then(result => {
          wx.showToast({ title: result.success ? '已删除' : (result.reason || '删除失败'), icon: 'none' })
          if (result.success) this.loadRecords()
        })
      }
    })
  }
})
