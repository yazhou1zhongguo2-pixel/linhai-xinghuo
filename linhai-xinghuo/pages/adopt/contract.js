// 电子认养协议页 —— 阅读协议 → 同意 → 影子支付 → 成功
// 设计书：用户选择认养计划，在线签署电子认养协议，完成支付

const api = require('../../utils/api.js')

Page({
  data: {
    plan: null,
    agreed: false,       // 是否已勾选"已阅读并同意"
    showPay: false,      // 影子支付弹窗
    success: false,      // 认养是否成功
    adoptionId: '',      // 认养编号
    paidAmount: 0        // 实付金额
  },

  onLoad(options) {
    api.getAdoptDetail(options.id).then(plan => {
      this.setData({ plan: plan })
    })
  },

  // 勾选/取消勾选"已阅读并同意"
  toggleAgree() {
    this.setData({ agreed: !this.data.agreed })
  },

  // 同意并支付：未勾选先提示
  submit() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先阅读并同意协议', icon: 'none' })
      return
    }
    this.setData({ showPay: true })
  },

  onPayCancel() {
    this.setData({ showPay: false })
  },

  // 影子支付确认
  confirmPay() {
    this.setData({ showPay: false })
    api.submitAdoption(this.data.plan.id).then(res => {
      if (res.success) {
        this.setData({ success: true, adoptionId: res.adoptionId, paidAmount: res.amount })
        // v0.4：订阅消息推送（模板字段：thing1=活动名称 thing4=温馨提示，≤20 字）
        api.sendSubscribe('adopt', 'pages/adopt/home', {
          thing1: '认养成功：' + this.data.plan.name,
          thing4: '专属认养主页已开通'
        })
      } else {
        wx.showToast({ title: res.reason, icon: 'none' })
      }
    })
  },

  // 成功 → 查看专属认养主页
  goAdoptHome() {
    wx.redirectTo({ url: '/pages/adopt/home' })
  },

  // 回认养列表
  goBackList() {
    wx.switchTab({ url: '/pages/adopt/adopt' })
  }
})
