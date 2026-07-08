/*************************************************************************
 * 版权所有 (C)2026, AlignSync
 *
 * 文件名称： generate_report.js
 * 内容摘要： 生成《数据库应用课程设计报告》.docx，遵循 2022 版模板格式
 * 当前版本： V1.0
 * 作    者： AlignSync 小组
 * 完成日期： 20260708
 *************************************************************************/

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat,
  TabStopType, TabStopPosition, TableOfContents, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber,
  PageBreak,
} = require("docx");

// ---------- 全局样式常量 ----------
const FONT_CN = "宋体";
const FONT_EN = "Times New Roman";
const fontObj = { ascii: FONT_EN, eastAsia: FONT_CN, hAnsi: FONT_EN, cs: FONT_EN };
const CODE_FONT = { ascii: "Consolas", eastAsia: FONT_CN, hAnsi: "Consolas" };

const PAGE_W = 11906;        // A4 宽
const PAGE_H = 16838;        // A4 高
const MARGIN = 1440;         // 1 英寸页边距
const CONTENT_W = PAGE_W - 2 * MARGIN; // 9026 DXA

// ---------- 辅助构造函数 ----------
function body(text, opts = {}) {
  const runs = Array.isArray(text)
    ? text
    : [new TextRun({ text, font: fontObj, size: 21 })];
  return new Paragraph({
    spacing: { line: 360, lineRule: "auto", before: 0, after: 60 },
    indent: { firstLine: 420 },
    alignment: AlignmentType.JUSTIFIED,
    ...opts,
    children: runs,
  });
}
function bodyFlat(text, opts = {}) {
  const runs = Array.isArray(text)
    ? text
    : [new TextRun({ text, font: fontObj, size: 21 })];
  return new Paragraph({
    spacing: { line: 360, lineRule: "auto", before: 0, after: 60 },
    alignment: AlignmentType.JUSTIFIED,
    ...opts,
    children: runs,
  });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { line: 576, lineRule: "auto", before: 240, after: 120 },
    children: [new TextRun({ text, font: fontObj, size: 30, bold: true })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { line: 360, lineRule: "auto", before: 180, after: 100 },
    children: [new TextRun({ text, font: fontObj, size: 24, bold: true })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { line: 360, lineRule: "auto", before: 120, after: 80 },
    children: [new TextRun({ text, font: fontObj, size: 22, bold: true })],
  });
}
// 代码块（等宽，浅灰底，无首行缩进）
function code(text) {
  return text.split("\n").map(
    (ln) =>
      new Paragraph({
        spacing: { line: 276, lineRule: "auto", before: 0, after: 0 },
        indent: { left: 240 },
        shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
        children: [new TextRun({ text: ln.length === 0 ? " " : ln, font: CODE_FONT, size: 18 })],
      })
  );
}
// 占位提示（醒目黄底框）
function placeholder(text) {
  return new Paragraph({
    spacing: { line: 360, lineRule: "auto", before: 120, after: 120 },
    indent: { left: 200, right: 200 },
    alignment: AlignmentType.CENTER,
    shading: { fill: "FFF2CC", type: ShadingType.CLEAR },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: "BF9000", space: 4 },
      left: { style: BorderStyle.SINGLE, size: 6, color: "BF9000", space: 4 },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "BF9000", space: 4 },
      right: { style: BorderStyle.SINGLE, size: 6, color: "BF9000", space: 4 },
    },
    children: [new TextRun({ text, font: fontObj, size: 21, bold: true, color: "8B5A00" })],
  });
}
function caption(text) {
  return new Paragraph({
    spacing: { before: 60, after: 120 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, font: fontObj, size: 20, bold: true })],
  });
}
function blank() {
  return new Paragraph({ children: [new TextRun({ text: "", font: fontObj, size: 21 })] });
}
function cell(text, width, opts = {}) {
  const isHeader = opts.header === true;
  const align = opts.align || (isHeader ? AlignmentType.CENTER : AlignmentType.LEFT);
  const arr = Array.isArray(text) ? text : [text];
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    shading: isHeader ? { fill: "D9E2F3", type: ShadingType.CLEAR } : undefined,
    children: arr.map(
      (t) =>
        new Paragraph({
          alignment: align,
          spacing: { line: 276, lineRule: "auto" },
          children: [new TextRun({ text: String(t), font: fontObj, size: 20, bold: isHeader })],
        })
    ),
  });
}
function makeTable(headers, rows, colWidths) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
  const borders = { top: border, left: border, bottom: border, right: border,
    insideHorizontal: border, insideVertical: border };
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => cell(h, colWidths[i], { header: true })),
  });
  const dataRows = rows.map(
    (r) => new TableRow({ children: r.map((c, i) => cell(c, colWidths[i], {})) })
  );
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colWidths,
    borders,
    rows: [headerRow, ...dataRows],
  });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ====================================================================
// 封面
// ====================================================================
function buildCover() {
  const titleRun = (text, sz) => new TextRun({ text, font: fontObj, size: sz, bold: true });
  const fieldLine = (label, value) =>
    new Paragraph({
      spacing: { line: 480, lineRule: "auto", before: 80, after: 80 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: label, font: fontObj, size: 28, bold: true }),
        new TextRun({ text: value, font: fontObj, size: 28, bold: true, underline: { type: "single" } }),
      ],
    });
  return [
    blank(), blank(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 400 },
      children: [titleRun("数据库应用课程设计报告", 72)],
    }),
    blank(), blank(),
    fieldLine("题  目：", "AlignSync 车轮定位仪生产协同管理系统"),
    fieldLine("学  院：", "【请填写学院名称】"),
    fieldLine("专  业：", "【请填写专业名称】"),
    fieldLine("班  级：", "【请填写班级】"),
    fieldLine("组长学号：", "【请填写组长学号】"),
    fieldLine("组长姓名：", "【请填写组长姓名】"),
    fieldLine("组员1学号：", "【请填写组员1学号】"),
    fieldLine("组员1姓名：", "【请填写组员1姓名】"),
    fieldLine("组员2学号：", "【请填写组员2学号】"),
    fieldLine("组员2姓名：", "【请填写组员2姓名】"),
    fieldLine("指导教师：", "【请填写指导教师姓名】"),
    blank(), blank(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [new TextRun({ text: "【请填写】年【请填写】月【请填写】日", font: fontObj, size: 28, bold: true })],
    }),
    pageBreak(),
  ];
}

// ====================================================================
// 目录
// ====================================================================
function buildTOC() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240 },
      children: [new TextRun({ text: "目  录", font: fontObj, size: 36, bold: true })],
    }),
    new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),
    pageBreak(),
  ];
}

// ====================================================================
// 1 项目描述
// ====================================================================
function buildChapter1() {
  return [
    h1("1 项目描述"),
    h2("1.1 项目背景"),
    body("车轮定位仪是汽车维修与检测行业的关键设备，用于测量车辆四轮的定位参数（如外倾角、前束角、主销后倾角等），以保证车辆行驶安全性与轮胎使用寿命。一台完整的车轮定位仪由定位仪软件、若干工业相机、目标靶及机械结构组成，其中核心零部件（相机与软件锁）由专业技术企业研发生产，整机由定位仪生产厂组装制造。"),
    body("在实际产业链中，核心技术企业（如智核科技有限公司）负责相机的组装标定与软件锁授权，定位仪生产厂（如精工定位仪制造厂）向技术企业采购相机和软件锁后组装成整机对外销售。然而，两家企业之间的业务协同长期依赖邮件、电话与线下台账，存在如下痛点：一是相机标定参数（内参/外参）与软件锁授权信息分散在各自系统中，数据割裂、传递失真；二是采购、付款、发货、收货流程跨企业流转，对账低效、状态难追踪；三是整机出产后缺乏从零部件到成品的完整追溯链条，售后质量问题难以定位根因。"),
    body("基于上述背景，本项目开发一套车轮定位仪生产协同管理系统（AlignSync），通过统一平台打通两家企业的业务流程，实现从核心零部件生产、采购、付款、发货、收货、整机组装到售后追溯的全生命周期闭环管理。"),
    h2("1.2 开发意义与技术要求"),
    body("本系统的开发意义体现在三个方面：业务层面，实现跨企业业务流程数字化协同，提升采购对账与发货效率；数据层面，建立相机标定参数与软件锁授权的统一数据源，消除数据孤岛；质量层面，构建基于设备物料清单（BOM）的全链路追溯体系，支撑售后质量根因分析。"),
    body("系统的技术要求如下：采用 B/S 架构，用户通过浏览器即可访问，无需安装客户端；后端采用异步框架以支撑高并发查询；数据库需支持事务一致性以保障订单-付款-发货流程的资金与物流安全；系统须具备全链路追溯能力，任意设备可通过序列号反查其零部件来源、组装人与组装时间；权限按企业、角色、权限三级管控，确保跨企业数据隔离与最小权限原则。"),
    h2("1.3 处理数据的特征"),
    body("本系统处理的数据具有以下特征：一是以结构化业务数据为主，包括企业、用户、订单、付款、发货、设备等实体及其关联关系，数据量大、关系复杂，适合关系数据库存储；二是包含半结构化技术参数，如相机内参（fx/fy/cx/cy/畸变系数）与外参（旋转矩阵/平移向量）为嵌套结构，软件锁功能列表为变长数组，本系统采用 MySQL 的 JSON 类型存储，兼顾灵活性与查询效率；三是数据具有强时序性与状态驱动特征，订单、付款、发货、设备等均有状态机流转，需记录操作人与时间戳以满足审计与追溯要求。"),
    h2("1.4 技术标准体系、产业政策与法律法规对工程活动的影响"),
    body("车轮定位仪属汽车检测维修设备，其设计与生产须遵循相关技术标准体系。我国《GB/T 31480—2015 汽车车轮定位仪技术条件》规定了车轮定位仪的术语、技术要求与试验方法，本系统在相机标定参数存储与设备型号管理设计上参照该标准的数据规范。相关计量规范要求检测设备具备可追溯性，本系统通过 device_bom 表与追溯存储过程满足零部件到成品的追溯要求。"),
    body("在信息安全方面，系统遵循《信息安全技术 网络安全等级保护基本要求》（GB/T 22239）的等级保护理念，采用 JWT 令牌认证、RBAC 角色权限控制与密码 bcrypt 哈希存储，保障身份认证与访问控制安全。在数据合规方面，系统收集的用户姓名、手机号、邮箱等个人信息受《中华人民共和国个人信息保护法》约束，本系统仅采集业务必需信息并按企业隔离，不向第三方共享；《中华人民共和国数据安全法》要求数据处理活动遵循合法、正当、必要原则，本系统通过操作时间戳、审计字段与权限分级落实数据全生命周期管理。产业政策层面，国家推动制造业数字化转型的政策导向促使企业采用协同平台替代传统台账，本系统的建设契合制造业“两化融合”发展方向。"),
    pageBreak(),
  ];
}

// ====================================================================
// 2 系统需求分析
// ====================================================================
function buildChapter2() {
  const roleRows = [
    ["核心技术企业", "相机生产人员", "camera_producer", "相机组装、标定数据同步、设备查看"],
    ["核心技术企业", "软件管理员", "software_admin", "软件锁授权同步、授权信息管理"],
    ["核心技术企业", "业务员", "business_staff", "订单确认/驳回、发货、售后处理"],
    ["核心技术企业", "财务人员", "finance_staff", "收款确认、金额异常标记"],
    ["核心技术企业", "质量人员", "quality_staff", "质量追溯、统计查看、售后查看"],
    ["定位仪生产厂", "采购员", "purchaser", "采购订单、付款、收货、售后申请"],
    ["定位仪生产厂", "组装人员", "assembler", "设备组装登记、BOM 维护、追溯查询"],
    ["定位仪生产厂", "生产厂管理员", "manufacturer_admin", "生产厂系统管理、全模块查看"],
  ];
  const brRows = [
    ["BR-CAM-001", "相机SN全局唯一"],
    ["BR-CAM-002", "标定数据必须完整（内参、外参）"],
    ["BR-SW-001", "一个软件锁同一时间只能授权给一个生产厂"],
    ["BR-PO-001", "订单编号格式：PO+yyyyMMdd+4位流水号"],
    ["BR-PO-002", "软件采购时必须指定具体功能版本"],
    ["BR-PO-003", "订单确认后不可修改，只能补充"],
    ["BR-FIN-001", "付款金额必须等于订单总额"],
    ["BR-SHIP-001", "软件锁发货时必须记录目标生产厂"],
    ["BR-RCV-001", "收货确认后7天内可发起退换货申请"],
    ["BR-ASM-001", "一台定位仪至少使用2个相机"],
    ["BR-ASM-002", "设备SN全局唯一"],
    ["BR-ASM-003", "一个软件锁只能绑定一台定位仪"],
    ["BR-QRY-001", "追溯信息保留时间不少于10年"],
  ];
  return [
    h1("2 系统需求分析"),
    h2("2.1 调查方法与设计目标"),
    body("需求分析阶段采用现场调研与流程梳理相结合的方法：深入核心技术企业与定位仪生产厂，访谈相机生产、软件授权、采购、财务、组装等岗位人员，梳理现有业务流程与痛点；收集采购订单、付款凭证、发货单、设备档案等纸质与电子台账，归纳数据实体与流转关系。"),
    body("系统设计目标为：构建覆盖“核心零部件生产→采购→付款→发货→收货→整机组装→追溯→售后”全生命周期的闭环管理平台；实现两家企业间业务数据贯通与状态实时同步；建立基于 BOM 的设备全链路追溯体系；支持按时间、型号、企业等多维度统计汇总；提供细粒度的企业级、角色级权限管控。"),
    h2("2.2 用户角色矩阵"),
    body("系统涉及两类企业共 8 种角色，各角色的职责与权限分配如表 2-1 所示。"),
    caption("表 2-1 用户角色矩阵"),
    makeTable(["所属企业", "角色名称", "角色编码", "主要职责"], roleRows, [1800, 1500, 1900, 3826]),
    blank(),
    h2("2.3 核心功能用例"),
    body("系统实现 10 个核心业务用例，覆盖车轮定位仪生产协同的完整流程，各用例编号、名称与说明如表 2-2 所示。"),
    caption("表 2-2 核心业务用例清单"),
    makeTable(
      ["用例编号", "用例名称", "参与者", "简要说明"],
      [
        ["UC-CAM-001", "相机信息同步", "相机生产人员", "同步相机标定数据到系统库存，状态置为在库"],
        ["UC-SW-001", "软件锁授权同步", "软件管理员", "同步软件锁授权信息并绑定到生产厂"],
        ["UC-PO-001", "提交采购订单", "采购员", "提交相机/软件锁采购订单，状态待确认"],
        ["UC-PO-002", "确认采购订单", "业务员", "确认或驳回订单，确认后通知付款"],
        ["UC-FIN-001", "订单付款", "采购员", "上传付款凭证完成付款，状态待收款确认"],
        ["UC-FIN-002", "收款确认", "财务人员", "核对到账后确认收款，通知发货"],
        ["UC-SHIP-001", "产品发货", "业务员", "创建发货单并扣减库存，通知生产厂"],
        ["UC-RCV-001", "收货确认", "采购员", "确认收货并申报差异，订单完成"],
        ["UC-ASM-001", "登记定位仪设备", "组装人员", "组装设备并建立 BOM 追溯关系"],
        ["UC-QRY-001", "查询设备追溯信息", "组装人员/质量人员", "查询设备完整生产追溯链条"],
      ],
      [1600, 1700, 2000, 3726]
    ),
    blank(),
    h3("2.3.1 用例主事件流示例（UC-PO-001 提交采购订单）"),
    body("参与者：定位仪生产厂采购员。前置条件：采购员已登录且拥有采购权限。后置条件：采购订单生成，状态为“待确认”。"),
    body("主事件流：1) 进入采购管理模块，点击新建采购订单；2) 选择订单类型（相机采购/软件采购）；3) 从产品目录中选择型号规格；4) 输入采购数量，系统计算预期总金额；5) 采购员确认订单信息并提交；6) 系统生成唯一订单编号（PO+yyyyMMdd+4位流水），通知核心技术企业业务员。其余用例的事件流结构类似，限于篇幅不再逐一展开。"),
    h2("2.4 数据存储需求与支撑模块"),
    body("数据存储需求：系统需持久化企业信息、用户与权限、产品目录、相机标定数据、软件锁授权、采购订单及明细、付款记录、发货单及明细、定位仪设备与 BOM、售后工单、通知消息等共 18 类实体数据。其中相机内参外参与软件锁功能列表采用 JSON 类型存储；订单、设备等实体需记录状态流转与操作审计字段（创建人、创建时间、更新时间）。"),
    body("支撑模块包括：权限管理子系统（企业、用户、角色、权限的分级管理，基于 RBAC 模型）；统计汇总模块（按时间段、产品型号、企业等维度汇总采购量、生产量、发货量、退货量）；售后管理模块（相机返修/更换/退货、软件升级/重新激活/更换/退货流程及状态追踪）。"),
    h2("2.5 业务规则清单"),
    body("系统关键业务规则如表 2-3 所示，这些规则在数据库约束与应用逻辑中共同保障数据一致性与业务合规。"),
    caption("表 2-3 业务规则清单"),
    makeTable(["规则编号", "规则说明"], brRows, [2000, 7026]),
    pageBreak(),
  ];
}

// ====================================================================
// 3 数据库的概念结构设计
// ====================================================================
function buildChapter3() {
  return [
    h1("3 数据库的概念结构设计"),
    body("概念结构设计阶段将需求分析得到的业务需求抽象为独立于具体 DBMS 的概念模型，采用实体-联系（E-R）方法描述系统的实体、属性与实体间联系。本设计采用 PowerDesigner 作为数据库设计辅助工具。"),
    h2("3.1 实体识别与属性说明"),
    body("经需求分析，系统识别出以下主要实体（对应 18 张数据表）："),
    body("（1）企业（enterprises）：记录核心技术企业与生产厂信息，属性包括企业名称、类型、联系人、联系电话、银行账号、开户行等。"),
    body("（2）用户（users）：系统操作人员，属性包括用户名、密码哈希、真实姓名、手机号、邮箱、所属企业、启用状态等。"),
    body("（3）角色（roles）与权限（permissions）：角色属性包括角色编码、显示名称、所属企业类型、描述；权限属性包括权限编码、名称、所属模块、描述。用户与角色、角色与权限均为多对多联系。"),
    body("（4）产品目录（products）：相机与软件锁产品目录，属性包括产品编码、名称、类别、型号、规格、单价、功能版本列表（JSON）、启用状态。"),
    body("（5）相机（cameras）：相机实体含内部编号、序列号、型号、内参（JSON）、外参（JSON）、状态、持有企业、同步操作人。"),
    body("（6）软件锁（software_locks）：软件锁实体含锁编号、软件版本、功能版本、功能列表（JSON）、到期时间、状态、绑定企业、绑定设备。"),
    body("（7）车轮定位仪设备（wheel_aligners）：整机设备含设备序列号、名称、型号、组装企业、绑定软件锁、状态、组装人、组装时间。"),
    body("（8）采购订单（purchase_orders）与订单明细（order_items）：订单含订单号、类型、采购企业、状态、总金额、确认人、创建人等；明细含产品、数量、单价、确认数量、已发/已收数量。"),
    body("（9）付款记录（payments）：含订单、金额、付款方式、付款账户、付款日期、凭证路径、状态、确认人。"),
    body("（10）发货单（shipments）与发货明细（shipment_items）：发货单含订单、物流公司、物流单号、目标企业、发货人、状态；明细含发货单、订单明细、类型、序列号、关联相机/软件锁。"),
    body("（11）设备物料清单（device_bom）：记录设备与相机/软件锁的组成关系，含设备、物料类型、相机、软件锁、位置标签。"),
    body("（12）售后工单（after_sales_tickets）：含工单号、类型、分类、物料序列号、关联相机/软件锁/设备、发起企业、标题、描述、状态、处理人。"),
    body("（13）通知消息（notifications）：含接收用户/企业、标题、内容、类型、已读状态、关联对象。"),
    h2("3.2 实体间联系"),
    body("系统实体间联系按基数分类如下："),
    h3("3.2.1 一对一联系（1:1）"),
    body("车轮定位仪设备与软件锁为 1:1 绑定关系：一台设备绑定一个软件锁（wheel_aligners.software_lock_id），一个软件锁只能绑定一台设备（software_locks.bound_device_id，循环外键）。"),
    h3("3.2.2 一对多联系（1:N）"),
    body("企业—用户（一个企业多个用户）；用户—相机同步（一个用户同步多台相机）；企业—订单（一个企业多个采购订单）；订单—订单明细（一个订单多个明细）；订单—付款（一个订单多条付款记录）；订单—发货单（一个订单多次发货）；发货单—发货明细；设备—BOM（一台设备多个物料）；企业—售后工单；用户—通知等均为 1:N 联系。"),
    h3("3.2.3 多对多联系（M:N）"),
    body("用户—角色（通过 user_roles 关联表实现 M:N）；角色—权限（通过 role_permissions 关联表实现 M:N）。"),
    h2("3.3 E-R 图"),
    body("本系统的 E-R 图通过 PowerDesigner 对数据库 SQL 脚本进行反向工程生成，可直观展示全部实体、属性及实体间的联系关系，作为课程设计验收依据之一。"),
    placeholder("【请将 能够生成整个项目的数据库的SQL语句.sql 导入 PowerDesigner，通过 Database → Reverse Engineer → 选择 SQL 脚本文件 → 生成 Conceptual/Physical Data Model，并将 ER 图导出为图片后插入此处】"),
    caption("图 3-1 系统全局 E-R 图（PowerDesigner 反向工程生成）"),
    pageBreak(),
  ];
}

// ====================================================================
// 4 数据库的逻辑设计和物理设计
// ====================================================================
function buildChapter4() {
  const schemaRows = [
    ["enterprises", "企业", "id → name, type, contact_person, contact_phone, bank_account, bank_name"],
    ["roles", "角色", "id → name, display_name, enterprise_type, description"],
    ["permissions", "权限", "id → code, name, module, description"],
    ["products", "产品目录", "id → code, name, category, model, spec, price, function_versions, is_active"],
    ["users", "用户", "id → username, password_hash, real_name, phone, email, enterprise_id(FK)"],
    ["user_roles", "用户-角色", "(user_id(FK), role_id(FK))"],
    ["role_permissions", "角色-权限", "(role_id(FK), permission_id(FK))"],
    ["cameras", "相机", "id → internal_id, sn, model, intrinsics, extrinsics, status, enterprise_id(FK), synced_by(FK)"],
    ["software_locks", "软件锁", "id → lock_id, software_version, function_version, function_list, expire_date, status, bound_enterprise_id(FK), bound_device_id(FK)"],
    ["wheel_aligners", "定位仪设备", "id → device_sn, device_name, model, enterprise_id(FK), software_lock_id(FK), status, assembled_by(FK)"],
    ["purchase_orders", "采购订单", "id → order_no, order_type, enterprise_id(FK), status, total_amount, confirmed_by(FK), created_by(FK)"],
    ["order_items", "订单明细", "id → order_id(FK), product_id(FK), product_name, product_model, quantity, unit_price, shipped_quantity, received_quantity"],
    ["payments", "付款记录", "id → order_id(FK), amount, payment_method, payment_date, voucher_path, status, confirmed_by(FK), created_by(FK)"],
    ["shipments", "发货单", "id → order_id(FK), logistics_company, tracking_no, target_enterprise_id(FK), shipped_by(FK), status"],
    ["shipment_items", "发货明细", "id → shipment_id(FK), order_item_id(FK), item_type, item_sn, camera_id(FK), software_lock_id(FK)"],
    ["device_bom", "设备BOM", "id → device_id(FK), item_type, camera_id(FK), software_lock_id(FK), position_label"],
    ["after_sales_tickets", "售后工单", "id → ticket_no, type, category, item_sn, camera_id(FK), software_lock_id(FK), device_id(FK), enterprise_id(FK), status"],
    ["notifications", "通知", "id → user_id(FK), enterprise_id(FK), title, content, type, is_read, related_type, related_id"],
  ];
  return [
    h1("4 数据库的逻辑设计和物理设计"),
    h2("4.1 E-R 图向关系模式的转换"),
    body("将概念设计阶段的 E-R 图转换为关系模型，遵循“实体→关系、1:N 联系→外键并入 N 端、M:N 联系→独立关联表、1:1 联系→任一端外键”的转换规则。转换后得到 18 个关系模式，主键以箭头左侧标注，外键以 (FK) 标注，如表 4-1 所示。"),
    caption("表 4-1 系统关系模式（主键 → 属性，FK 表示外键）"),
    makeTable(
      ["关系模式", "说明", "主键 → 主要属性"],
      schemaRows,
      [1900, 1500, 5626]
    ),
    blank(),
    h2("4.2 规范化分析与范式满足情况"),
    body("本系统所有关系模式均满足第三范式（3NF），即每个非主属性既不部分依赖于候选键，也不传递依赖于候选键。具体分析如下："),
    body("（1）消除部分依赖：所有非主属性均完全依赖于主键。例如 order_items 的 product_name、product_model 字段看似可由 product_id 推导，但作为订单快照冗余存储，目的是在产品目录变更后保留历史订单的产品信息，属于有意为之的反规范化设计，并在订单创建时写入快照，后续不再随产品表更新。"),
    body("（2）消除传递依赖：各关系模式的非主属性之间不存在传递依赖。例如 users 表中 enterprise_id 为外键，企业详细信息（name、contact 等）存于 enterprises 表，users 表不冗余企业名称，避免传递依赖。"),
    body("（3）关联表规范化：user_roles 与 role_permissions 采用复合主键（两外键组合），无冗余属性，满足 BCNF。"),
    body("（4）有意反规范化：order_items 冗余 product_name、product_model 作为订单快照；shipment_items 冗余 item_sn 便于发货单独立展示。这些反规范化均有明确业务理由（历史快照、查询效率），不破坏一致性。"),
    h2("4.3 物理设计"),
    h3("4.3.1 存储引擎与字符集"),
    body("所有表采用 InnoDB 存储引擎，支持事务、行级锁与外键约束，满足订单-付款-发货流程对事务一致性的要求。字符集统一为 utf8mb4、排序规则 utf8mb4_unicode_ci，以支持中文与 emoji 字符的正确存储与比较。会话时区设置为 '+08:00'，保证 NOW()、CURDATE() 与业务时间一致。"),
    h3("4.3.2 索引设计"),
    body("索引设计遵循“外键列必建索引、高频查询列建索引、状态/时间列建索引”原则：为所有外键列创建索引（如 idx_users_enterprise_id）；为状态流转查询创建索引（如 idx_purchase_orders_status）；为时间范围查询创建索引（如 idx_purchase_orders_created_at）；为物流单号等精确查询创建索引（如 idx_shipments_tracking_no）。复合查询场景通过单列索引组合优化，避免过多复合索引增加写入开销。"),
    h3("4.3.3 JSON 字段使用"),
    body("相机内参（intrinsics）、外参（extrinsics）与软件锁功能列表（function_list）、产品功能版本（function_versions）采用 JSON 类型存储。JSON 类型适合存储结构固定但字段较多的技术参数与变长数组，避免拆分过多子表，同时 MySQL 8.0 支持 JSON 路径查询（->、->>），可在应用层按需解析。"),
    h3("4.3.4 循环外键处理"),
    body("软件锁（software_locks）与定位仪设备（wheel_aligners）存在循环外键：设备表外键 software_lock_id 引用软件锁，软件锁表外键 bound_device_id 引用设备。处理方式为：建表时先创建 wheel_aligners 表的 software_lock_id 外键，软件锁表的 bound_device_id 字段先不加外键约束，待两张表创建完成后通过 ALTER TABLE 语句补充外键，从而规避循环依赖导致的建表失败。"),
    h3("4.3.5 视图、存储过程与触发器"),
    body("物理设计阶段还设计了 3 个视图（v_device_traceability 设备追溯、v_order_summary 订单汇总、v_camera_inventory 相机库存统计）以简化复杂查询并屏蔽数据库结构细节；2 个存储过程（sp_generate_order_no 订单号生成、sp_device_traceability 设备追溯查询）封装业务逻辑；1 个触发器（trg_enterprises_updated_at）自动维护更新时间字段，其余带 updated_at 的表可按相同模式扩展。"),
    pageBreak(),
  ];
}

module.exports = {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, TableOfContents, HeadingLevel,
  BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  fontObj, FONT_CN, FONT_EN, CONTENT_W, PAGE_W, PAGE_H, MARGIN,
  body, bodyFlat, h1, h2, h3, code, placeholder, caption, blank, cell, makeTable, pageBreak,
  buildCover, buildTOC, buildChapter1, buildChapter2, buildChapter3, buildChapter4,
};
