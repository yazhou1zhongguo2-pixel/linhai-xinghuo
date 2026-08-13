/**
 * 云函数 getOpenid —— 返回当前用户 openid
 * 用途：账号隔离——用户端查询"所有用户可读"集合时，用真实 openid 过滤自己的数据
 * ⚠️ 不用 {openid} 占位符（本环境历史疑点：曾出现全部返回空的现象），真实 openid 无歧义
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async () => {
  const { OPENID, APPID, UNIONID } = cloud.getWXContext()
  return { openid: OPENID || '', appid: APPID || '', unionid: UNIONID || '' }
}
