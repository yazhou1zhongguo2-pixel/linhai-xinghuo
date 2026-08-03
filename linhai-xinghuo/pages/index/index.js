// 首页 —— "看见这片林子"
// 设计书定位：用户进入小程序的第一触点，建立初始信任，不促成交易（首页不设购买入口）
// 数据来源：utils/api.js（当前读 mock 假数据，第三阶段换成云数据库）

const api = require('../../utils/api.js')
// 引入 ECharts 画图引擎（echarts-for-weixin 官方适配组件，位于 libs/ec-canvas/）
const echarts = require('../../libs/ec-canvas/echarts.js')

// 图表实例（模块级）：数据看板更新后用它刷新折线（v0.2 图表联动云端）
let organicChart = null

/**
 * 生成折线图三条曲线的配置（A/B/C 三样地）
 * 数据来自传入的 plots —— 云端更新后重新调用即可刷新图表
 */
function buildOrganicSeries(plots) {
  return plots.map(p => ({
    name: p.name,
    type: 'line',
    smooth: true,                    // 平滑曲线
    data: p.soilOrganic,             // 三个季度的有机质数值
    lineStyle: { width: 3 },
    symbolSize: 7
  }))
}

/**
 * 折线图初始化函数 —— ec-canvas 组件准备好画布后会自动调用它
 * @param canvas 画布对象（组件提供）
 * @param width  画布宽度(px)
 * @param height 画布高度(px)
 * @param dpr    设备像素比（高清屏画出来才清晰）
 */
function initOrganicChart(canvas, width, height, dpr) {
  // 1. 创建图表实例
  const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr })
  canvas.setChart(chart)
  organicChart = chart

  // 2. 读取样地数据（初始化用 mock 兜底；云数据加载后由 loadHome 刷新）
  const home = require('../../mock/home.js')

  // 3. 配置图表的"长相"（ECharts 的 option 就是一张配置单）
  chart.setOption({
    legend: {                        // 图例（右上角 A/B/C 小色块）
      data: home.plots.map(p => p.name),
      textStyle: { fontSize: 10, color: '#8A847A' },
      top: 4
    },
    grid: { left: 36, right: 16, top: 34, bottom: 24 },   // 图表四边留白
    xAxis: {                         // 横轴：三个季度
      type: 'category',
      data: home.quarters,
      axisLine: { lineStyle: { color: '#E8E2D5' } },
      axisLabel: { fontSize: 10, color: '#8A847A' }
    },
    yAxis: {                         // 纵轴：有机质含量(%)
      type: 'value',
      name: '%',
      nameTextStyle: { fontSize: 10, color: '#8A847A' },
      splitLine: { lineStyle: { color: '#F0EBDF' } },
      axisLabel: { fontSize: 10, color: '#8A847A' }
    },
    series: buildOrganicSeries(home.plots),
    // 三样地配色（设计系统色板：林地绿/麦秆金/大地棕）
    color: ['#3A6B4E', '#C9A96A', '#8B6A4F']
  })
  return chart
}

Page({
  data: {
    // 三个区块的数据，全部由 api 提供
    imagery: {},        // 林地实时影像
    plots: [],          // 生态数据看板（A/B/C 样地）
    stories: [],        // "正在发生"故事流
    // ECharts 组件通过 ec 字段拿到初始化函数（onInit）
    ec: { onInit: initOrganicChart }
  },

  // 页面第一次创建时加载数据
  onLoad() {
    this.loadHome()
  },

  // 页面每次"露脸"都执行（含从其他页切回来）：
  // 故事流可能被后台"发布故事"更新、收藏状态可能被"我的收藏"改过——
  // 一律重新拉数据，不能等用户杀进程重进（onLoad 只在页面第一次创建时跑一次）
  onShow() {
    this.loadHome()
  },

  // 统一的数据加载函数：onLoad 和 onShow 都调它
  loadHome() {
    api.getHomeData().then(home => {
      // 预处理：给每个样地算出"条形图宽度"和"有机质变化量"，供界面直接使用
      const maxOrganic = Math.max(...home.plots.map(p => p.soilOrganic[p.soilOrganic.length - 1]))
      const plots = home.plots.map(p => {
        const latest = p.soilOrganic[p.soilOrganic.length - 1]
        const prev = p.soilOrganic[p.soilOrganic.length - 2]
        return {
          ...p,
          organicLatest: latest,
          organicDelta: (latest - prev).toFixed(1),   // 较上季度变化
          barPercent: Math.round(latest / maxOrganic * 100)  // 条形宽度百分比
        }
      })
      this.setData({
        imagery: home.imagery,
        plots: plots,
        stories: home.stories
      })
      // v0.2：图表联动云端——云端 plots 变化后折线图同步刷新
      if (organicChart) {
        organicChart.setOption({
          legend: { data: home.plots.map(p => p.name) },
          series: buildOrganicSeries(home.plots)
        })
      }
      // 从云数据库拉"我的收藏"，把已收藏的故事点亮（真实联动）
      this.syncCollected()
    })
  },

  // 同步收藏点亮状态：读云数据库 user_favorites，更新故事列表的 collected 标记
  syncCollected() {
    api.getMyFavorites().then(favs => {
      const favIds = favs.map(f => f.storyId)
      const stories = this.data.stories.map(s => ({
        ...s,
        collected: favIds.indexOf(s.id) >= 0
      }))
      this.setData({ stories: stories })
    })
  },

  // 点赞 / 取消点赞（点击故事卡片上的"点赞"按钮触发）
  // e.currentTarget.dataset.id 是 wxml 里 data-id 传过来的故事编号
  toggleLike(e) {
    const id = e.currentTarget.dataset.id
    const story = this.data.stories.find(s => s.id === id)
    // 调用 api 更新状态（影子版：仅界面反馈；正式版第四阶段写云数据库）
    api.likeStory(story, !story.liked)
    // setData：把新数据"喊"给界面，界面自动更新（镜子里的人，你笑他就笑）
    this.setData({ stories: this.data.stories })
  },

  // 收藏 / 取消收藏 —— 第四阶段起真实写云数据库（user_favorites 集合）
  toggleCollect(e) {
    const id = e.currentTarget.dataset.id
    const story = this.data.stories.find(s => s.id === id)
    const isCollect = !story.collected
    api.toggleFavorite(story, isCollect).then(() => {
      // 云写入成功 → 更新界面状态 + 轻提示
      api.collectStory(story, isCollect)
      this.setData({ stories: this.data.stories })
      wx.showToast({ title: isCollect ? '已收藏' : '已取消收藏', icon: 'none' })
    }).catch(() => {
      wx.showToast({ title: '收藏失败，请重试', icon: 'none' })
    })
  }
})
