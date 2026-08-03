// 溯源二维码生成与批次绑定（后台-管理员端，设计书模块八）
// 影子版：批次列表读云 + 演示生成流程说明
// 正式版：云函数调 wxacode.getUnlimited 生成小程序码，扫码直达批次档案页

const api = require('../../utils/api.js')

Page({
  data: {
    batches: []
  },

  onShow() {
    api.getTraceBatches().then(batches => {
      this.setData({ batches: batches })
    })
  },

  // 生成溯源码（影子版：说明正式流程 + 展示码的目标内容）
  generate(e) {
    const batchNo = e.currentTarget.dataset.batch
    const product = e.currentTarget.dataset.product
    wx.showModal({
      title: '生成溯源码（演示）',
      content: '正式版流程：云函数调用 wxacode.getUnlimited 生成小程序码，印在产品包装上，用户扫码直达批次档案「' + batchNo + '」。当前演示版不生成真实二维码图片。',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#3A6B4E',
      success: () => {
        // 演示"码绑定成功"的反馈
        wx.showToast({ title: '已生成演示码：' + product, icon: 'none' })
      }
    })
  }
})
