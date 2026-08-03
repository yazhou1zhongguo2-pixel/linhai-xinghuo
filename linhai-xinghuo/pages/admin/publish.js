// 内容管理 · 故事发布（后台-内容管理端）
// 真实写云 stories 集合 → 首页"正在发生"故事流立现（设计书模块六）

const api = require('../../utils/api.js')

Page({
  data: {
    types: ['巡护记录', '驻场日记', '林间发现'],   // 故事类型选项
    icons: [                                       // 配图选项（PNG 图标，v0.2 扩充至 10 个）
      { label: '芽苗', src: '/images/icon-seedling.png' },
      { label: '日记', src: '/images/icon-notebook.png' },
      { label: '狐狸', src: '/images/icon-fox.png' },
      { label: '蘑菇', src: '/images/icon-mushroom.png' },
      { label: '松树', src: '/images/icon-tree.png' },
      { label: '山雀', src: '/images/icon-bird.png' },
      { label: '松鼠', src: '/images/icon-squirrel.png' },
      { label: '落叶', src: '/images/icon-leaf.png' },
      { label: '晨光', src: '/images/icon-sun.png' },
      { label: '菌棒', src: '/images/icon-log.png' }
    ],
    form: { type: '巡护记录', title: '', content: '', icon: '/images/icon-seedling.png' },
    stories: []      // 已发布的故事（管理列表）
  },

  // 每次进入页面都刷新已发布列表（发布/删除后立即同步）
  onShow() {
    this.loadStories()
  },

  loadStories() {
    api.getAllStories().then(stories => {
      this.setData({ stories: stories })
    })
  },

  // 选类型
  pickType(e) {
    this.setData({ 'form.type': e.currentTarget.dataset.value })
  },

  // 选配图
  pickIcon(e) {
    this.setData({ 'form.icon': e.currentTarget.dataset.src })
  },

  // 输入（标题/内容）
  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  // 发布
  submit() {
    const f = this.data.form
    if (!f.title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' }); return
    }
    if (!f.content.trim()) {
      wx.showToast({ title: '请填写内容', icon: 'none' }); return
    }
    // 发布日期：今天（yyyy-mm-dd 格式）
    const d = new Date()
    const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    api.publishStory({
      type: f.type,
      title: f.title.trim(),
      content: f.content.trim(),
      icon: f.icon,
      time: today
    }).then(res => {
      if (res.success) {
        wx.showToast({ title: '发布成功！首页故事流可见', icon: 'success' })
        // 清空表单 + 刷新已发布列表
        this.setData({ form: { type: f.type, title: '', content: '', icon: f.icon } })
        this.loadStories()
      } else {
        // 显示具体失败原因（如"标题已存在"）
        wx.showToast({ title: res.reason || '发布失败', icon: 'none' })
      }
    })
  },

  // 删除故事（带确认弹窗）
  removeStory(e) {
    const docId = e.currentTarget.dataset.id
    const title = e.currentTarget.dataset.title
    wx.showModal({
      title: '删除故事',
      content: '确定删除《' + title + '》吗？删除后首页故事流同步移除。',
      confirmColor: '#C0392B',
      success: (res) => {
        if (!res.confirm) return
        api.deleteStory(docId).then(result => {
          wx.showToast({ title: result.success ? '已删除' : (result.reason || '删除失败'), icon: 'none' })
          if (result.success) this.loadStories()
        })
      }
    })
  }
})
