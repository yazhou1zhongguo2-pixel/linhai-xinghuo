/**
 * mock/home.js —— 首页聚合数据
 * 首页一次性取回全部内容：林地影像 + 生态数据 + 故事流
 * （组合了 plots.js 和 stories.js 两个"仓库"）
 */
const plots = require('./plots.js')
const stories = require('./stories.js')

module.exports = {
  // 林地实时影像：无人机全景图，每季度更新一次
  imagery: {
    url: '/images/hero-forest.png',   // 本地占位图（第二阶段换真影像）
    date: '2026年7月',
    plot: '轮作区A · 无人机全景',
    note: '影像每季度更新 · 拍摄于 2026-07-10'
  },
  // 生态数据看板：A/B/C 三样地
  plots: [plots.A, plots.B, plots.C],
  // 三个季度的标签（有机质趋势折线图的横轴）
  quarters: ['2025年Q4', '2026年Q1', '2026年Q2'],
  // "正在发生"故事流
  stories: stories
}
