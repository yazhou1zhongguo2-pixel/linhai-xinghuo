/**
 * 云函数 releaseSeats —— 删除研学订单并释放名额（v0.4 补充）
 * 数据闭环：删除订单 → booked 回退（下限 0）→ 删除订单文档
 * 与 bookStudy 对称：报名扣名额、删单还名额
 *
 * 入参 event: { docId: study_bookings 文档 _id }
 * 返回: { success, released, reason? }
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database({ throwOnNotFound: false })

exports.main = async (event) => {
  const { docId } = event
  try {
    const booking = (await db.collection('study_bookings').doc(docId).get()).data
    if (!booking) return { success: false, reason: '订单不存在' }

    // 1. 释放名额（该产品该日期 booked 回退，下限 0）
    const prod = (await db.collection('study_products').doc(booking.productId).get()).data
    let released = 0
    if (prod && prod.dates) {
      const count = booking.count || 1
      const dates = prod.dates.map(d =>
        d.date === booking.date
          ? { ...d, booked: Math.max(0, d.booked - count) }
          : d
      )
      await db.collection('study_products').doc(booking.productId)
        .update({ data: { dates } })
      released = count
    }

    // 2. 删除订单
    await db.collection('study_bookings').doc(docId).remove()

    return { success: true, released }
  } catch (e) {
    console.error('[releaseSeats] 错误:', e)
    return { success: false, reason: '释放失败：' + (e.message || '未知错误') }
  }
}
