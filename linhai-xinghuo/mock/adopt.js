/**
 * mock/adopt.js —— 云认养模块假数据（设计书模块四）
 * 三层认养计划 + 示例"我的认养"（专属主页数据）
 * ⚠️ 字段名与将来云数据库保持一致（"换引擎不换车"）
 *
 * price: 认养价格（设计书：199 / 1999 / 19999）
 * limit: 限量株数（仅林下参有，50 株）
 * reports: 季度生长报告（专属认养主页展示）
 * carbonReport: 是否含碳汇趣味报告（红松专属）
 */
module.exports = {
  plans: [
    {
      id: 'adopt-muer',
      name: '木耳菌棒认养',
      tagline: '1㎡轮作区 · 当年全部木耳产出',
      price: 199,
      unit: '元/年',
      icon: '/images/icon-adopt-log.png',   // 专属图标：立放菌棒+出耳（v0.2）
      limit: null,               // 无限量
      years: 1,
      summary: '在轮作区认养 1㎡ 木耳菌架，这一年的全部木耳产出都归你。每季度收到菌丝发育和出耳情况的图文报告。',
      benefits: [
        '1㎡ 轮作区木耳菌棒（当年全部产出）',
        '季度图文生长报告（菌丝发育/出耳情况）',
        '电子认养证书',
        '优先购买当年出产的干木耳'
      ],
      reports: [
        { season: '2026年第一季度', date: '2026-04-02', title: '菌丝定植期报告', content: '菌丝已全面定植，菌棒水分适宜，预计 6 月进入出耳期。', photo: '/images/icon-seedling.png' },
        { season: '2026年第二季度', date: '2026-07-01', title: '头茬木耳出耳报告', content: '头茬木耳已采收，肉头厚实，晾晒棚第一批已经入库。', photo: '/images/icon-mushroom.png' }
      ],
      // 碳汇趣味报告（木耳专属：菌渣还田的土壤固碳叙事）
      carbonReport: {
        title: '你认养的 1㎡ 木耳菌架，今年帮土壤固存了约 3.2 公斤有机质',
        detail: '按菌渣还田的有机质转化估算，相当于固存约 1.8 公斤二氧化碳当量，同时避免了等量菌渣露天焚烧的排放。木耳虽不直接固碳，但它让轮作区土壤越种越肥——这是属于土地的碳循环。'
      }
    },
    {
      id: 'adopt-hongsong',
      name: '红松+中药材复合认养',
      tagline: '松子收益权 · 树下药材观察',
      price: 1999,
      unit: '元/年',
      icon: '/images/icon-adopt-pine.png',  // 专属图标：红松+球果（v0.2）
      limit: null,
      years: 1,
      summary: '认养一株红松及其树下的中药材地块。红松的松子收益权归你，树下刺五加等药材全年可观察，还能收到专属的碳汇趣味报告。',
      benefits: [
        '红松松子收益权（当年）',
        '树下中药材观察权（刺五加等）',
        '碳汇趣味报告（红松专属）',
        '季度生长报告 + 电子认养证书'
      ],
      reports: [
        { season: '2026年第一季度', date: '2026-04-05', title: '红松春季生长报告', content: '球果花序进入膨大期，树下刺五加已发芽。', photo: '/images/icon-seedling.png' },
        { season: '2026年第二季度', date: '2026-07-02', title: '红松夏季生长报告', content: '球果发育良好，预估单株产松子约 3.5 公斤。', photo: '/images/icon-tree.png' }
      ],
      carbonReport: {
        title: '你养的那棵红松，今年帮地球处理了 42 公斤二氧化碳',
        detail: '按红松年均固碳量 42kg CO2/年 估算。相当于 2.3 棵树苗一年的吸收量，或 168 次城市通勤的排放。'
      }
    },
    {
      id: 'adopt-linxiacan',
      name: '15年林下参深度认养',
      tagline: '限量50株 · 最终采挖归属权',
      price: 19999,
      unit: '元/株',
      icon: '/images/icon-adopt-ginseng.png', // 专属图标：林下参（v0.2）
      limit: 50,                 // 限量 50 株
      sold: 12,                  // 已认养 12 株
      years: 15,
      summary: '在林下参专属地块认养一株 15 年期林下参。五年实地探访权益、参籽标本、最终采挖归属权——这是最深的陪伴。',
      benefits: [
        '15 年林下参最终采挖归属权',
        '5 年实地探访权益（每年 1 次）',
        '参籽标本一份',
        '年度深度报告 + 电子认养证书'
      ],
      reports: [
        { season: '第 1 年度', date: '2026-05-18', title: '认养年度报告', content: '参株生长健壮，叶片完整，已做好年度记录档案。', photo: '/images/icon-seedling.png' }
      ],
      // 碳汇趣味报告（林下参专属：认养保护林地不被砍伐的固碳叙事）
      carbonReport: {
        title: '你认养的那株林下参，守护着 10㎡ 原始林下环境 15 年',
        detail: '按针阔混交林年均固碳量估算，这 15 年约固存 500 公斤二氧化碳——相当于一辆家用车行驶约 4000 公里的排放。林下参离不开这片林子，而你的认养让这片林地远离砍伐，一直绿下去。'
      }
    }
  ],

  // 示例"我的认养"（专属认养主页数据；正式版从云数据库读用户认养记录）
  myAdoptions: [
    {
      id: 'AD-2026-0001',
      planId: 'adopt-muer',
      planName: '木耳菌棒认养',
      plot: '轮作区A-03号地块',
      status: '认养中',           // 状态：认养中 / 已到期 / 已续约
      startDate: '2026-01-01',
      expireDate: '2026-12-31',
      daysLeft: 151,             // 到期提醒：剩 30 天内提示续约
      icon: '/images/icon-adopt-log.png'
    },
    {
      id: 'AD-2026-0002',
      planId: 'adopt-hongsong',
      planName: '红松+中药材复合认养',
      plot: '北坡样地-07号红松',
      status: '认养中',
      startDate: '2026-01-01',
      expireDate: '2026-12-31',
      daysLeft: 151,
      icon: '/images/icon-adopt-pine.png'
    },
    {
      // 临期示例：剩 12 天 → 演示"到期前 30 天续约提醒"
      id: 'AD-2025-0003',
      planId: 'adopt-hongsong',
      planName: '红松+中药材复合认养',
      plot: '西坡样地-02号红松',
      status: '认养中',
      startDate: '2025-08-20',
      expireDate: '2026-08-20',
      daysLeft: 12,
      icon: '/images/icon-adopt-pine.png'
    }
  ]
}
