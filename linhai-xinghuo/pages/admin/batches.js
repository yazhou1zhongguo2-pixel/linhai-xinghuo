// 产品批次管理（后台-管理员端，v0.2 补齐）
// 设计书模块八：产品库存与批次管理——新增/删除批次（写云 trace_batches）

const api = require('../../utils/api.js')

Page({
  data: {
    batches: [],
    // 基础信息 + 产地信息 + 采收信息（设计书：五维数据来源分散，表单覆盖最常用的维度）
    form: {
      batchNo: '', product: '', archiveId: '',
      plotId: '', gps: '', fallowYears: '', ecoZone: '',
      harvestDate: '', worker: ''
    },
    submitting: false,
    editingId: '',       // 编辑模式：正在编辑的批次 _id（空 = 新增模式）
    editingDoc: null     // 编辑模式：原批次文档（合并保留未编辑字段）
  },

  // 清空表单（新增/取消编辑共用）
  resetForm() {
    this.setData({
      editingId: '',
      editingDoc: null,
      form: {
        batchNo: '', product: '', archiveId: '',
        plotId: '', gps: '', fallowYears: '', ecoZone: '',
        harvestDate: '', worker: ''
      }
    })
  },

  onShow() {
    this.loadBatches()
  },

  loadBatches() {
    api.getTraceBatches().then(batches => this.setData({ batches }))
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  submit() {
    const f = this.data.form
    if (!f.batchNo.trim() || !f.product.trim()) {
      wx.showToast({ title: '请填写批次号和产品名', icon: 'none' }); return
    }
    // 查重只在新增模式执行（编辑模式改自己的批次号不算重复）
    if (!this.data.editingId && this.data.batches.some(b => b.batchNo === f.batchNo.trim())) {
      wx.showToast({ title: '批次号已存在', icon: 'none' }); return
    }
    this.setData({ submitting: true })

    // 编辑模式：只更新基础/产地/采收字段，合并保留原文档其余字段
    if (this.data.editingId) {
      const doc = this.data.editingDoc
      api.updateBatch(this.data.editingId, {
        batchNo: f.batchNo.trim(),
        product: f.product.trim(),
        archiveId: f.archiveId.trim() || doc.archiveId,
        origin: Object.assign({}, doc.origin, {
          plotId: f.plotId.trim() || '待完善',
          gps: f.gps.trim() || '待完善',
          fallowYears: f.fallowYears.trim() || '待完善',
          ecoZone: f.ecoZone.trim() || '待完善'
        }),
        harvest: Object.assign({}, doc.harvest, {
          date: f.harvestDate.trim() || '待完善',
          worker: f.worker.trim() || '待完善'
        })
      }).then(res => {
        this.setData({ submitting: false })
        if (res.success) {
          wx.showToast({ title: '批次已更新', icon: 'success' })
          this.resetForm()
          this.loadBatches()
        } else {
          wx.showToast({ title: res.reason || '更新失败', icon: 'none' })
        }
      })
      return
    }

    // 新增模式
    api.addBatch({
      batchNo: f.batchNo.trim(),
      product: f.product.trim(),
      archiveId: f.archiveId.trim() || ('LH-ARC-' + Date.now()),
      timestamp: api.formatDateTime(new Date()),
      // 产地信息（管理员填写；GPS 按设计书脱敏至林班层级）
      origin: {
        plotId: f.plotId.trim() || '待完善',
        gps: f.gps.trim() || '待完善',
        fallowYears: f.fallowYears.trim() || '待完善',
        ecoZone: f.ecoZone.trim() || '待完善',
        gpsCoords: { latitude: 43.75, longitude: 128.20 }
      },
      // 生长/环境数据：由管护员端记录汇聚（正式版云函数联动），先留空
      growth: [],
      env: { months: [], soilTemp: [], humidity: [], note: '生长与环境数据由管护员端记录汇聚（正式版联动）' },
      // 采收信息（管理员填写）
      harvest: {
        date: f.harvestDate.trim() || '待完善',
        worker: f.worker.trim() || '待完善',
        photo: '',
        note: ''
      },
      report: { summary: [], lab: '待完善', pdfUrl: '' }
    }).then(res => {
      this.setData({ submitting: false })
      if (res.success) {
        wx.showToast({ title: '批次已新增', icon: 'success' })
        this.resetForm()
        this.loadBatches()
      } else {
        wx.showToast({ title: res.reason || '新增失败', icon: 'none' })
      }
    })
  },

  // 进入编辑模式：回填表单
  startEdit(e) {
    const docId = e.currentTarget.dataset.id
    const doc = this.data.batches.find(b => b._id === docId)
    if (!doc) return
    this.setData({
      editingId: docId,
      editingDoc: doc,
      form: {
        batchNo: doc.batchNo || '',
        product: doc.product || '',
        archiveId: doc.archiveId || '',
        plotId: (doc.origin && doc.origin.plotId !== '待完善') ? doc.origin.plotId : '',
        gps: (doc.origin && doc.origin.gps !== '待完善') ? doc.origin.gps : '',
        fallowYears: (doc.origin && doc.origin.fallowYears !== '待完善') ? doc.origin.fallowYears : '',
        ecoZone: (doc.origin && doc.origin.ecoZone !== '待完善') ? doc.origin.ecoZone : '',
        harvestDate: (doc.harvest && doc.harvest.date !== '待完善') ? doc.harvest.date : '',
        worker: (doc.harvest && doc.harvest.worker !== '待完善') ? doc.harvest.worker : ''
      }
    })
    wx.pageScrollTo({ scrollTop: 0 })
  },

  // 取消编辑
  cancelEdit() {
    this.resetForm()
  },

  remove(e) {
    const docId = e.currentTarget.dataset.id
    const batchNo = e.currentTarget.dataset.batch
    wx.showModal({
      title: '删除批次',
      content: '确定删除批次 ' + batchNo + ' 吗？',
      confirmColor: '#C0392B',
      success: (res) => {
        if (!res.confirm) return
        api.deleteBatch(docId).then(result => {
          wx.showToast({ title: result.success ? '已删除' : (result.reason || '删除失败'), icon: 'none' })
          if (result.success) this.loadBatches()
        })
      }
    })
  },

  // 从模板导入演示批次（把无主的旧种子数据以当前用户身份重建）
  importSeeds() {
    wx.showModal({
      title: '导入演示批次',
      content: '将从模板重建"黑木耳/赤灵芝"两条演示批次（自动归属当前账号）。\n提示：如云端还留有旧的无主批次，请先到云控制台删除，避免重复。',
      confirmColor: '#3A6B4E',
      success: (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '导入中…' })
        api.importSeedBatches().then(result => {
          wx.hideLoading()
          if (result.success) {
            wx.showToast({ title: result.added ? '已导入 ' + result.added + ' 条演示批次' : '演示批次已存在，无需导入', icon: 'none' })
            this.loadBatches()
          } else {
            wx.showToast({ title: result.reason || '导入失败', icon: 'none' })
          }
        })
      }
    })
  },

  // 上传检测报告 PDF 并绑定到批次
  // 注意：文件必须从小程序上传（存储免费套餐仅创建者可读写，控制台上传的文件无归属读不了）
  uploadPdf(e) {
    const docId = e.currentTarget.dataset.id
    const batchNo = e.currentTarget.dataset.batch
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const filePath = res.tempFiles[0].path
        wx.showLoading({ title: '上传中…' })
        wx.cloud.uploadFile({
          cloudPath: 'reports/' + batchNo + '-' + Date.now() + '.pdf',
          filePath: filePath
        }).then(upload => {
          return api.uploadBatchReport(docId, upload.fileID)
        }).then(result => {
          wx.hideLoading()
          wx.showToast({ title: result.success ? 'PDF 已绑定' : (result.reason || '绑定失败'), icon: 'none' })
        }).catch(err => {
          wx.hideLoading()
          console.error('[上传] PDF 失败:', err)
          wx.showToast({ title: '上传失败', icon: 'none' })
        })
      }
    })
  }
})
