/**
 * utils/api.js —— ★数据访问层（全项目最重要的架构文件）
 *
 * 规则：所有页面要数据，只能找它要（"前台和仓库之间的唯一传送带"）
 *
 * 第三阶段升级：读云数据库（换引擎完成！页面代码零改动）
 * 策略：云端优先，云端不可用时回退本地 mock（离线演示不白屏）
 * 控制台可看到数据来源日志：console.log('[数据源]', ...)
 */

// mock 数据：仅作为"云端不可用"时的回退（离线演示）
const homeData = require('../mock/home.js')
const traceData = require('../mock/trace.js')
const studyData = require('../mock/study.js')
const adoptData = require('../mock/adopt.js')

/**
 * ===== 本地存储（状态层级②）：影子版数据的"记忆" =====
 * 页面内存（层级①）关掉就丢；本地存储在本机保留，换手机/清缓存会丢
 * 云数据库是层级③（永久+跨设备），见下方收藏/订单等函数
 */
const ADOPTIONS_KEY = 'my_adoptions'
const PROFILE_KEY = 'my_profile'          // 个人资料（头像/昵称/联系方式）
const TRACE_HISTORY_KEY = 'trace_history' // 溯源扫码记录
const ORDERS_CACHE_KEY = 'orders_cache'   // 订单本地兜底缓存（云写入失败时保证不丢单）

/** 读订单本地缓存 */
function readOrdersCache() {
  return wx.getStorageSync(ORDERS_CACHE_KEY) || []
}

/** 写订单本地缓存（最新在前，最多留 50 条） */
function writeOrdersCache(list) {
  wx.setStorageSync(ORDERS_CACHE_KEY, list.slice(0, 50))
}

/** 读"我的认养"：优先本地存储；首次使用把 mock 数据写入存储作为起点 */
function readAdoptionsFromStorage() {
  const cached = wx.getStorageSync(ADOPTIONS_KEY)
  if (cached && cached.length) return cached
  wx.setStorageSync(ADOPTIONS_KEY, adoptData.myAdoptions)
  return adoptData.myAdoptions
}

/**
 * 数据兜底默认值 —— 脏数据防御
 * 真实数据（人工录入/后台发布）经常缺字段，缺啥补啥，界面才不会显示异常
 */
const STORY_DEFAULTS = {
  type: '林间记事',                  // 故事类型缺省
  icon: '/images/icon-seedling.png', // 配图缺省
  time: '时间待补充',
  likes: 0,                          // 点赞数缺省（否则 +1 变 NaN）
  liked: false,
  collected: false
}

// 云数据库句柄（懒初始化：第一次用到时才创建）
let db = null
function getDb() {
  if (!db) db = wx.cloud.database()
  return db
}

/** 读取集合全部文档（小程序端单次最多 20 条，我们当前数据量足够） */
function fetchAll(collectionName) {
  return getDb().collection(collectionName).get().then(res => res.data)
}

module.exports = {
  /**
   * 获取首页数据（影像 + 生态看板 + 故事流）
   * 云数据库：plots 集合（3 条样地记录）+ stories 集合（故事流）
   * 影像配置（imagery/quarters）暂留本地 —— 图片尚未上云，属配置而非数据
   */
  getHomeData() {
    // v0.2：影像也读云（imagery 集合，无记录回退 mock）——内容管理更新影像后首页立现
    return Promise.all([fetchAll('plots'), fetchAll('stories'), this.getImagery()])
      .then(([plots, stories, imagery]) => {
        // 故事按时间倒序（最新的在最上面；没时间的排最后）
        stories.sort((a, b) => (a.time < b.time ? 1 : -1))
        // 脏数据兜底：每条故事缺啥字段补啥（如点赞数、配图、类型）
        stories = stories.map((s, i) => {
          const normalized = { ...STORY_DEFAULTS, ...s }
          // ⚠️ 编号兜底：无 id 的故事（控制台手写/后台发布的记录）必须给唯一编号。
          //    undefined 进查询条件会匹配全部数据（收藏误删事故的根源）。
          //    唯一编号用云数据库的 _id（每条记录独一无二）——
          //    教训：标题会被重复（"test2" 两次），绝不能拿标题当唯一标识！
          if (normalized.id === undefined) {
            normalized.id = s._id || ('story-' + i)
          }
          return normalized
        })
        console.log('[数据源] 云数据库')
        return {
          imagery: imagery,
          quarters: homeData.quarters,
          plots: plots,
          stories: stories
        }
      })
      .catch(err => {
        console.warn('[数据源] 云数据库读取失败，回退 mock:', err)
        return homeData
      })
  },

  /**
   * 点赞/取消点赞（影子版：只改本地界面状态）
   * 点赞记录正式版应写入云数据库用户记录（第四阶段做），这里先做界面反馈
   */
  likeStory(story, isLike) {
    if (isLike) {
      story.liked = true
      story.likes += 1
    } else {
      story.liked = false
      story.likes -= 1
    }
    return story
  },

  /**
   * 收藏/取消收藏（影子版：同上，仅本地界面状态）
   */
  collectStory(story, isCollect) {
    story.collected = isCollect
    return story
  },

  /**
   * 获取全部溯源批次（溯源页"体验档案"列表）
   * 云数据库：trace_batches 集合
   */
  getTraceBatches() {
    return fetchAll('trace_batches')
      .then(batches => {
        console.log('[数据源] 云数据库')
        return batches
      })
      .catch(err => {
        console.warn('[数据源] 云数据库读取失败，回退 mock:', err)
        return traceData.batches
      })
  },

  /**
   * 按批次号查溯源档案（扫码结果通常是批次号）
   * 云数据库：where 条件查询；查不到返回第一份（演示友好）
   */
  getTraceArchive(batchNo) {
    return getDb().collection('trace_batches')
      .where({ batchNo: batchNo })
      .get()
      .then(res => {
        console.log('[数据源] 云数据库')
        return res.data[0] || null
      })
      .then(archive => archive || traceData.batches[0])
      .catch(err => {
        console.warn('[数据源] 云数据库读取失败，回退 mock:', err)
        return traceData.batches.find(b => b.batchNo === batchNo) || traceData.batches[0]
      })
  },

  /**
   * 获取研学产品列表（3 类课程）
   * 当前读 mock；第四阶段迁到云数据库 study_products 集合
   */
  getStudyProducts() {
    return Promise.resolve(studyData.products)
  },

  /**
   * 获取单个研学产品详情
   */
  getStudyDetail(id) {
    return Promise.resolve(studyData.products.find(p => p.id === id))
  },

  /**
   * 计算某产品某日期的剩余名额（名额管控：设计书规定每团 ≤20 人）
   * @returns 剩余名额数（<=0 表示已满，报名通道关闭）
   */
  getRemaining(product, dateStr) {
    const slot = (product.dates || []).find(d => d.date === dateStr)
    if (!slot) return 0
    return product.capacity - slot.booked
  },

  /**
   * 提交研学报名（影子支付 + 真实写云数据库 study_bookings 集合）
   * 名额校验仍为本地模拟；正式版改为云函数原子校验 + 真实微信支付
   */
  submitBooking(booking) {
    const product = studyData.products.find(p => p.id === booking.productId)
    if (!product) return Promise.resolve({ success: false, reason: '产品不存在' })
    const remaining = this.getRemaining(product, booking.date)
    if (remaining <= 0) {
      return Promise.resolve({ success: false, reason: '该日期名额已满' })
    }
    if (booking.count > remaining) {
      return Promise.resolve({ success: false, reason: '剩余名额不足' })
    }
    const orderId = 'ST' + Date.now() + Math.floor(Math.random() * 1000)
    const amount = product.price * booking.count
    // 订单先写本地缓存兜底（云写入失败也不丢单，"我的订单"仍能看到）
    writeOrdersCache([{
      orderId: orderId,
      type: '研学',
      name: product.name,
      detail: booking.date + ' · ' + booking.count + '人',
      amount: amount,
      status: '已报名',
      time: new Date()
    }].concat(readOrdersCache()))
    // 真实写云；失败必须"看得见"：红色报错 + 弹窗提示（不再静默放过）
    return getDb().collection('study_bookings').add({
      data: {
        orderId: orderId,
        type: 'study',                       // 订单类型：研学
        productId: product.id,
        productName: product.name,
        date: booking.date,
        count: booking.count,
        participants: booking.participants,
        amount: amount,
        status: '已报名',                    // 管理员可改为 已取消/已完成
        createdAt: new Date()
      }
    }).then(() => ({ success: true, orderId, amount }))
      .catch(err => {
        console.error('[写云] study_bookings 写入失败（订单已存本地兜底）:', err)
        wx.showToast({ title: '云端写入失败，订单已存本地', icon: 'none' })
        return { success: true, orderId, amount }
      })
  },

  /**
   * 获取云认养计划列表（3 档）
   * 当前读 mock；第四阶段迁到云数据库 adopt_plans 集合
   */
  getAdoptPlans() {
    return Promise.resolve(adoptData.plans)
  },

  /**
   * 获取单个认养计划详情
   */
  getAdoptDetail(id) {
    return Promise.resolve(adoptData.plans.find(p => p.id === id))
  },

  /**
   * 提交云认养（影子支付 + 真实写云数据库 adoptions 集合）
   */
  submitAdoption(planId) {
    const plan = adoptData.plans.find(p => p.id === planId)
    if (!plan) return Promise.resolve({ success: false, reason: '计划不存在' })
    const adoptionId = 'AD-' + Date.now() + Math.floor(Math.random() * 100)
    // 认养期 1 年（影子：从现在起 +365 天）
    const expireAt = new Date(Date.now() + 365 * 24 * 3600 * 1000)
    // 本地缓存兜底（同订单：云失败不丢记录）
    writeOrdersCache([{
      orderId: adoptionId,
      type: '认养',
      name: plan.name,
      detail: '认养 ' + plan.price + ' 元',
      amount: plan.price,
      status: '认养中',
      time: new Date()
    }].concat(readOrdersCache()))
    return getDb().collection('adoptions').add({
      data: {
        adoptionId: adoptionId,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        status: '认养中',
        createdAt: new Date(),
        expireAt: expireAt
      }
    }).then(() => ({ success: true, adoptionId, amount: plan.price }))
      .catch(err => {
        console.error('[写云] adoptions 写入失败（订单已存本地兜底）:', err)
        wx.showToast({ title: '云端写入失败，订单已存本地', icon: 'none' })
        return { success: true, adoptionId, amount: plan.price }
      })
  },

  /**
   * 获取"我的认养"列表（专属认养主页）
   * 云端优先（真实认养记录）；云端为空时回退演示数据（本地存储）
   */
  getMyAdoptions() {
    return getDb().collection('adoptions').get()
      .then(res => {
        if (!res.data.length) return readAdoptionsFromStorage()   // 空 → 演示数据
        // 云记录转成主页需要的字段形态
        return res.data.map(a => ({
          id: a.adoptionId,
          planId: a.planId,
          planName: a.planName,
          plot: '云端记录（待绑定地块）',
          status: a.status || '认养中',
          startDate: (a.createdAt || '').toString().slice(0, 10),
          expireDate: (a.expireAt || '').toString().slice(0, 10),
          daysLeft: 300,
          icon: '/images/icon-sapling.png'
        }))
      })
      .catch(() => readAdoptionsFromStorage())
  },

  /**
   * 我的订单：研学订单 + 认养订单 合并（按时间倒序）
   * 数据源：云数据库 study_bookings + adoptions（权限"所有用户可读"才能读到自己的）
   */
  getMyOrders() {
    return Promise.all([
      getDb().collection('study_bookings').get().catch(() => ({ data: [] })),
      getDb().collection('adoptions').get().catch(() => ({ data: [] }))
    ]).then(([bookings, adoptions]) => {
      const list = []
      bookings.data.forEach(b => {
        list.push({
          orderId: b.orderId,
          type: '研学',
          name: b.productName,
          detail: (b.date || '') + ' · ' + (b.count || 1) + '人',
          amount: b.amount,
          status: b.status || '已报名',
          time: b.createdAt
        })
      })
      adoptions.data.forEach(a => {
        list.push({
          orderId: a.adoptionId,
          type: '认养',
          name: a.planName,
          detail: '认养 ' + (a.price || 0) + ' 元',
          amount: a.price,
          status: a.status || '认养中',
          time: a.createdAt
        })
      })
      // 本地缓存兜底：云里没有的订单补进来（比如云写入失败时的记录）
      const cloudIds = list.map(o => o.orderId)
      readOrdersCache().forEach(c => {
        if (cloudIds.indexOf(c.orderId) < 0) list.push(c)
      })
      // 按时间倒序（没有时间的排最后）
      list.sort((x, y) => ((x.time || 0) < (y.time || 0) ? 1 : -1))
      return list
    })
  },

  /**
   * 我的研学：已报名的研学课程（云数据库 study_bookings）
   */
  getMyStudies() {
    return getDb().collection('study_bookings').get()
      .then(res => {
        const list = res.data.map(b => ({
          orderId: b.orderId,
          productId: b.productId,
          productName: b.productName,
          date: b.date,
          count: b.count,
          amount: b.amount,
          status: b.status || '已报名',
          participants: b.participants || {}
        }))
        list.sort((x, y) => ((x.date || '') < (y.date || '') ? 1 : -1))
        return list
      })
      .catch(err => {
        console.warn('[数据源] 我的研学读取失败:', err)
        return []
      })
  },

  /**
   * 获取某计划的最新季度报告
   */
  getAdoptReports(planId) {
    const plan = adoptData.plans.find(p => p.id === planId)
    return Promise.resolve(plan ? plan.reports : [])
  },

  /**
   * 一键续约（影子版：把续约状态写入本地存储，永久（本机）生效）
   * 正式版：云数据库改该认养记录
   */
  renewAdoption(adoptionId) {
    // 更新本地存储里的记录：天数重置为 365
    const list = readAdoptionsFromStorage().map(a => {
      if (a.id === adoptionId) return { ...a, daysLeft: 365 }
      return a
    })
    wx.setStorageSync(ADOPTIONS_KEY, list)
    return Promise.resolve({ success: true })
  },

  /* ==================== 我的（第四阶段） ==================== */

  /**
   * 个人资料：读本地存储（无则给默认值）
   */
  getProfile() {
    const p = wx.getStorageSync(PROFILE_KEY)
    return {
      nickname: (p && p.nickname) || '林间访客',
      avatar: (p && p.avatar) || '/images/icon-person.png',
      phone: (p && p.phone) || ''
    }
  },

  /**
   * 保存个人资料到本地存储
   */
  saveProfile(profile) {
    wx.setStorageSync(PROFILE_KEY, profile)
  },

  /**
   * 收藏/取消收藏（真实写云数据库 user_favorites 集合）
   * @param story 故事对象（存快照，故事内容变了收藏页也能看）
   * @param isCollect true=收藏 false=取消
   */
  toggleFavorite(story, isCollect) {
    const col = getDb().collection('user_favorites')
    if (isCollect) {
      // 收藏：把故事快照写入云端（_openid 自动带上）
      return col.add({
        data: {
          storyId: story.id,
          type: story.type,
          title: story.title,
          content: story.content,
          icon: story.icon,
          time: story.time,
          likes: story.likes,
          collectedAt: new Date()
        }
      }).then(() => ({ success: true }))
    }
    // 取消收藏：先按故事编号查到自己的收藏记录，再删除
    // ⚠️ 双保险：① 编号两种叫法都兼容（首页是 id，云文档是 storyId）
    //            ② 编号若仍为 undefined，直接拒绝执行——绝不让 undefined 进查询条件（会匹配全部）
    const storyKey = story.storyId !== undefined ? story.storyId : story.id
    if (storyKey === undefined) {
      return Promise.reject(new Error('无法确定故事编号，已阻止删除'))
    }
    return col.where({ storyId: storyKey }).get().then(res => {
      const removes = res.data.map(doc => col.doc(doc._id).remove())
      return Promise.all(removes)
    }).then(() => ({ success: true }))
  },

  /**
   * 我的收藏列表（云数据库 user_favorites，只读自己的——权限已限定）
   */
  getMyFavorites() {
    return getDb().collection('user_favorites')
      .orderBy('collectedAt', 'desc')
      .get()
      .then(res => {
        console.log('[数据源] 云数据库(user_favorites)')
        return res.data
      })
      .catch(err => {
        console.warn('[数据源] 收藏读取失败:', err)
        return []
      })
  },

  /**
   * 追加一条溯源扫码记录（本地存储：扫过的码历史）
   */
  addTraceHistory(batchNo, productName) {
    const list = wx.getStorageSync(TRACE_HISTORY_KEY) || []
    list.unshift({ batchNo, productName, time: new Date().toLocaleString() })
    wx.setStorageSync(TRACE_HISTORY_KEY, list.slice(0, 20))  // 最多留 20 条
  },

  /**
   * 溯源扫码记录列表
   */
  getTraceHistory() {
    return wx.getStorageSync(TRACE_HISTORY_KEY) || []
  },

  /* ==================== 后台三端（第四阶段） ==================== */

  /**
   * 发布故事（后台-内容管理）：真实写云 stories 集合 → 首页故事流立现
   * 规则：标题不可重复（先查重再发布——标题重复会让收藏等按编号的功能混淆）
   */
  publishStory(story) {
    return getDb().collection('stories')
      .where({ title: story.title })     // 查重：同名标题已存在则拒绝
      .count()
      .then(res => {
        if (res.total > 0) {
          return { success: false, reason: '标题已存在，请更换后重试' }
        }
        return getDb().collection('stories').add({
          data: {
            type: story.type || '林间记事',
            title: story.title,
            content: story.content,
            icon: story.icon || '/images/icon-seedling.png',
            author: story.author || '林场团队',
            role: story.role || '内容团队',
            time: story.time,          // 发布当天日期
            likes: 0
          }
        }).then(res => ({ success: true, id: res._id }))
      })
      .catch(err => {
        console.error('[写云] 故事发布失败:', err)
        return { success: false, reason: '发布失败，请重试' }
      })
  },

  /**
   * 全部故事（后台-内容管理）：读云 stories，按时间倒序
   * 用途：管理端查看已发布内容、删除误发/重复的内容
   */
  getAllStories() {
    return getDb().collection('stories').orderBy('time', 'desc').get()
      .then(res => {
        console.log('[数据源] 云数据库(stories)')
        return res.data
      })
      .catch(() => [])
  },

  /**
   * 删除故事（后台-内容管理）：按云文档 _id 删除
   * 注意：仅能删除自己发布的内容（权限：仅创建者可读写）；控制台导入的种子数据
   * 若删除被拒，提示到云控制台操作
   */
  deleteStory(docId) {
    return getDb().collection('stories').doc(docId).remove()
      .then(() => ({ success: true }))
      .catch(err => {
        console.error('[写云] 删除故事失败:', err)
        return { success: false, reason: '删除失败：种子数据请到云控制台删除' }
      })
  },

  /**
   * 巡护记录列表（后台-管护员端）：读云 patrol_records，按时间倒序
   */
  getPatrolRecords() {
    return getDb().collection('patrol_records').orderBy('createdAt', 'desc').get()
      .then(res => {
        console.log('[数据源] 云数据库(patrol_records)')
        return res.data
      })
      .catch(() => [])
  },

  /**
   * 上传巡护记录（后台-管护员端）
   * 照片真实上传云存储（wx.cloud.uploadFile），记录写云 patrol_records
   */
  submitPatrolRecord(record) {
    // 1. 照片上传云存储（没有照片就直接跳过）
    const upload = record.photoPath
      ? wx.cloud.uploadFile({
          cloudPath: 'patrol/' + Date.now() + '.jpg',
          filePath: record.photoPath
        })
      : Promise.resolve({ fileID: '' })
    return upload.then(res => {
      // 2. 记录写云（自动关联时间戳；GPS 正式版接入）
      return getDb().collection('patrol_records').add({
        data: {
          plot: record.plot,
          note: record.note || '',
          photoFileID: res.fileID || '',
          location: 'GPS 已关联（演示版未取真坐标）',
          createdAt: new Date()
        }
      })
    }).then(() => ({ success: true }))
      .catch(err => {
        console.error('[写云] 巡护记录提交失败:', err)
        return { success: false }
      })
  },

  /**
   * 全部订单（后台-管理员端）：研学订单 + 认养记录
   * 当前靠"所有用户可读"权限直接读；正式版改为云函数（带管理员身份校验）
   */
  getAllOrders() {
    return Promise.all([
      getDb().collection('study_bookings').get().catch(() => ({ data: [] })),
      getDb().collection('adoptions').get().catch(() => ({ data: [] }))
    ]).then(([bookings, adoptions]) => ({
      study: bookings.data,
      adopt: adoptions.data
    }))
  },

  /* ==================== v0.2 补齐项 ==================== */

  /**
   * 物候观测录入（管护员端）：写云 phenology_records
   */
  submitPhenologyRecord(record) {
    return getDb().collection('phenology_records').add({
      data: {
        event: record.event,        // 物候事件：刺五加发芽期/红松球果膨大期/木耳出耳期等
        plot: record.plot,
        note: record.note || '',
        photoFileID: record.photoFileID || '',
        createdAt: new Date()
      }
    }).then(() => ({ success: true }))
      .catch(err => {
        console.error('[写云] 物候记录失败:', err)
        return { success: false, reason: '提交失败，请重试' }
      })
  },

  getPhenologyRecords() {
    return getDb().collection('phenology_records').orderBy('createdAt', 'desc').get()
      .then(res => res.data)
      .catch(() => [])
  },

  /**
   * 采收现场建档（管护员端）：写云 harvest_records（含批次绑定）
   */
  submitHarvestRecord(record) {
    return getDb().collection('harvest_records').add({
      data: {
        plot: record.plot,
        worker: record.worker,
        batchNo: record.batchNo,    // 绑定批次 → 溯源档案原始数据
        note: record.note || '',
        photoFileID: record.photoFileID || '',
        createdAt: new Date()
      }
    }).then(() => ({ success: true }))
      .catch(err => {
        console.error('[写云] 采收建档失败:', err)
        return { success: false, reason: '提交失败，请重试' }
      })
  },

  getHarvestRecords() {
    return getDb().collection('harvest_records').orderBy('createdAt', 'desc').get()
      .then(res => res.data)
      .catch(() => [])
  },

  /**
   * 林地影像：读云 imagery 集合（无记录则回退 mock 占位图）
   */
  getImagery() {
    return getDb().collection('imagery').get()
      .then(res => {
        if (res.data.length) {
          const d = res.data[0]
          return { url: d.url, date: d.date, plot: d.plot, note: d.note }
        }
        return homeData.imagery
      })
      .catch(() => homeData.imagery)
  },

  /**
   * 更新林地影像（内容管理）：照片传云存储 + 写云 imagery 集合
   */
  updateImagery(data) {
    // 1. 有新照片则上传云存储拿 fileID（否则沿用原图）
    const upload = data.photoPath
      ? wx.cloud.uploadFile({ cloudPath: 'imagery/' + Date.now() + '.jpg', filePath: data.photoPath })
          .then(res => res.fileID)
      : Promise.resolve(data.keepUrl || '')
    return upload.then(fileID => {
      if (!fileID) return { success: false, reason: '缺少影像文件' }
      const doc = { url: fileID, date: data.date, plot: data.plot, note: data.note }
      // 2. 写 imagery 集合（已有记录则覆盖更新）
      return getDb().collection('imagery').get().then(res => {
        if (res.data.length) {
          return getDb().collection('imagery').doc(res.data[0]._id).update({ data: doc })
        }
        return getDb().collection('imagery').add({ data: doc })
      })
    }).then(() => ({ success: true }))
      .catch(err => {
        console.error('[写云] 影像更新失败:', err)
        return { success: false, reason: '更新失败，请重试' }
      })
  },

  /**
   * 更新样地生态数据（内容管理）：写云 plots 集合
   * 更新或新建（upsert）+ 写后验证
   * ⚠️ 已知坑：控制台导入的记录无 _openid（无主记录），update 会"静默成功但不变更"——
   *    所以更新后必须读回验证，改不动就明确报错并指引数据迁移
   */
  updatePlot(plotId, fields) {
    const verify = () => {
      // 读回验证：确认新值真的写进去了
      return getDb().collection('plots').where({ id: plotId }).get()
        .then(res => {
          const doc = res.data[0]
          const saved = doc && doc.soilOrganic ? doc.soilOrganic[doc.soilOrganic.length - 1] : null
          const target = fields.soilOrganic[fields.soilOrganic.length - 1]
          if (saved === null || saved !== target) {
            return { success: false, reason: '更新未生效：旧记录为"无主数据"（控制台导入）。请在云控制台 → 数据库 → plots 删除该样地记录后，在本页重新保存（将自动新建归属你的记录）' }
          }
          return { success: true }
        })
    }
    return getDb().collection('plots').where({ id: plotId }).get()
      .then(res => {
        if (res.data.length) {
          return getDb().collection('plots').doc(res.data[0]._id).update({ data: fields })
        }
        return getDb().collection('plots').add({ data: { id: plotId, ...fields } })
      })
      .then(verify)
      .catch(err => {
        console.error('[写云] 样地更新失败:', err)
        return { success: false, reason: '更新失败，请重试' }
      })
  },

  /**
   * 新增产品批次（管理员端）：写云 trace_batches
   */
  addBatch(batch) {
    return getDb().collection('trace_batches').add({ data: batch })
      .then(() => ({ success: true }))
      .catch(err => {
        console.error('[写云] 新增批次失败:', err)
        return { success: false, reason: '新增失败，请重试' }
      })
  },

  /**
   * 删除批次（管理员端）：按云文档 _id 删除（仅自己的；种子数据提示控制台）
   */
  deleteBatch(docId) {
    return getDb().collection('trace_batches').doc(docId).remove()
      .then(() => ({ success: true }))
      .catch(err => {
        console.error('[写云] 删除批次失败:', err)
        return { success: false, reason: '删除失败：种子数据请到云控制台删除' }
      })
  },

  /**
   * 从模板导入演示批次（管理员端，一次性数据迁移用）
   * 用途：控制台导入的旧批次是"无主数据"（无 _openid），小程序改不动。
   *       在云控制台删除旧记录后，用本函数以当前用户身份重建（五维数据完整，
   *       自动归属当前用户 → 之后可上传 PDF/删除/修改）
   */
  importSeedBatches() {
    const seeds = traceData.batches
    return getDb().collection('trace_batches').get()
      .then(res => {
        const existing = res.data.map(b => b.batchNo)
        const toAdd = seeds.filter(s => existing.indexOf(s.batchNo) < 0)
        if (!toAdd.length) return { success: true, added: 0 }
        // 客户端 add() 会自动带上当前用户 _openid（归属当前用户）
        const adds = toAdd.map(s => getDb().collection('trace_batches').add({ data: s }))
        return Promise.all(adds).then(() => ({ success: true, added: toAdd.length }))
      })
      .catch(err => {
        console.error('[写云] 导入演示批次失败:', err)
        return { success: false, reason: '导入失败，请重试' }
      })
  },

  /**
   * 上传检测报告 PDF 并绑定批次（管理员端）
   * ⚠️ 存储权限（免费套餐固定"仅创建者可读写"）：文件必须从小程序内上传才会归属
   *    当前用户（控制台上传的文件无归属，谁都读不了）——从小程序上传即绕开此限制
   */
  uploadBatchReport(docId, fileID) {
    return getDb().collection('trace_batches').doc(docId).get()
      .then(res => {
        const doc = res.data
        const report = Object.assign({}, doc.report, { pdfUrl: fileID })
        return getDb().collection('trace_batches').doc(docId).update({ data: { report } })
      })
      .then(() => ({ success: true }))
      .catch(err => {
        console.error('[写云] 报告绑定失败:', err)
        return { success: false, reason: '绑定失败：该批次为控制台导入的无主数据，请在云控制台删除后在本页重建批次' }
      })
  }
}
