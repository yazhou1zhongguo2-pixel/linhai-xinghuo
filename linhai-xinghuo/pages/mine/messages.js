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
          // ⚠️ 必须透传删除所需字段：云端 _id / 缓存标记（否则删除按钮拿到空 ID）
          _id: o._id,
          fromCache: o.fromCache,
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
  },

  // 删除消息：云端订单 → 删云端；本地缓存条目 → 移除缓存（演示消息不可删）
  removeMessage(e) {
    const docId = e.currentTarget.dataset.id
    const orderId = e.currentTarget.dataset.orderid
    const kind = e.currentTarget.dataset.kind
    const fromCache = e.currentTarget.dataset.fromcache === 'true'
    const collection = kind === '订单' ? 'study_bookings' : 'adoptions'
    const hint = fromCache ? '这条是本地缓存订单，删除后缓存同步移除，确定？' : '删除后对应的订单记录也会同步删除，确定？'
    wx.showModal({
      title: '删除消息',
      content: hint,
      confirmColor: '#C0392B',
      success: (res) => {
        if (!res.confirm) return
        // 研学订单删除走云函数（释放名额）；认养走普通删除；缓存条目走缓存移除
        const action = fromCache
          ? api.removeCachedOrder(orderId)
          : (collection === 'study_bookings'
              ? api.releaseBooking(docId)
              : api.deleteMyRecord(collection, docId))
        action.then(result => {
          wx.showToast({ title: result.success ? '已删除' : (result.reason || '删除失败'), icon: 'none' })
          if (result.success) this.loadMessages()
        })
      }
    })
  }
})
