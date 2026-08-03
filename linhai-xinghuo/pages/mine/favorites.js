// 我的收藏页 —— 第四阶段：真实读云数据库 user_favorites
// 首页点收藏 → 云数据库 → 这里显示（用户叮嘱的联动，已打通）

const api = require('../../utils/api.js')

Page({
  data: {
    favorites: []     // 收藏列表（云端快照）
  },

  onShow() {
    // onShow 而非 onLoad：每次进入本页都重新拉取，取消收藏后回来立即生效
    this.loadFavorites()
  },

  loadFavorites() {
    api.getMyFavorites().then(favorites => {
      this.setData({ favorites: favorites })
    })
  },

  // 取消收藏（写云删除）→ 刷新列表
  removeFavorite(e) {
    const storyId = e.currentTarget.dataset.id
    const fav = this.data.favorites.find(f => f.storyId === storyId)
    if (!fav) return
    wx.showModal({
      title: '取消收藏',
      content: '确定取消收藏这条内容吗？',
      confirmColor: '#3A6B4E',
      success: (res) => {
        if (!res.confirm) return
        api.toggleFavorite(fav, false).then(() => {
          wx.showToast({ title: '已取消收藏', icon: 'none' })
          this.loadFavorites()
        })
      }
    })
  },

  // 空状态时引导去首页看看
  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
