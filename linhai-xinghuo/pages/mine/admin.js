// 后台管理枢纽页 —— 学生团队使用（设计书模块六七八）
// 身份校验（影子版）：口令门（演示口令 linhai2026，本地存储会话）
// 正式版：云函数 + 管理员角色表（openid 白名单），口令方式仅作演示

const ADMIN_PASSWORD = 'linhai2026'   // 演示口令（正式版移除，改为云端校验）
const ADMIN_AUTH_KEY = 'admin_authed'

Page({
  // 三个入口
  go(e) {
    const page = e.currentTarget.dataset.page
    if (page) wx.navigateTo({ url: page })
  },

  // 进入时校验：未通过口令门则先验证
  onLoad() {
    if (wx.getStorageSync(ADMIN_AUTH_KEY)) return   // 本机已通过验证
    this.askPassword()
  },

  askPassword() {
    wx.showModal({
      title: '后台验证',
      editable: true,
      placeholderText: '请输入管理口令',
      confirmText: '进入',
      confirmColor: '#3A6B4E',
      success: (res) => {
        if (!res.confirm) {
          wx.navigateBack()   // 取消则退出后台
          return
        }
        if (res.content === ADMIN_PASSWORD) {
          wx.setStorageSync(ADMIN_AUTH_KEY, true)
          wx.showToast({ title: '验证通过', icon: 'success' })
        } else {
          wx.showToast({ title: '口令错误', icon: 'none' })
          setTimeout(() => wx.navigateBack(), 800)
        }
      }
    })
  }
})
