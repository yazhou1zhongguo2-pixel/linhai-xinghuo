// 消息通知页 —— 设计书模块五：系统推送、生长报告、订单状态
// 真实消息从云订单生成（报名成功/认养成功），演示消息标注来源
// 正式版：订阅消息（wx.requestSubscribeMessage）+ 云函数推送

const api = require('../../utils/api.js')

Page({
  data: {
    messages: []
  },

  onShow() {
    this.loadMessages()
  },

  loadMessages() {
    // 从订单生成真实消息
    api.getMyOrders().then(orders => {
      const messages = orders.map(o => {
        const isStudy = o.type === '研学'
        return {
          id: o.orderId,
          kind: isStudy ? '订单' : '认养',
          title: isStudy ? '研学报名成功' : '认养成功',
          content: '「' + o.name + '」' + (isStudy ? '已报名' : '已生效') + '，可在"我的订单"查看详情。',
          time: o.time,
          demo: false
        }
      })
      // 演示系统消息（设计书：生长报告推送、续约提醒的占位）
      const demoMessages = [
        {
          id: 'demo-1',
          kind: '生长报告',
          title: '木耳菌棒认养 · 第二季度生长报告已更新',
          content: '头茬木耳已采收入库，点"我的认养"查看图文报告。',
          time: '2026-07-02 10:00',
          demo: true
        },
        {
          id: 'demo-2',
          kind: '系统',
          title: '欢迎来到林海星火',
          content: '先感受这片林子的真实，再决定要不要带走它的一部分。',
          time: '2026-06-01 09:00',
          demo: true
        }
      ]
      // 合并排序：按时间倒序（没有时间的排最后）
      const all = messages.concat(demoMessages)
      all.sort((a, b) => ((a.time || 0) < (b.time || 0) ? 1 : -1))
      this.setData({ messages: all })
    })
  },

  // 点订单消息 → 我的订单；点其他 → 我的认养
  goDetail(e) {
    const kind = e.currentTarget.dataset.kind
    if (kind === '订单') {
      wx.navigateTo({ url: '/pages/mine/orders' })
    } else if (kind === '认养' || kind === '生长报告') {
      wx.navigateTo({ url: '/pages/adopt/home' })
    }
  }
})
