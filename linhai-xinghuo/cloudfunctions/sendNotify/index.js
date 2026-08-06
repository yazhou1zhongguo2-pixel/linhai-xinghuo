/**
 * 云函数 sendNotify —— 订阅消息推送（微信服务通知）
 *
 * 前置：mp 后台开通"订阅消息"并选用模板（个人主体可用），把 templateId 配到前端 utils/api.js
 *
 * 入参 event: {
 *   templateId:  订阅消息模板 ID
 *   page:        点击通知跳转的页面路径（如 pages/mine/studies）
 *   data:        模板字段映射（字段名以申请到的模板为准，如 { thing1: '...', date2: '...' }）
 * }
 * 返回: { success } 或 { success:false, reason }
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { success: false, reason: '无法获取用户身份' }
  if (!event.templateId) return { success: false, reason: '模板未配置' }

  try {
    await cloud.openapi.subscribeMessage.send({
      touser: OPENID,
      templateId: event.templateId,
      page: event.page || 'pages/index/index',
      data: event.data || {},
      // 开发/体验版用 developer/trial 可收；正式发布后改为 formal
      miniprogramState: event.miniprogramState || 'developer'
    })
    return { success: true }
  } catch (e) {
    console.error('[sendNotify] 推送失败:', e)
    return { success: false, reason: '推送失败（用户未订阅或模板字段不匹配）' }
  }
}
