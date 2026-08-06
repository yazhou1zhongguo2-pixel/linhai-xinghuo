// 研学详情页 —— 产品完整信息 + 报名入口
// 设计书：行程安排、课程大纲、师资介绍、往期评价、适龄建议

const api = require('../../utils/api.js')

Page({
  data: {
    product: null      // 当前产品详情
  },

  // 每次露脸都刷新：报名成功后返回本页，名额应立即显示真实减少
  onShow() {
    if (this.data.product) this.loadDetail()
  },

  onLoad(options) {
    // options.id 是列表页跳转时 ?id= 传过来的产品编号
    this._id = options.id
    this.loadDetail()
  },

  loadDetail() {
    api.getStudyDetail(this._id).then(product => {
      // 预处理：每个日期算出剩余名额，供界面展示（满员显示"已满"）
      const dates = (product.dates || []).map(d => ({
        ...d,
        remaining: product.capacity - d.booked,
        full: d.booked >= product.capacity
      }))
      this.setData({ product: { ...product, dates } })
      // Day3：合并云端真实评价（用户提交的课后评价显示在最前面，作者=提交时的昵称）
      api.getReviews(product.id).then(cloudReviews => {
        const merged = cloudReviews.map(r => ({
          author: r.nickname || '用户评价',
          date: this.formatDate(r.createdAt),
          content: r.content,
          cloud: true
        })).concat(this.data.product.reviews || [])
        this.setData({ 'product.reviews': merged })
      })
    })
  },


  // 云端时间转日期字符串（yyyy-mm-dd）
  formatDate(t) {
    if (!t) return ''
    const d = new Date(t)
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  },

  // 底部"立即预约"按钮 → 报名页
  goBook() {
    if (!this.data.product) return
    wx.navigateTo({ url: '/pages/study/book?id=' + this.data.product.id })
  },

  // 集合点定位（wx.openLocation 内置地图）
  openMeet() {
    const m = this.data.product.meet
    if (!m) return
    wx.openLocation({
      latitude: m.latitude,
      longitude: m.longitude,
      name: m.name,
      scale: 15
    })
  }
})
