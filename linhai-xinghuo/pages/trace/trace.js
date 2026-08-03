// 溯源页 —— "每一件产品都有它的来处"
// 设计书模块二：扫码溯源 + 溯源档案（五维展示）+ 数字档案防篡改标识 + 分享
// 数据来源：utils/api.js（当前读 mock，第三阶段换云数据库）

const api = require('../../utils/api.js')

Page({
  data: {
    batches: []        // 体验档案列表（演示用，正式版扫码直达）
  },

  onLoad() {
    this.loadBatches()
  },

  // 每次露脸都刷新：批次可能被后台"批次管理"新增/删除（onLoad 只跑一次的教训）
  onShow() {
    this.loadBatches()
  },

  loadBatches() {
    // 向 api 要溯源批次列表（第三阶段起读云数据库，返回 Promise）
    api.getTraceBatches().then(batches => {
      this.setData({ batches: batches })
    })
  },

  /**
   * 扫码溯源：调用微信扫一扫能力
   * 模拟器测试：开发者工具工具栏 → 模拟操作 → 扫一扫（可以模拟任意扫码结果）
   */
  scanCode() {
    wx.scanCode({
      onlyFromCamera: false,     // 允许从相册选二维码
      success: (res) => {
        // res.result 是扫到的内容（真产品包装上印的就是批次号）
        api.getTraceArchive(res.result).then(archive => {
          // 记录扫码历史（"我的→溯源记录"页展示；设计书：扫过的所有产品溯源码历史）
          api.addTraceHistory(archive.batchNo, archive.product)
          wx.navigateTo({
            url: '/pages/trace/archive?batchNo=' + archive.batchNo
          })
        })
      },
      fail: () => {
        wx.showToast({ title: '扫码已取消', icon: 'none' })
      }
    })
  },

  /**
   * 点体验档案列表项 → 进档案页
   * data-batch 是 wxml 里 data-* 传过来的批次号
   */
  goArchive(e) {
    const batchNo = e.currentTarget.dataset.batch
    wx.navigateTo({
      url: '/pages/trace/archive?batchNo=' + batchNo
    })
  },

  // 分享溯源页给好友（设计书：溯源本身就是品牌传播素材）
  onShareAppMessage() {
    return {
      title: '林海星火 · 每一件产品都有它的来处',
      path: '/pages/trace/trace'
    }
  }
})
