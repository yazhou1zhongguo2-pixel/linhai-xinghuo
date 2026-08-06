/**
 * 云函数 bookStudy —— 研学报名（名额原子校验 + 下单）
 * 答辩金句：云函数 + 数据库事务（快照隔离）保证名额不超卖
 *
 * 入参 event: {
 *   productId:   产品 id（study_products 文档 _id）
 *   date:        预约日期（如 2026-08-15）
 *   count:       报名人数
 *   participants:{ name, age, phone }
 * }
 * 返回: { success, orderId, amount, remaining } 或 { success:false, reason }
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database({ throwOnNotFound: false })

// 业务错误标记（与系统错误区分：业务错误不需要重试/告警）
function bizError(reason) {
  const e = new Error(reason)
  e.biz = true
  return e
}

exports.main = async (event) => {
  const { productId, date, count, participants } = event
  try {
    // 事务内：读产品 → 校验名额 → 原子递增 booked
    // 快照隔离保证并发报名不会同时通过校验（防超卖）
    let meta = null
    const txResult = await db.runTransaction(async transaction => {
      const prodRes = await transaction.collection('study_products').doc(productId).get()
      const prod = prodRes.data
      if (!prod) throw bizError('产品不存在')
      meta = { name: prod.name, price: prod.price }

      const slot = (prod.dates || []).find(d => d.date === date)
      if (!slot) throw bizError('该日期不可预约')

      const remaining = prod.capacity - slot.booked
      if (remaining < count) {
        throw bizError(remaining <= 0 ? '该日期名额已满' : '剩余名额不足')
      }

      // 原子更新该日期的已报名数
      const newDates = (prod.dates || []).map(d =>
        d.date === date ? { ...d, booked: d.booked + count } : d
      )
      await transaction.collection('study_products').doc(productId)
        .update({ data: { dates: newDates } })

      return { remaining: remaining - count }
    })

    // 事务提交成功后写订单（订单写入失败不阻塞名额已扣，属可接受窗口）
    // ⚠️ 云函数 add 不会自动带 _openid（客户端才会）——必须显式写入归属，
    //    否则订单"无主"，用户在客户端删不掉（仅创建者可读写权限）
    const { OPENID } = cloud.getWXContext()
    const orderId = 'ST' + Date.now() + Math.floor(Math.random() * 1000)
    const amount = meta.price * count
    await db.collection('study_bookings').add({
      data: {
        _openid: OPENID,
        orderId,
        type: 'study',
        productId,
        productName: meta.name,
        date,
        count,
        participants: participants || {},
        amount,
        status: '已报名',
        createdAt: db.serverDate()
      }
    })

    return { success: true, orderId, amount, remaining: txResult.remaining }
  } catch (e) {
    if (e.biz) return { success: false, reason: e.message }
    console.error('[bookStudy] 系统错误:', e)
    return { success: false, reason: '系统繁忙，请稍后重试' }
  }
}
