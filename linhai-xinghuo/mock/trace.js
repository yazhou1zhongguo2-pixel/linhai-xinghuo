/**
 * mock/trace.js —— 溯源档案假数据
 * 设计书模块二：扫码溯源 → 五维溯源档案（产地/生长/环境/采收/检测）
 * ⚠️ 字段名与将来云数据库保持一致（"换引擎不换车"）
 * 设计书注明：溯源数据"能做多少做多少"——当前为演示用示例档案
 */
module.exports = {
  batches: [
    {
      batchNo: 'LH20260712-001',          // 批次号（产品包装上的溯源码内容）
      product: '椴木黑木耳 · 2026年头茬（干品）',
      archiveId: 'LH-ARC-2026-0001',       // 唯一档案编号（防篡改标识之一）
      timestamp: '2026-07-12 09:30:22',    // 档案生成时间戳（防篡改标识之二）

      // 维度一：产地信息
      origin: {
        plotId: '轮作区A-03号地块',
        gps: 'E128°12′ · N43°45′（已脱敏至林班层级）',
        // 地图定位坐标（已脱敏至林班层级，非地块精确位置）
        gpsCoords: { latitude: 43.75, longitude: 128.20 },
        fallowYears: '3年轮休',
        ecoZone: '针阔混交林生态功能区'
      },

      // 维度二：生长记录（关键节点 3-5 张照片）
      growth: [
        { stage: '接种期',   date: '2025-11-08', photo: '/images/icon-seedling.png', note: '椴木段接种木耳菌种' },
        { stage: '菌丝定植', date: '2026-01-15', photo: '/images/icon-seedling.png', note: '菌丝萌发，进入定植期' },
        { stage: '出耳期',   date: '2026-06-20', photo: '/images/icon-mushroom.png', note: '头茬木耳出耳' },
        { stage: '采收前巡检', date: '2026-07-10', photo: '/images/icon-mushroom.png', note: '采收前现场巡检，无病虫害' }
      ],

      // 维度三：环境数据（生长期间土壤温湿度）
      env: {
        months: ['2月', '3月', '4月', '5月', '6月', '7月'],
        soilTemp: [-8.2, -3.1, 4.5, 12.8, 18.6, 22.4],   // 月均土壤温度 ℃
        humidity: [72, 68, 61, 55, 78, 84],              // 月均空气相对湿度 %
        note: '数据来自驻场团队逐日观测，每季度汇总发布'
      },

      // 维度四：采收信息
      harvest: {
        date: '2026-07-12',
        worker: '赵师傅（合作社成员）',
        photo: '/images/icon-mushroom.png',
        note: '凌晨4点采收，全程留痕记录，当日进入晾晒棚'
      },

      // 维度五：检测报告
      report: {
        summary: [
          { name: '农药残留',      result: '未检出',      standard: 'GB 2763-2021' },
          { name: '重金属（铅）',  result: '0.03 mg/kg',  standard: '≤ 0.2 mg/kg' },
          { name: '有效成分（木耳多糖）', result: '6.8%', standard: '干品参考值' }
        ],
        lab: '高校联合实验室 · 林海大学食品检测中心',
        pdfUrl: ''   // 模拟：PDF 下载暂未实现（"能做多少做多少"）
      }
    },
    {
      batchNo: 'LH20260520-002',
      product: '赤灵芝切片 · 2026年春季（干品）',
      archiveId: 'LH-ARC-2026-0002',
      timestamp: '2026-05-20 14:15:08',
      origin: {
        plotId: '轮作区C-01号地块',
        gps: 'E128°09′ · N43°47′（已脱敏至林班层级）',
        gpsCoords: { latitude: 43.78, longitude: 128.15 },
        fallowYears: '5年轮休',
        ecoZone: '针阔混交林生态功能区'
      },
      growth: [
        { stage: '菌包接种',   date: '2025-06-15', photo: '/images/icon-mushroom.png', note: '赤灵芝菌包接种' },
        { stage: '子实体形成', date: '2025-09-02', photo: '/images/icon-mushroom.png', note: '子实体破土而出' },
        { stage: '成熟采收',   date: '2026-04-28', photo: '/images/icon-mushroom.png', note: '孢子粉释放后采收' }
      ],
      env: {
        months: ['12月', '1月', '2月', '3月', '4月'],
        soilTemp: [-6.4, -9.8, -3.2, 4.1, 11.5],
        humidity: [66, 70, 65, 58, 63],
        note: '数据来自驻场团队逐日观测，每季度汇总发布'
      },
      harvest: {
        date: '2026-04-28',
        worker: '张永林（护林人）',
        photo: '/images/icon-mushroom.png',
        note: '孢子粉释放期结束采收，阴干切片'
      },
      report: {
        summary: [
          { name: '农药残留',      result: '未检出',     standard: 'GB 2763-2021' },
          { name: '重金属（镉）',  result: '0.02 mg/kg', standard: '≤ 0.3 mg/kg' },
          { name: '灵芝三萜含量',  result: '1.2%',       standard: '干品参考值' }
        ],
        lab: '高校联合实验室 · 林海大学食品检测中心',
        pdfUrl: ''
      }
    }
  ]
}
