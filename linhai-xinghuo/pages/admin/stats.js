// 互动统计（后台-管理员端，Day3）
// 每故事的点赞/收藏总数 = 云数据库真实聚合（客户端 count），数据闭环不再只躺控制台

const api = require('../../utils/api.js')

Page({
  data: {
    stats: [],
    loading: true
  },

  onShow() {
    this.loadStats()
  },

  loadStats() {
    this.setData({ loading: true })
    api.getStoryStats().then(stats => {
      this.setData({ stats, loading: false })
    })
  },

  // 按点赞数排序
  sortByLikes() {
    const stats = [...this.data.stats].sort((a, b) => b.likeCount - a.likeCount)
    this.setData({ stats })
  }
})
