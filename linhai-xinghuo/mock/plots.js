/**
 * mock/plots.js —— 样地生态数据（假数据）
 * A/B/C 三个对照样地的关键指标
 * ⚠️ 字段名与将来云数据库的字段完全一致（"换引擎不换车"的保证）
 *
 * soilOrganic: 土壤有机质含量(%)，三个季度历史值数组（将来画折线图用）
 * bioIndex:    生物多样性指数
 * carbonSeq:   碳汇增量预估(kg CO2/年)
 * update:      数据更新时间（按设计书：每季度更新一次）
 */
module.exports = {
  A: {
    id: 'A',
    name: '轮作区A',
    soilOrganic: [21.0, 22.1, 22.8],   // 三个季度：上升 → 轮作起效
    bioIndex: 3.2,
    carbonSeq: 128,
    update: '2026年第二季度'
  },
  B: {
    id: 'B',
    name: '对照区B',
    soilOrganic: [18.2, 18.1, 18.3],   // 三个季度：基本不变 → 对照
    bioIndex: 2.4,
    carbonSeq: 96,
    update: '2026年第二季度'
  },
  C: {
    id: 'C',
    name: '轮作区C',
    soilOrganic: [19.4, 20.2, 21.3],   // 三个季度：缓慢上升
    bioIndex: 2.9,
    carbonSeq: 110,
    update: '2026年第二季度'
  }
}
