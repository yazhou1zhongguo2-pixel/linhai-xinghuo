/**
 * 云函数 aggregateToArchive —— 后台数据自动汇聚到溯源档案
 * 设计书模块七："采收现场建档 → 自动生成该批次溯源档案的原始数据"
 *
 * 入参 event: { type: 'harvest' | 'phenology', recordId: 记录文档 _id }
 *
 * harvest:   采收建档 → 更新批次 harvest 字段 + growth 追加"采收期"
 * phenology: 物候观测 → 按地块匹配批次 → growth 追加该物候事件
 *
 * 云函数权限红利：绕过客户端权限，可更新无主（控制台导入）的种子批次文档
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database({ throwOnNotFound: false })

// 云端 Date 转 yyyy-mm-dd
function toDateStr(t) {
  if (!t) return ''
  const d = new Date(t)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

exports.main = async (event) => {
  const { type, recordId } = event
  try {
    if (type === 'harvest') {
      const rec = (await db.collection('harvest_records').doc(recordId).get()).data
      if (!rec) return { success: false, reason: '采收记录不存在' }
      if (!rec.batchNo) return { success: false, reason: '该记录未绑定批次' }

      // 按批次号找批次（可命中无主种子文档）
      const batchRes = await db.collection('trace_batches').where({ batchNo: rec.batchNo }).get()
      const batch = batchRes.data[0]
      if (!batch) return { success: false, reason: '批次不存在：' + rec.batchNo }

      const date = toDateStr(rec.createdAt)
      const photo = rec.photoFileID || ''
      const harvest = {
        date: date,
        worker: rec.worker || '',
        photo: photo,
        note: rec.note || ''
      }
      const growth = (batch.growth || []).concat([{
        stage: '采收期',
        date: date,
        photo: photo,
        note: rec.note || '采收现场建档'
      }])

      await db.collection('trace_batches').doc(batch._id)
        .update({ data: { harvest: harvest, growth: growth } })
      return { success: true, batchNo: rec.batchNo }
    }

    if (type === 'phenology') {
      const rec = (await db.collection('phenology_records').doc(recordId).get()).data
      if (!rec) return { success: false, reason: '物候记录不存在' }
      if (!rec.plot) return { success: false, reason: '该记录未选择地块' }

      // 按地块名包含匹配批次（轮作区A → 轮作区A-03号地块）
      const batchRes = await db.collection('trace_batches')
        .where({ 'origin.plotId': db.RegExp({ regexp: rec.plot, options: 'i' }) })
        .get()
      if (!batchRes.data.length) return { success: false, reason: '未匹配到该地块的批次' }

      const date = toDateStr(rec.createdAt)
      const entry = {
        stage: rec.event || '物候观测',
        date: date,
        photo: rec.photoFileID || '',
        note: rec.note || ''
      }
      // 匹配到的批次逐个追加（一个地块可能有多个批次）
      for (const batch of batchRes.data) {
        const growth = (batch.growth || []).concat([entry])
        await db.collection('trace_batches').doc(batch._id).update({ data: { growth } })
      }
      return { success: true, matched: batchRes.data.length }
    }

    return { success: false, reason: '未知类型: ' + type }
  } catch (e) {
    console.error('[aggregateToArchive] 错误:', e)
    return { success: false, reason: '汇聚失败：' + (e.message || '未知错误') }
  }
}
