// app.js —— 整栋楼的"总电闸+物业办公室"

App({
  // onLaunch：小程序启动时自动调用
  onLaunch() {
    // 初始化云开发（设计书技术路线：腾讯云 数据库+存储+云函数 一体化）
    // env 是本项目的云环境 ID（云开发控制台可查）
    wx.cloud.init({
      env: 'cloud1-d3gzrqak99db1f79c',
      traceUser: true   // 记录访问用户，方便日后统计
    })
  },

  // globalData：全楼共享的"公告栏"，任何页面都能读
  globalData: {
    userInfo: null,
    openid: null,
    currentArchive: null   // 溯源档案页的图表要读当前档案，先暂存这里
  }
})
