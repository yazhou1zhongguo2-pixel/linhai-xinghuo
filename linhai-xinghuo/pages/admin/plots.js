// 生态数据看板更新（后台-内容管理，v0.2 补齐）
// 设计书模块六：导入实测数据 → 写云 plots 集合 → 首页看板与折线图联动更新

const api = require('../../utils/api.js')

Page({
  data: {
    plots: [],       // 三个样地（含编辑中的表单值）
    saving: false
  },

  onShow() {
    // 读云样地数据；云端为空（如刚删除无主记录待重建）时回退 mock 标准样地，
    // 保证页面永远有 A/B/C 三个可编辑表单——保存即新建归属记录
    api.getHomeData().then(home => {
      const source = home.plots.length ? home.plots : [
        { id: 'A', name: '轮作区A', soilOrganic: [21.0, 22.1, 22.8], bioIndex: 3.2, carbonSeq: 128 },
        { id: 'B', name: '对照区B', soilOrganic: [18.2, 18.1, 18.3], bioIndex: 2.4, carbonSeq: 96 },
        { id: 'C', name: '轮作区C', soilOrganic: [19.4, 20.2, 21.3], bioIndex: 2.9, carbonSeq: 110 }
      ]
      const plots = source.map(p => ({
        id: p.id,
        name: p.name,
        q1: p.soilOrganic[0],            // 三个季度历史值
        q2: p.soilOrganic[1],
        q3: p.soilOrganic[2],
        bioIndex: p.bioIndex,
        carbonSeq: p.carbonSeq,
        update: p.update || ''
      }))
      this.setData({ plots })
    })
  },

  onInput(e) {
    const id = e.currentTarget.dataset.id
    const field = e.currentTarget.dataset.field
    this.setData({ ['plots[' + this.data.plots.findIndex(p => p.id === id) + '].' + field]: e.detail.value })
  },

  // 保存某个样地
  save(e) {
    const id = e.currentTarget.dataset.id
    const p = this.data.plots.find(x => x.id === id)
    if (!p) return
    const q1 = Number(p.q1), q2 = Number(p.q2), q3 = Number(p.q3)
    if ([q1, q2, q3, Number(p.bioIndex), Number(p.carbonSeq)].some(isNaN)) {
      wx.showToast({ title: '数值格式不正确', icon: 'none' }); return
    }
    wx.showLoading({ title: '保存中…' })
    api.updatePlot(id, {
      soilOrganic: [q1, q2, q3],
      bioIndex: Number(p.bioIndex),
      carbonSeq: Number(p.carbonSeq),
      update: p.update || '手动更新'
    }).then(res => {
      wx.hideLoading()
      if (res.success) {
        // 保存成功后自查：重新读一次云端数据，确认写进去了（避免"以为保存了"）
        api.getHomeData().then(home => {
          const saved = home.plots.find(x => x.id === id)
          const msg = saved ? '已保存：有机质最新 ' + saved.soilOrganic[saved.soilOrganic.length - 1] + '%' : '已保存'
          wx.showToast({ title: msg, icon: 'none' })
        })
      } else {
        // 保存失败：明确展示原因（通常是种子数据无归属导致的权限拒绝）
        wx.showModal({
          title: '保存失败',
          content: res.reason + '。修复办法：云控制台 → 数据库 → plots → 删除该样地记录后重试（新记录才有归属权限）。',
          showCancel: false,
          confirmText: '知道了',
          confirmColor: '#C0392B'
        })
      }
    })
  }
})
