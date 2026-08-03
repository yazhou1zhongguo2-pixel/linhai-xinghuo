// 研学报名页 —— 选日期+人数+参与者信息 → 名额校验 → 影子支付 → 成功(行前须知)
// 设计书：从"看到"到"报名"不超过 3 步；每团 ≤20 人，满额自动关闭该日期报名

const api = require('../../utils/api.js')

Page({
  data: {
    product: null,       // 产品信息
    dates: [],           // 日期列表（含剩余名额、是否满员）
    selectedDate: '',    // 选中的日期
    count: 1,            // 报名人数
    maxCount: 1,         // 当前日期可约上限（剩余名额）
    form: { name: '', age: '', phone: '' },   // 参与者信息
    total: 0,            // 费用合计
    showPay: false,      // 影子支付确认弹窗
    success: false,      // 是否报名成功
    orderId: '',         // 订单号（影子版生成）
    paidAmount: 0        // 实付金额
  },

  onLoad(options) {
    api.getStudyDetail(options.id).then(product => {
      // 预处理：每个日期算剩余名额；满员的不可选
      const dates = (product.dates || []).map(d => ({
        ...d,
        remaining: product.capacity - d.booked,
        full: d.booked >= product.capacity
      }))
      // 默认选中第一个还有名额的日期
      const first = dates.find(d => !d.full)
      this.setData({
        product,
        dates,
        selectedDate: first ? first.date : '',
        maxCount: first ? first.remaining : 1
      })
      this.recalcTotal()
    })
  },

  // 选择日期（满员的日期点了给提示，不让选）
  selectDate(e) {
    const date = e.currentTarget.dataset.date
    const slot = this.data.dates.find(d => d.date === date)
    if (!slot || slot.full) {
      wx.showToast({ title: '该日期已满员', icon: 'none' })
      return
    }
    this.setData({
      selectedDate: date,
      maxCount: slot.remaining,
      count: 1    // 换日期后人数重置
    })
    this.recalcTotal()
  },

  // 人数变化（van-stepper 触发，e.detail 是新值）
  onCountChange(e) {
    this.setData({ count: e.detail })
    this.recalcTotal()
  },

  // 表单输入（van-field 触发，data-field 区分是哪个输入框）
  onFieldChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail })
  },

  // 重新计算费用合计
  recalcTotal() {
    this.setData({ total: (this.data.product ? this.data.product.price : 0) * this.data.count })
  },

  // 提交报名：先本地校验，通过后弹"影子支付"确认框
  submit() {
    const { selectedDate, count, form } = this.data
    if (!selectedDate) {
      wx.showToast({ title: '请选择日期', icon: 'none' }); return
    }
    if (!form.name.trim()) {
      wx.showToast({ title: '请填写姓名', icon: 'none' }); return
    }
    if (!form.age.trim()) {
      wx.showToast({ title: '请填写年龄', icon: 'none' }); return
    }
    if (!/^1\d{10}$/.test(form.phone)) {
      wx.showToast({ title: '请填写正确的手机号', icon: 'none' }); return
    }
    // 校验通过 → 弹出"确认支付"（影子版：点击确认即模拟支付成功）
    this.setData({ showPay: true })
  },

  // 取消支付：只是关掉弹窗，表单内容保留
  onPayCancel() {
    this.setData({ showPay: false })
  },

  // 影子支付：点击"确认支付"
  confirmPay() {
    this.setData({ showPay: false })
    const { product, selectedDate, count, form } = this.data
    api.submitBooking({
      productId: product.id,
      date: selectedDate,
      count: count,
      participants: form
    }).then(res => {
      if (res.success) {
        this.setData({ success: true, orderId: res.orderId, paidAmount: res.amount })
      } else {
        wx.showToast({ title: res.reason, icon: 'none' })
      }
    })
  },

  // 报名成功后回首页
  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
