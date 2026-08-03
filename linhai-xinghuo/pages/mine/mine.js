// "我的"页 —— 个人中心（设计书模块五）
// 个人信息 + 8 个入口：订单/认养/研学/收藏/溯源记录/消息/客服/后台管理

const api = require('../../utils/api.js')

Page({
  data: {
    profile: {},         // 个人资料
    showEdit: false,     // 是否处于编辑模式
    editName: '',
    editPhone: '',
    // 菜单项：每个入口配专属图标（贴合板块语义）
    menus: [
      { icon: '/images/icon-order.png', label: '我的订单', page: '/pages/mine/orders' },
      { icon: '/images/icon-sapling.png', label: '我的认养', page: '/pages/adopt/home' },
      { icon: '/images/icon-tent.png', label: '我的研学', page: '/pages/mine/studies' },
      { icon: '/images/icon-star.png', label: '我的收藏', page: '/pages/mine/favorites' },
      { icon: '/images/icon-clock.png', label: '溯源记录', page: '/pages/mine/trace-history' },
      { icon: '/images/icon-bell.png', label: '消息通知', page: '/pages/mine/messages' },
      { icon: '/images/icon-headset.png', label: '联系客服', page: '/pages/mine/contact' }
    ]
  },

  onShow() {
    // 每次回到本页刷新个人资料（编辑后、以及从其他页返回）
    this.setData({ profile: api.getProfile() })
  },

  // 进入/退出编辑模式
  toggleEdit() {
    this.setData({
      showEdit: !this.data.showEdit,
      editName: this.data.profile.nickname,
      editPhone: this.data.profile.phone
    })
  },

  // 编辑输入
  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  // 保存个人资料（本地存储）
  saveProfile() {
    if (!this.data.editName.trim()) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    api.saveProfile({
      nickname: this.data.editName.trim(),
      phone: this.data.editPhone.trim(),
      avatar: this.data.profile.avatar
    })
    this.setData({
      profile: api.getProfile(),
      showEdit: false
    })
    wx.showToast({ title: '已保存', icon: 'success' })
  },

  // 点菜单项：有页面的跳转，没页面的提示"建设中"
  onMenuTap(e) {
    const page = e.currentTarget.dataset.page
    if (page) {
      wx.navigateTo({ url: page })
    } else {
      wx.showToast({ title: '建设中 · 敬请期待', icon: 'none' })
    }
  },

  // 后台管理入口（学生团队使用）
  goAdmin() {
    wx.navigateTo({ url: '/pages/mine/admin' })
  }
})
