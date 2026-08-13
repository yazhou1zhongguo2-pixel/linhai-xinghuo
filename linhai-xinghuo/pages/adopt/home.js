// 专属认养主页 —— 设计书：认养用户获得专属页面
// 展示：认养地块/树木状态、生长照片、季度报告推送记录、续约提醒（到期前30天）

const api = require('../../utils/api.js')

Page({
  data: {
    adoptions: [],       // 我的认养列表
    selectedId: '',      // 当前选中的认养
    reports: [],         // 选中认养的季度生长报告
    carbonReport: null,  // 碳汇趣味报告（红松计划专属）
    hasExpiring: false   // 是否有临期认养（≤30 天，触发续约提醒）
  },

  onLoad() {
    api.getMyAdoptions().then(adoptions => {
      // 预处理：标记临期（距到期 ≤30 天 → 显示续约提醒）
      const list = adoptions.map(a => ({ ...a, expiring: a.daysLeft <= 30 }))
      this.setData({
        adoptions: list,
        hasExpiring: list.some(a => a.expiring)
      })
      // 默认选中第一个认养
      if (list.length) this.selectAdoption(list[0].id)
    })
  },

  // 选中某个认养 → 加载它的报告
  selectAdoption(e) {
    const id = typeof e === 'string' ? e : e.currentTarget.dataset.id
    if (id === this.data.selectedId) return
    this.setData({ selectedId: id })
    const adoption = this.data.adoptions.find(a => a.id === id)
    api.getAdoptReports(adoption.planId).then(reports => {
      this.setData({ reports: reports })
    })
    api.getAdoptDetail(adoption.planId).then(plan => {
      this.setData({ carbonReport: plan.carbonReport || null })
    })
  },

  // 一键续约（v0.4.2：云端真实续约，仅本人记录）
  renew(e) {
    const id = e.currentTarget.dataset.id
    api.renewAdoption(id).then(res => {
      if (!res.success) {
        wx.showToast({ title: res.reason || '续约失败', icon: 'none' })
        return
      }
      wx.showToast({ title: '续约成功（演示）', icon: 'success' })
      // 更新该条状态：不再临期，天数重置为 365
      const adoptions = this.data.adoptions.map(a => {
        if (a.id === id) return { ...a, expiring: false, daysLeft: 365 }
        return a
      })
      this.setData({
        adoptions: adoptions,
        hasExpiring: adoptions.some(a => a.expiring)
      })
    })
  },

  // 去认养更多（回到认养列表 tab）
  goAdoptTab() {
    wx.switchTab({ url: '/pages/adopt/adopt' })
  }
})
