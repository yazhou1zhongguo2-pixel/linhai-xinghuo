// 溯源档案页 —— 五维展示（设计书模块二）
// 维度：产地信息 / 生长记录 / 环境数据 / 采收信息 / 检测报告
// 防篡改标识：档案编号 + 时间戳（显示在档案头）
// 数据来源：utils/api.js 按批次号查档案

const api = require('../../utils/api.js')
const echarts = require('../../libs/ec-canvas/echarts.js')

// 环境图表的实例（模块级变量）——tab 切换回来时用 resize() 兜底重排
// 教训：图表在隐藏容器里初始化会拿到 0 尺寸，必须等容器可见再挂载
let envChart = null

/**
 * 环境数据折线图（双轴：左=土温℃ 右=湿度%）
 * 数据从全局公告栏取（onLoad 里先把档案存进 globalData）
 */
function initEnvChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr })
  canvas.setChart(chart)
  envChart = chart
  const archive = getApp().globalData.currentArchive
  const env = archive.env
  chart.setOption({
    legend: {
      data: ['土壤温度', '空气湿度'],
      textStyle: { fontSize: 10, color: '#8A847A' },
      top: 4
    },
    grid: { left: 40, right: 40, top: 34, bottom: 24 },
    xAxis: {
      type: 'category',
      data: env.months,
      axisLine: { lineStyle: { color: '#E8E2D5' } },
      axisLabel: { fontSize: 10, color: '#8A847A' }
    },
    // 双纵轴：leftIndex 0 表示走左边轴，1 表示走右边轴
    yAxis: [
      { type: 'value', name: '℃', nameTextStyle: { fontSize: 10, color: '#8A847A' },
        splitLine: { lineStyle: { color: '#F0EBDF' } }, axisLabel: { fontSize: 10, color: '#8A847A' } },
      { type: 'value', name: '%', nameTextStyle: { fontSize: 10, color: '#8A847A' },
        splitLine: { show: false }, axisLabel: { fontSize: 10, color: '#8A847A' } }
    ],
    series: [
      { name: '土壤温度', type: 'line', smooth: true, yAxisIndex: 0, data: env.soilTemp,
        lineStyle: { width: 3 }, symbolSize: 6 },
      { name: '空气湿度', type: 'line', smooth: true, yAxisIndex: 1, data: env.humidity,
        lineStyle: { width: 3 }, symbolSize: 6 }
    ],
    color: ['#3A6B4E', '#C9A96A']
  })
  return chart
}

Page({
  data: {
    archive: {},        // 当前档案（五维数据都在里面）
    activeTab: 0,       // 当前选中的维度 tab
    showEnvChart: false, // 环境图表是否挂载（首次切到该 tab 才挂载，保证画布尺寸正确）
    ec: { onInit: initEnvChart }   // 环境图表初始化函数
  },

  onLoad(options) {
    // options.batchNo 是上个页面跳转时 ?batchNo= 传过来的参数
    // 第三阶段起读云数据库，返回 Promise
    api.getTraceArchive(options.batchNo).then(archive => {
      // 存进全局公告栏，图表初始化函数能拿到数据
      getApp().globalData.currentArchive = archive
      this.setData({ archive: archive })
    })
  },

  // tab 切换时触发（环境数据 = 第 3 个 tab，索引 2）
  onTabChange(e) {
    this.setData({ activeTab: e.detail.index })
    if (e.detail.index === 2) {
      // 首次切到"环境数据"tab：延迟一点再挂载图表（等 tab 内容已显示，画布尺寸才正确）
      if (!this.data.showEnvChart) {
        setTimeout(() => this.setData({ showEnvChart: true }), 100)
      }
      // 兜底：若图表已存在（切走又切回），resize 重排一次
      setTimeout(() => {
        if (envChart) envChart.resize()
      }, 300)
    }
  },

  // 下载检测报告 PDF（v0.2：报告有 pdfUrl 时从云存储下载并打开）
  downloadPdf() {
    const pdfUrl = this.data.archive.report && this.data.archive.report.pdfUrl
    if (!pdfUrl) {
      wx.showToast({ title: '该批次暂无 PDF 报告', icon: 'none' })
      return
    }
    wx.showLoading({ title: '下载中…' })
    this.downloadAndOpen(pdfUrl)
  },

  // 下载并打开（两条路线：fileID 直下 → 失败换临时链接下载，双保险）
  downloadAndOpen(fileID) {
    // 路线一：fileID 直接下载（云开发标准方式）
    wx.cloud.downloadFile({ fileID }).then(res => {
      wx.hideLoading()
      wx.openDocument({ filePath: res.tempFilePath, showMenu: true })
    }).catch(err => {
      // 路线一失败：打印详细信息（fileID 直下失败常见于文件不存在/权限）
      console.warn('[下载] 路线一(fileID直下)失败:', err)
      // 路线二：先把 fileID 换成临时下载链接，再下载（兼容 fileID 解析异常的情况）
      wx.cloud.getTempFileURL({ fileList: [fileID] }).then(r => {
        // 打印完整返回（fileList[0] 里有 status/errMsg，能区分"文件不存在"还是"无权限"）
        console.log('[下载] getTempFileURL 返回:', JSON.stringify(r.fileList))
        const item = r.fileList && r.fileList[0]
        const url = item && item.tempFileURL
        if (!url) {
          const reason = item && item.status ? ('错误码 ' + item.status + (item.errMsg ? '：' + item.errMsg : '')) : '临时链接为空'
          throw new Error('获取下载链接失败：' + reason)
        }
        return wx.downloadFile({ url })
      }).then(r => {
        wx.hideLoading()
        wx.openDocument({ filePath: r.tempFilePath, showMenu: true })
      }).catch(err2 => {
        wx.hideLoading()
        console.error('[下载] PDF 失败:', err2)
        wx.showToast({ title: '下载失败，请检查云端文件', icon: 'none' })
      })
    })
  },

  // 查看样地位置：微信内置地图（wx.openLocation，无需申请地图 key）
  // 坐标按设计书脱敏至林班层级
  openLocation() {
    // 兜底坐标：云端旧记录可能没有 gpsCoords 字段（如旧种子数据），
    // 用样地中心演示坐标兜底——地图必须永远打得开，不因数据缺字段而失效
    const DEFAULT_COORDS = { latitude: 43.75, longitude: 128.20 }
    const c = this.data.archive.origin.gpsCoords || DEFAULT_COORDS
    wx.openLocation({
      latitude: c.latitude,
      longitude: c.longitude,
      name: this.data.archive.origin.plotId,
      address: this.data.archive.origin.ecoZone,
      scale: 14
    })
  },

  // 分享这份溯源档案（设计书：溯源本身就是品牌传播素材）
  onShareAppMessage() {
    const a = this.data.archive
    return {
      title: a.product + ' · 可溯源档案',
      path: '/pages/trace/archive?batchNo=' + a.batchNo
    }
  }
})
