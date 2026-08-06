// 订单与用户管理（后台-管理员端）
// 设计书模块八：研学报名审核、认养订单管理、数据导出
// 订单列表真实读云；状态修改为影子版（客户端无权限改他人文档，正式版用云函数）

const api = require('../../utils/api.js')

Page({
  data: {
    tab: 'study',       // 当前查看的订单类型：study / adopt
    study: [],          // 研学订单
    adopt: [],          // 认养记录
    exporting: false
  },

  onShow() {
    this.load()
  },

  load() {
    api.getAllOrders().then(({ study, adopt }) => {
      this.setData({ study: study, adopt: adopt })
    })
  },

  // 切换订单类型
  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab })
  },

  // 状态修改（影子版：仅界面反馈；正式版由云函数执行，客户端无权改他人订单）
  changeStatus(e) {
    const id = e.currentTarget.dataset.id
    const status = e.currentTarget.dataset.status
    wx.showModal({
      title: '确认操作',
      content: '将订单 ' + id + ' 标记为「' + status + '」？（演示版仅界面生效，正式版写云）',
      confirmColor: '#3A6B4E',
      success: (res) => {
        if (!res.confirm) return
        // 本地改状态（影子）
        if (this.data.tab === 'study') {
          const study = this.data.study.map(o => (o.orderId === id ? { ...o, status } : o))
          this.setData({ study })
        } else {
          const adopt = this.data.adopt.map(o => (o.adoptionId === id ? { ...o, status } : o))
          this.setData({ adopt })
        }
        wx.showToast({ title: '已标记（演示）', icon: 'none' })
      }
    })
  },

  // 数据导出指引（设计书：数据导出 → 云开发控制台自带 CSV 导出）
  exportData() {
    wx.showModal({
      title: '数据导出',
      content: '在云开发控制台 → 数据库 → 对应集合 → 导出 CSV 即可。正式版可增加云函数生成汇总报表。',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#3A6B4E'
    })
  },

  formatTime(t) {
    if (!t) return ''
    return api.formatDateTime(t)
  },

  // 删除订单（Day3 路线B：逐条管理；研学/认养对应不同集合）
  removeOrder(e) {
    const docId = e.currentTarget.dataset.id
    const tab = e.currentTarget.dataset.tab
    const collection = tab === 'study' ? 'study_bookings' : 'adoptions'
    wx.showModal({
      title: '删除订单',
      content: '确定删除这条订单吗？（删除后"我的订单"同步移除）',
      confirmColor: '#C0392B',
      success: (res) => {
        if (!res.confirm) return
        // 研学订单删除走云函数（释放名额）；认养走普通删除
        const action = collection === 'study_bookings'
          ? api.releaseBooking(docId)
          : api.deleteMyRecord(collection, docId)
        action.then(result => {
          wx.showToast({ title: result.success ? '已删除' : (result.reason || '删除失败'), icon: 'none' })
          if (result.success) this.load()
        })
      }
    })
  }
})
