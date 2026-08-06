# 「林海星火」小程序 · 接手指南（QUICKSTART）

> 目标：让**另一个开发者**在**另一台设备**上，以最少的步骤继续本项目开发。
> 预计耗时：首次 30-60 分钟。本文档配套 `linhai-xinghuo-release.zip` 使用。

---

## 一、需要准备的账号（自己注册）

| 项目 | 说明 |
|---|---|
| 微信 | 用于登录开发者工具 |
| 小程序 AppID | https://mp.weixin.qq.com 注册（个人主体免费），**审核需数小时~2 天** |
| 微信开发者工具 | 官网下载稳定版（Windows 64 位） |
| 腾讯云开发环境 | 用你的 AppID 开通（新账号可免费创建环境） |

---

## 二、五步上手

### 第 1 步：安装并登录开发者工具
1. 官网下载稳定版：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 安装（建议非 C 盘、路径无中文），用**手机微信扫码登录**

### 第 2 步：导入项目
1. 解压 `linhai-xinghuo-release.zip`
2. 开发者工具 → 导入项目 → 选择解压出的 `linhai-xinghuo` 文件夹
3. AppID 填**你自己的**（会自动更新到 project.config.json）

### 第 3 步：开通云开发
1. 工具工具栏点"云开发"→ 开通（免费环境）
2. 记下你的**环境 ID**（形如 `cloud1-xxxxxx`）
3. 打开 `app.js`，把 `wx.cloud.init` 里的 `env` 改成你的环境 ID

### 第 4 步：建集合 + 配权限（16 个）
云开发控制台 → 数据库 → 新建集合并设置权限：

| 集合 | 权限 |
|---|---|
| stories / plots / trace_batches / study_bookings / adoptions / patrol_records / phenology_records / harvest_records / imagery / study_products / adopt_plans / reviews | 所有用户可读，仅创建者可读写 |
| user_favorites / story_likes / feedback / users | 仅创建者可读写 |

### 第 5 步：导入种子数据
项目内 `db_seed/` 目录的 JSON（NDJSON 格式，每行一条）：
- `stories.json` + `stories-extra.json` → stories 集合
- `plots.json` → plots 集合
- `trace_batches.json` + `trace_batches-extra.json` → trace_batches 集合
- `study_products.json` → study_products 集合
- `adopt_plans.json` → adopt_plans 集合

控制台 → 对应集合 → 导入 → 选择文件。

### 第 6 步：部署云函数（4 个）
开发者工具 → `cloudfunctions/` 下每个文件夹 → **右键 → 上传并部署：云端安装依赖**：
- `bookStudy`（名额事务校验+下单）
- `sendNotify`（订阅消息推送）
- `aggregateToArchive`（采收/物候→批次档案汇聚）
- `releaseSeats`（删单释放名额）

### 第 7 步（可选）：订阅消息推送
mp 后台 → 功能 → 订阅消息 → 选用"报名成功通知"模板 → 把模板 ID 填入 `utils/api.js` 的 `SUBSCRIBE_TMPL_IDS`（thing1=活动名称 / thing4=温馨提示）。

**完成！** 编译运行：首页故事流、生态看板、溯源档案、研学报名（名额真实减少）、认养、订阅推送应正常（[数据源] 云数据库 日志）。

---

## 三、需要修改的文件（只有 2 处）

| 文件 | 修改点 |
|---|---|
| `project.config.json` | `appid` 字段 → 你的 AppID（导入时工具一般自动改） |
| `app.js` | `wx.cloud.init({ env: '...' })` → 你的云环境 ID |

其余代码无需任何修改——数据访问层（utils/api.js）云端优先、mock 回退，数据缺失自动兜底。

---

## 四、可选：让功能完整

- **检测报告 PDF**：批次管理页 → "上传检测报告 PDF"（从小程序内上传，文件归属你；存储免费套餐仅创建者可读）
- **管理口令**：`pages/mine/admin.js` 顶部 `ADMIN_PASSWORD = 'linhai2026'`，改成你自己的
- **研学/认养数据**：在 `mock/study.js`、`mock/adopt.js` 里修改（暂未上云）

---

## 五、重要边界（接手前必读）

1. **账号数据不迁移**：AppID、云环境、云数据库里的真实数据（订单/收藏/巡护）都属于原账号，代码仓库里只有种子演示数据
2. **支付为影子版**：个人主体无法开通微信支付；取得企业/个体户主体后替换 `wx.requestPayment` 预留位
3. **云存储免费套餐**：文件"仅创建者可读写"且不可改——照片/PDF 必须从小程序内上传（归属上传者本人可读）
4. **正式运营**：云开发环境到期转付费（基础套餐 19.9 元/月）
5. **云函数已建设**（4 个）：名额校验/订阅推送/数据汇聚/名额释放均已实现；小程序码、管理员白名单、用户列表仍待 v0.5（见功能实现状态说明.md 第二节）

---

## 六、常用操作备忘

- 真机预览：工具顶部"预览"→ 手机微信扫码
- 扫码测试：工具栏"模拟操作 → 扫一扫"
- 上传审核：工具"上传"→ mp 后台版本管理 → 提交审核
- 体验版：mp 后台 → 成员管理添加体验成员（上限 15 人）
- 隐私合规：mp 后台 → 设置 → 用户隐私保护指引（勾选相册/相机）
