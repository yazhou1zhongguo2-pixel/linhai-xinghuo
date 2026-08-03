/**
 * mock/stories.js —— "正在发生"故事流（假数据）
 * 按时间轴排列的护林故事：巡护记录 / 驻场日记 / 林间发现
 *
 * id:        故事编号
 * type:      故事类型（显示为角标）
 * title:     标题
 * content:   正文摘要
 * author:    作者名
 * role:      作者身份（护林人 / 学生 / 研究员）
 * time:      发布时间
 * emoji:     配图占位（第二阶段换真实照片）→ 已改为 icon 图片路径
 *             ⚠️ 教训：emoji 在模拟器正常但安卓真机可能显示空白，界面图标一律用 PNG 图片
 * icon:      配图占位图标（images/icon-*.png）
 * likes:     点赞数（liked 是"我是否已点赞"）
 * liked:     我是否已点赞
 * collected: 我是否已收藏
 */
module.exports = [
  {
    id: 1,
    type: '巡护记录',
    title: '早春第一轮巡护：刺五加冒芽了',
    content: '沿西坡样线巡护 6 公里，发现刺五加已进入发芽期，比去年提前了 5 天。红外相机在溪谷拍到了野猪一家。',
    author: '张永林',
    role: '护林人',
    time: '2026-07-28',
    icon: '/images/icon-seedling.png',
    likes: 12,
    liked: false,
    collected: false
  },
  {
    id: 2,
    type: '驻场日记',
    title: '雨季前的样地测量',
    content: '今天是第三轮土壤采样。轮作区 A 的有机质含量又涨了一点，数据在慢慢变好，像看着孩子长个子。',
    author: '李青禾',
    role: '驻场学生',
    time: '2026-07-15',
    icon: '/images/icon-notebook.png',
    likes: 8,
    liked: false,
    collected: false
  },
  {
    id: 3,
    type: '林间发现',
    title: '红外相机的新访客',
    content: '北坡样地红外相机连续两晚拍到赤狐。它在 3 号菌架附近转悠了很久——放心，木耳都收进仓库了。',
    author: '王护林',
    role: '护林人',
    time: '2026-07-02',
    icon: '/images/icon-fox.png',
    likes: 26,
    liked: false,
    collected: false
  },
  {
    id: 4,
    type: '林间发现',
    title: '第一茬木耳出耳了',
    content: '雨后湿度正好，菌棒上的木耳出了头茬。个头不大但肉头厚，晾晒棚里已经是第一批了。',
    author: '赵师傅',
    role: '合作社成员',
    time: '2026-06-18',
    icon: '/images/icon-log.png',      // v0.2 换用菌棒图标，更贴切
    likes: 19,
    liked: false,
    collected: false
  }
]
