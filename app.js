/* ============================================================
   Aneko动漫社 · 站点脚本 app.js
   ------------------------------------------------------------
   纯原生 JavaScript，无需任何依赖、无需构建。
   文件结构（按顺序阅读即可）：
     1. 基础工具（DOM / 转义 / 图标 / 日期）
     2. 演示数据 DEFAULTS      —— 想改文案？直接改这里的数据
     3. 存储层 Store           —— localStorage 读写 + 版本合并
     4. 媒体库 MediaDB        —— IndexedDB 存图片/视频（大文件也能存）
     5. 通用 UI 组件           —— 提示、弹窗、确认框、图片占位框
     6. 主题 / 粒子 / 倒计时
     7. 页面渲染（前台）
     8. 后台管理
     9. 路由与启动
   ============================================================ */
"use strict";

/* ============ 1. 基础工具 ============ */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

/** HTML 转义：所有用户输入都必须经过它再插入页面，防止 XSS */
function esc(v) {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
/** 把纯文本里的换行转成 <br>（已转义，安全） */
const nl2br = (v) => esc(v).replace(/\r?\n/g, "<br>");

/** 生成唯一 id */
function uid(prefix) {
  return (prefix || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* --- 图标（内联 SVG，无需图标库） --- */
const ICONS = {
  calendar: "M3 4h18v17H3zM8 2v4M16 2v4M3 10h18",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  user: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.1a4 4 0 0 1 0 7.75",
  heart: "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z",
  mail: "M2 4h20v16H2zM22 7l-9 5.7a2 2 0 0 1-2 0L2 7",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2z",
  image: "M3 3h18v18H3zM9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4M21 15l-5-5L5 21",
  video: "M23 7l-7 5 7 5zM1 5h15v14H1z",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
  check: "M20 6L9 17l-5-5",
  close: "M18 6L6 18M6 6l12 12",
  plus: "M12 5v14M5 12h14",
  edit: "M11 4H4v16h16v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3",
  back: "M19 12H5M12 19l-7-7 7-7",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  file: "M14 2H6v20h12V6zM14 2v4h4",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15a2 2 0 0 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 4.6V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.8H21a2 2 0 1 1 0 4z",
  chart: "M3 3v18h18M7 15v3M12 9v9M17 5v13",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13l3.5 7v7H2v-7z",
  play: "M5 3l14 9-14 9z",
  sparkle: "M12 3l1.9 5.8L20 12l-6.1 3.2L12 21l-1.9-5.8L4 12l6.1-3.2z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  menu: "M3 6h18M3 12h18M3 18h18",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  brush: "M9.06 11.9 20.5.5M3 21c3 0 7-1 7-8 0-2 1-4 4-4M6 15l3 3",
  gamepad: "M6 12h4M8 10v4M15 13h.01M18 11h.01M17.3 5H6.7a4.7 4.7 0 0 0-4.6 3.9L1 16a3 3 0 0 0 5.3 2.2L8 16h8l1.7 2.2A3 3 0 0 0 23 16l-1.1-7.1A4.7 4.7 0 0 0 17.3 5z",
  spark: "M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18",
};
function ic(name, cls) {
  const d = ICONS[name] || ICONS.sparkle;
  return '<svg viewBox="0 0 24 24" class="ico ' + (cls || "") + '" aria-hidden="true"><path d="' + d + '"/></svg>';
}

/* --- 日期工具 --- */
const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const pad2 = (n) => String(n).padStart(2, "0");
/** 今天 00:00（本地时区） */
function today0() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
/** 相对今天偏移 n 天的 00:00，返回 yyyy-mm-dd */
function isoShift(days) {
  const d = today0();
  d.setDate(d.getDate() + days);
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}
function parseDate(v) {
  if (!v) return null;
  const d = new Date(String(v).replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}
function fmtDate(v) {
  const d = parseDate(v);
  if (!d) return "待定";
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}
function fmtDateTime(v) {
  const d = parseDate(v);
  if (!d) return "待定";
  return fmtDate(v) + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
}
/** 中文友好时间：2026年6月12日（周五）18:30 */
function fmtCN(v, withWeek) {
  const d = parseDate(v);
  if (!d) return "待定";
  return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日" +
    (withWeek ? "（" + WEEK[d.getDay()] + "）" : "") + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
}
function fmtDay(v) {
  const d = parseDate(v);
  if (!d) return { day: "--", mon: "--" };
  return { day: pad2(d.getDate()), mon: (d.getMonth() + 1) + "月" };
}
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
/** 活动状态：upcoming / ongoing / ended */
function eventState(ev) {
  const now = new Date();
  const s = parseDate(ev.start);
  const e = parseDate(ev.end) || s;
  if (!s) return "upcoming";
  if (now < s) return "upcoming";
  if (now > new Date(e.getTime() + 3600 * 1000)) return "ended";
  return "ongoing";
}
const STATE_TEXT = { upcoming: "即将开始", ongoing: "进行中", ended: "已结束" };
/** 相对时间：3 天前 / 2 小时后 */
function relTime(v) {
  const d = parseDate(v);
  if (!d) return "";
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const txt = mins < 60 ? mins + " 分钟" : mins < 1440 ? Math.round(mins / 60) + " 小时" : Math.round(mins / 1440) + " 天";
  return diff >= 0 ? txt + "后" : txt + "前";
}

/* ============ 2. 演示数据（想改文案直接改这里） ============ */
const DEMO = {
  site: {
    name: "Aneko动漫社",
    nameEn: "Aneko Anime Club",
    slogan: "欢迎来到二次元的世界",
    intro: "我们是一群热爱动漫文化的伙伴，在这里分享快乐、结交朋友，一起探索二次元的世界。",
    story: [
      "Aneko动漫社成立于 2019 年 9 月，最初只是六个同班同学凑在一起追番的小圈子。七年过去，我们已经是校内规模最大的二次元社团之一，覆盖动画、漫画、游戏、绘画、Cosplay、音游和同人创作七个方向。",
      "我们相信「喜欢」本身就值得被认真对待：每一场观影会的片单都经过讨论，每一次外拍都有完整的分镜和后勤，每一份投稿都会得到认真回复。这里没有「太宅了」的评判，只有「要不要一起」的邀请。",
      "社团固定每周三晚在活动中心开放「动画鉴赏夜」，每月一次绘画或摄影工坊，每学期一场面向全校的大型活动。无论你是十年的老宅还是刚刚入坑的新人，都能在这里找到同频的人。",
    ],
    founded: "2019 年 9 月",
    members: 186,
    email: "hello@aneko.club",
    phone: "138-0000-0000",
    qq: "812345678",
    place: "大学生活动中心 3 楼 305 社团活动室",
    meeting: "每周三 19:00 - 21:30（动画鉴赏夜）",
    joinDeadline: isoShift(24),
    joinNote: "本轮招新面向全校 2026 级新同学及在校生，线上报名后我们会在 48 小时内联系你。",
    adminPassword: "admin123",
  },
  benefits: [
    { icon: "users", title: "结交同好", desc: "认识志同道合的动漫爱好者，一起追番、讨论、创作。" },
    { icon: "brush", title: "提升技能", desc: "绘画、摄影、Cosplay、视频剪辑等多种技能工坊免费参加。" },
    { icon: "spark", title: "丰富活动", desc: "观影会、漫展摊位、Cosplay 大赛、音游友谊赛轮流上线。" },
    { icon: "heart", title: "专属福利", desc: "社团周边、活动优先参与权、嘉宾分享会名额。" },
    { icon: "image", title: "展示平台", desc: "作品墙、舞台表演、创作分享，让你的作品被更多人看到。" },
    { icon: "music", title: "快乐源泉", desc: "在忙碌的学业之余，找到属于自己的二次元乐园。" },
  ],
  reasons: [
    { q: "加入社团需要什么条件？", a: "没有任何门槛。只要你喜欢动漫、漫画、游戏或相关创作，就是我们需要的人。不需要会画画，也不需要会 Cos，带着兴趣来就够了。" },
    { q: "加入社团需要缴费吗？", a: "社团本身不收取会费。只有涉及外出漫展、包车、统一服装等产生实际成本的活动中会按成本分摊，且完全自愿参加。" },
    { q: "没有特长可以加入吗？", a: "当然可以。社团里有大量「纯观众」成员，正是你们的参与让创作者有动力继续产出。想学的话，工坊随时欢迎你来。" },
    { q: "活动一般在什么时间？", a: "固定活动是每周三晚 19:00-21:30 的动画鉴赏夜；大型活动和工坊通常安排在周末下午，会提前一周在公告栏和 QQ 群通知。" },
  ],
  carousel: [
    { id: "slide_1", title: "Aneko动漫社", sub: "欢迎来到二次元的世界", eyebrow: "Club Profile", img: "", media: "", link: "#/about", btn: "了解社团" },
    { id: "slide_2", title: "2026 秋季招新进行中", sub: "线上报名已开启，48 小时内联系你", eyebrow: "Recruitment", img: "", media: "", link: "#/join", btn: "立即报名" },
    { id: "slide_3", title: "作品墙正在征集", sub: "插画、摄影、Cos、视频、手工，全都欢迎投稿", eyebrow: "Gallery", img: "", media: "", link: "#/upload", btn: "上传作品" },
  ],
  events: [
    { id: "ev_1", title: "每周动画鉴赏夜 · 春番精选", category: "观影会", start: isoShift(1) + "T19:00", end: isoShift(1) + "T21:30", place: "活动中心 305 社团活动室", capacity: "不限人数", organizer: "放映部", summary: "本季新番一口气看四集，边看边聊，现场提供投影与零食。", content: "每周三晚上的固定节目。本次放映会从本季讨论度最高的三部新番里各选一集连播，中间穿插十分钟的自由讨论环节。\n\n流程安排：\n19:00 开场与本周番剧快讯\n19:20 第一集放映\n19:45 自由讨论\n20:00 第二集放映\n20:25 抽奖与小食时间\n20:40 第三集放映\n21:10 结束、下期预告\n\n无需报名，直接来即可。第一次来的同学进门找佩戴青色工作牌的同学，我们会带你入座。", img: "" },
    { id: "ev_2", title: "配音大赛 · 声临其境", category: "比赛", start: isoShift(9) + "T14:00", end: isoShift(9) + "T17:30", place: "图书馆报告厅", capacity: "限 60 人", organizer: "外联部", summary: "自选片段现场配音，评委打分，前三名有周边大礼包。", content: "一年一度的配音大赛来啦！\n\n规则：\n1. 自选一段 1-3 分钟的动画 / 游戏片段，可以个人参赛也可以两人组队。\n2. 现场提供投影与音响，请把片段（无水印、含字幕）提前一天交给外联部。\n3. 评委由社团前辈 + 话剧社同学组成，从还原度、情绪和舞台表现三方面打分。\n\n奖品：\n冠军 手办一只 + 社团定制周边全套\n亚军 声优签名台本\n季军 定制水杯与徽章\n所有参赛者都有参赛证明与纪念徽章。\n\n报名截止到活动前一天 22:00，名额 60 人，报满即止。", img: "" },
    { id: "ev_3", title: "夏日 ACG 漫展 · 社团摊位", category: "漫展", start: isoShift(16) + "T09:30", end: isoShift(16) + "T17:00", place: "市会展中心 B2 馆（统一乘车）", capacity: "限 40 人", organizer: "组织部", summary: "社团统一出摊，售卖同人本与周边，报名可参与布展。", content: "今年的夏日 ACG 漫展我们申请到了两个摊位！\n\n安排：\n08:00 校门口集合，统一包车出发\n09:30 到达、布展\n10:00 展位开放（摊位号 B2-47 / B2-48）\n12:00 午休，自由逛展\n14:00 社团舞台节目《声之形》串烧\n17:00 撤展、统一返回\n\n报名须知：\n- 名额 40 人，车费与门票统一收取（社员八折）。\n- 想参与摊位售卖的同学请在报名备注里写明要寄卖的作品与价格。\n- 当天请穿社团定制 T 恤或佩戴徽章，便于互相认领。", img: "" },
    { id: "ev_4", title: "绘画工坊 · 赛璐璐上色实战", category: "工坊", start: isoShift(23) + "T14:00", end: isoShift(23) + "T17:00", place: "艺术楼 402 画室", capacity: "限 24 人", organizer: "绘画部", summary: "从线稿到成图，手把手教你把赛璐璐风格画完。", content: "很多同学卡在「线稿画完了不知道该怎么上色」，这一期工坊就解决这个问题。\n\n你会学到：\n- 赛璐璐风格的光影分层逻辑\n- 皮肤、头发、布料的常用色板与叠色顺序\n- 高光与反光的克制用法\n- 导出前的色调统一与锐化\n\n请自带：笔记本电脑（安装好 CSP / SAI / PS 任一）、数位板；没有设备的同学可以现场借用社团的两台公用板。\n\n主讲：绘画部部长 白泽（作品见作品墙「插画」分类）。名额 24 人。", img: "" },
    { id: "ev_5", title: "Cosplay 外拍 · 校园夜景专场", category: "外拍", start: isoShift(30) + "T16:00", end: isoShift(30) + "T21:00", place: "老校区钟楼 & 图书馆长廊", capacity: "限 18 人", organizer: "Cos部", summary: "夜间灯光外拍，摄影师与 Coser 一对一配对。", content: "本学期的夜拍专场，主题是「霓虹与旧楼」。\n\n流程：\n16:00 集合、妆造检查与补妆\n16:30 钟楼前第一组\n18:00 简餐（社团提供）\n18:40 图书馆长廊灯光组\n20:30 收工、合影\n\n注意：\n- 摄影师 6 位，Coser 名额 12 位，按报名先后配对。\n- 请自备服装与假发；需要使用社团公用道具（刀、伞、灯笼）的请在备注说明。\n- 修图后统一发到社团云盘，优秀作品会进入作品墙。", img: "" },
    { id: "ev_6", title: "音游友谊赛 · 太鼓与 Project SEKAI", category: "比赛", start: isoShift(37) + "T13:30", end: isoShift(37) + "T18:00", place: "活动中心 108 多功能厅", capacity: "限 32 人", organizer: "音游部", summary: "双项目积分赛，新手组与高手组分开排名。", content: "音游部每个学期的保留项目。\n\n项目：\n- 太鼓达人（街机模拟器，双人对抗）\n- Project SEKAI（自备设备，指定曲目）\n\n赛制：积分制，预赛取前八进入决赛。新手组（难度 ≤ 26）与高手组（难度 ≥ 27）分开排名，两边都有奖品，保证新人不被劝退。\n\n奖品：\n高手组冠军 机械键盘\n新手组冠军 社团周边大礼包\n幸运观众抽奖 3 名\n\n观赛免费，欢迎来给朋友加油。", img: "" },
  ],
  posts: [
    { id: "po_1", title: "2026 秋季招新正式启动：线上报名通道已开启", date: isoShift(-1), pinned: true, tag: "招新", author: "组织部", cover: "", media: "", summary: "本轮招新面向全校同学，线上填表即可，48 小时内会有学长学姐联系你。", content: "各位同学：\n\nAneko动漫社 2026 年秋季招新正式开始。\n\n一、报名方式\n点击本站「加入我们」页面填写报名表，或扫描招新海报上的二维码。线上报名后会由组织部在 48 小时内联系你。\n\n二、招新方向\n绘画部、Cos部、摄影组、视频组、音游部、外联部、组织部，以及不参与具体事务的普通社员。没有特长也完全可以报名。\n\n三、现场咨询\n招新周期间，我们会在食堂门口与图书馆一楼设置咨询摊位，可以现场看往期作品和周边实物。\n\n四、常见问题\n不收费、不需要面试、不要求出勤。社团活动全部自愿参加。\n\n期待在活动室见到你。\n—— Aneko动漫社 组织部" },
    { id: "po_2", title: "配音大赛报名开始，冠军奖品已就位", date: isoShift(-4), pinned: false, tag: "比赛", author: "外联部", cover: "", summary: "「声临其境」配音大赛开放报名，限 60 人，冠军可获得正版手办。", content: "配音大赛「声临其境」即日起开放报名。\n\n时间：见活动日历\n地点：图书馆报告厅\n名额：60 人（可个人或双人组队）\n\n请把参赛片段（1-3 分钟，无水印）提前一天发送给外联部负责人。现场提供投影与音响，也可以自带笔记本电脑。\n\n评委由社团前辈与话剧社同学共同担任，评分维度为还原度 40%、情绪表达 40%、舞台表现 20%。\n\n冠军奖品为正版手办一只，亚军为声优签名台本，季军为社团定制周边。所有参赛者均有纪念徽章。" },
    { id: "po_3", title: "作品墙升级：现在支持视频投稿了", date: isoShift(-8), pinned: false, tag: "公告", author: "技术组", cover: "", summary: "作品展示页新增视频分类，支持本地上传（保存在你的浏览器）与 B 站 / YouTube 嵌入。", content: "作品展示页完成了一次升级：\n\n1. 新增「视频」分类，与插画、摄影、Cosplay、手工并列。\n2. 视频有两种投稿方式：直接上传本地视频文件，或填入 B 站 / YouTube 的链接自动嵌入播放器。\n3. 上传的本地视频保存在浏览器本地数据库（IndexedDB）中，刷新页面依然可以播放。\n\n注意：本作品墙运行在你的浏览器中，投稿内容不会自动同步给其他同学。想让大家都能看到，请把视频发到社团群或 B 站，再把链接填进来。\n\n—— 技术组", cover: "" },
    { id: "po_4", title: "活动室新规：结束后请把桌椅归位", date: isoShift(-12), pinned: false, tag: "通知", author: "秘书处", cover: "", summary: "因场地管理方反馈，即日起每次活动结束后由值日生负责复原场地。", content: "活动中心管理方反馈，近期多次发现 305 室桌椅未归位、垃圾未清理。\n\n即日起执行以下规定：\n1. 每次活动结束前 10 分钟，由当次活动的值日生负责清理桌面与地面。\n2. 桌椅按地面胶带标记归位，投影与音响断电收进柜子。\n3. 最后一组离开的同学负责关灯锁门。\n\n值日表由组织部在活动群里公布。感谢配合。", cover: "" },
    { id: "po_5", title: "社团云盘扩容完成，作品素材集中管理", date: isoShift(-18), pinned: false, tag: "公告", author: "技术组", cover: "", summary: "云盘扩容至 2TB，往期活动素材与作品原图已全部归档。", content: "社团云盘完成扩容，现容量 2TB，按年份与活动分类归档：\n\n/2024 /2025 /2026\n  └ 活动名 / 原片 / 精选 / 成品\n\n上传规则：\n- 原片请在活动结束后一周内上传，不要只发压缩图。\n- 精选目录由摄影组与视频组负责人维护。\n- 一切涉及个人肖像的照片，未获本人同意不得对外发布。\n\n云盘链接与账号密码已发在社团 QQ 群置顶消息中。", cover: "" },
    { id: "po_6", title: "十月新番前瞻：这几部值得蹲守", date: isoShift(-24), pinned: false, tag: "安利", author: "放映部", cover: "", summary: "放映部整理了本季度最值得期待的六部新番，附上无剧透推荐理由。", content: "放映部从本季 40 余部新番中挑了六部，按「必看 / 推荐 / 可以试试」三档整理。\n\n完整榜单已同步到「番剧安利」页面，那里还有社团成员的评分与一句话短评。\n\n本周三的鉴赏夜会从必看档里选两集首播，欢迎来现场一起看第一集。", cover: "" },
  ],
  works: [
    { id: "wk_1", title: "雨夜的电车", author: "白泽", category: "插画", date: isoShift(-2), status: "approved", desc: "练习雨天氛围的一张。光源参考了傍晚街道的霓虹，玻璃上的水痕用了三层叠加。", img: "", media: "", mime: "", link: "", featured: true },
    { id: "wk_2", title: "初音未来 · 演唱会应援", author: "小满", category: "Cosplay", date: isoShift(-5), status: "approved", desc: "服装自制，假发自己剪的。拍摄于学校礼堂，用了两支闪光灯加蓝色滤片。", img: "", media: "", mime: "", link: "", featured: true },
    { id: "wk_3", title: "社团活动室日常", author: "阿澈", category: "摄影", date: isoShift(-7), status: "approved", desc: "抓拍周三鉴赏夜散场前的一刻，桌上是吃了一半的零食和摊开的设定集。", img: "", media: "", mime: "", link: "", featured: true },
    { id: "wk_4", title: "MAD：三年份的社团回忆", author: "Kite", category: "视频", date: isoShift(-9), status: "approved", desc: "把三年活动素材剪成三分钟，BGM 用的是社团同学自己翻唱的曲子。外链播放演示。", img: "", media: "", mime: "", link: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", featured: true },
    { id: "wk_5", title: "手工：纸雕灯笼", author: "柚子", category: "手工", date: isoShift(-11), status: "approved", desc: "为夜拍活动做的道具，透光纸加 5V 灯带，一共做了四个，坏了两个。", img: "", media: "", mime: "", link: "", featured: false },
    { id: "wk_6", title: "夏日祭的摊位", author: "阿澈", category: "摄影", date: isoShift(-14), status: "approved", desc: "漫展第一天开摊前十分钟，桌面上的同人本还没摆整齐。", img: "", media: "", mime: "", link: "", featured: false },
    { id: "wk_7", title: "原创角色 · 沧月", author: "白泽", category: "插画", date: isoShift(-16), status: "approved", desc: "原创企划《潮汐纪》的主角设定。配色试了七版，最后选了低饱和的蓝灰。", img: "", media: "", mime: "", link: "", featured: false },
    { id: "wk_8", title: "外拍花絮 · 钟楼夜", author: "Kite", category: "视频", date: isoShift(-19), status: "approved", desc: "夜拍当天的花絮记录，含妆造过程和三次笑场。外链播放演示。", img: "", media: "", mime: "", link: "https://www.youtube.com/watch?v=ysz5S6PUM-U", featured: false },
    { id: "wk_9", title: "手工：粘土小挂件", author: "柚子", category: "手工", date: isoShift(-20), status: "approved", desc: "招新摊位送的小礼物，一共捏了六十个，手指到现在还酸。", img: "", media: "", mime: "", link: "", featured: false },
    { id: "wk_10", title: "音游部日常", author: "小满", category: "摄影", date: isoShift(-22), status: "approved", desc: "活动室角落的两台平板，屏幕上是没打过去的 32 级谱面。", img: "", media: "", mime: "", link: "", featured: false },
    { id: "wk_11", title: "待审核示例：新画的一张", author: "白泽", category: "插画", date: isoShift(-1), status: "pending", desc: "这条是「待审核」状态的示例，可以在后台作品审核里通过或拒绝它。", img: "", media: "", mime: "", link: "", featured: false },
  ],
  departments: [
    { id: "dp_1", name: "绘画部", icon: "brush", desc: "负责社团插画产出、同人本绘制与绘画工坊。每周一次线上互评，每月一次线下工坊。", duty: "插画创作 / 工坊教学 / 同人本" },
    { id: "dp_2", name: "Cos部", icon: "sparkle", desc: "负责 Cosplay 企划、妆造、服装道具制作与外拍统筹。有公用道具库和缝纫机一台。", duty: "妆造 / 道具制作 / 外拍统筹" },
    { id: "dp_3", name: "摄影组", icon: "camera", desc: "负责活动记录与作品拍摄，为 Cos 部提供一对一拍摄支持，管理社团云盘素材。", duty: "活动记录 / 人像外拍 / 素材归档" },
    { id: "dp_4", name: "视频组", icon: "video", desc: "负责 MAD / 花絮 / 活动纪录片的拍摄与剪辑，运营社团 B 站账号。", duty: "剪辑 / 调色 / 账号运营" },
    { id: "dp_5", name: "放映部", icon: "play", desc: "负责每周动画鉴赏夜的选片与放映，维护社团片单与设备。", duty: "选片 / 放映 / 设备维护" },
    { id: "dp_6", name: "音游部", icon: "gamepad", desc: "负责音游友谊赛与线下机房活动，组织校际交流。", duty: "赛事组织 / 曲目整理" },
    { id: "dp_7", name: "外联部", icon: "heart", desc: "负责对外联络、赞助洽谈与漫展摊位申请，是社团与外部沟通的窗口。", duty: "赞助 / 摊位申请 / 嘉宾邀请" },
    { id: "dp_8", name: "组织部", icon: "calendar", desc: "负责招新、活动排期、场地申请与值日安排，社团运转的中枢。", duty: "招新 / 排期 / 场地 / 值日" },
  ],
  members: [
    { id: "mb_1", name: "夜莺", role: "社长", dept: "组织部", intro: "入坑九年，最爱的作品是《钢之炼金术师》。负责社团整体统筹和场地对接。", avatar: "" },
    { id: "mb_2", name: "白泽", role: "绘画部部长", dept: "绘画部", intro: "画了七年赛璐璐，原创企划《潮汐纪》主笔。信条是「先把线稿画对」。", avatar: "" },
    { id: "mb_3", name: "小满", role: "Cos部部长", dept: "Cos部", intro: "服装道具自制派，做过 20 套以上。擅长用最便宜的材料做出最像的效果。", avatar: "" },
    { id: "mb_4", name: "阿澈", role: "摄影组组长", dept: "摄影组", intro: "人像与活动记录双修，社团云盘 300G 素材的守门人。", avatar: "" },
    { id: "mb_5", name: "Kite", role: "视频组组长", dept: "视频组", intro: "剪 MAD 出身，现在负责社团 B 站账号，最长的作品剪了 47 版。", avatar: "" },
    { id: "mb_6", name: "柚子", role: "手工担当", dept: "Cos部", intro: "粘土与纸雕爱好者，招新周边一大半出自她手。", avatar: "" },
    { id: "mb_7", name: "橙子", role: "外联部部长", dept: "外联部", intro: "谈过 6 家赞助，擅长把「预算不够」变成「用周边换」。", avatar: "" },
    { id: "mb_8", name: "沐白", role: "放映部负责人", dept: "放映部", intro: "片单收集癖，硬盘里存了 2T 动画，最爱的导演是新海诚。", avatar: "" },
  ],
  recommends: [
    { id: "rc_1", type: "番剧", title: "葬送的芙莉莲", score: 9.4, by: "夜莺", note: "把「时间」当作主题讲得最温柔的一部。看完第一集就会明白为什么大家都在哭。", link: "" },
    { id: "rc_2", type: "番剧", title: "孤独摇滚！", score: 9.2, by: "沐白", note: "社恐也能组乐队。演出分镜是近十年最好的，看完想立刻去练琴。", link: "" },
    { id: "rc_3", type: "番剧", title: "关于我转生变成史莱姆这档事", score: 8.3, by: "橙子", note: "下饭番天花板，世界观铺得很大但看着完全不累。", link: "" },
    { id: "rc_4", type: "番剧", title: "赛博朋克：边缘行者", score: 9.0, by: "Kite", note: "十集讲完一个完整的悲剧，配乐和色彩是教科书级别。谨慎追。", link: "" },
    { id: "rc_5", type: "游戏", title: "原神", score: 8.6, by: "小满", note: "美术和音乐的投入很难被超越，适合和朋友一起开图。", link: "" },
    { id: "rc_6", type: "游戏", title: "塞尔达传说：王国之泪", score: 9.6, by: "阿澈", note: "「如果能这样就好了」在这部里几乎都能实现，究极手是近十年最伟大的系统。", link: "" },
    { id: "rc_7", type: "游戏", title: "Project SEKAI", score: 8.8, by: "橙子", note: "音游部入坑首选，曲库更新稳定，谱面难度梯度对新手友好。", link: "" },
    { id: "rc_8", type: "游戏", title: "主播女孩重度依赖", score: 8.1, by: "柚子", note: "披着像素外衣的心理惊悚。玩之前请确认自己心态稳定。", link: "" },
    { id: "rc_9", type: "漫画", title: "电锯人", score: 8.9, by: "白泽", note: "分镜教科书。藤本树对「留白」的理解值得每个画手反复看。", link: "" },
    { id: "rc_10", type: "漫画", title: "蓝色时期", score: 8.7, by: "白泽", note: "艺考题材，画得很笨拙但特别真诚。想学画画的人看了会想立刻动笔。", link: "" },
  ],
  faqExtra: [],
};

/* ============ 3. 存储层 ============ */
const LS_KEY = "aneko_site_v1";
const Store = {
  data: null,
  /** 深度合并：以默认值为骨架，用存档覆盖，保证升级后新增字段不丢失 */
  merge(base, saved) {
    if (Array.isArray(base)) return Array.isArray(saved) ? saved : base.slice();
    if (base && typeof base === "object") {
      const out = {};
      const keys = new Set(Object.keys(base).concat(saved && typeof saved === "object" ? Object.keys(saved) : []));
      keys.forEach((k) => {
        out[k] = k in base ? this.merge(base[k], saved ? saved[k] : undefined) : saved[k];
      });
      return out;
    }
    return saved === undefined ? base : saved;
  },
  load() {
    let saved = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (e) { console.warn("读取本地数据失败，已使用默认内容", e); }
    this.data = this.merge(JSON.parse(JSON.stringify(DEMO)), saved || {});
    if (!Array.isArray(this.data.works)) this.data.works = [];
    return this.data;
  },
  save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.warn("保存失败（可能超出浏览器容量）", e);
      toast("保存失败：浏览器存储空间可能已满", "err");
      return false;
    }
  },
  /** 清空演示数据，恢复出厂内容 */
  reset() { try { localStorage.removeItem(LS_KEY); } catch (e) {} this.load(); },
  get site() { return this.data.site; },
};

/* ============ 4. 媒体库（IndexedDB：图片 + 视频都能存） ============ */
const MediaDB = {
  db: null, ready: false,
  open() {
    return new Promise((resolve) => {
      if (this.ready) return resolve(this.db);
      if (!("indexedDB" in window)) { this.ready = false; return resolve(null); }
      let req;
      try { req = indexedDB.open("aneko_media", 1); } catch (e) { return resolve(null); }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("files")) db.createObjectStore("files", { keyPath: "id" });
      };
      req.onsuccess = () => { this.db = req.result; this.ready = true; resolve(this.db); };
      req.onerror = () => { console.warn("IndexedDB 不可用，媒体将保存在内存中（刷新后丢失）"); resolve(null); };
    });
  },
  /** 保存一个 File/Blob，返回媒体 key */
  async put(file) {
    const key = uid("m");
    const rec = { id: key, name: file.name || key, type: file.type || "", size: file.size || 0, blob: file, at: Date.now() };
    const db = await this.open();
    if (!db) { this.mem = this.mem || {}; this.mem[key] = rec; return key; }
    return new Promise((resolve) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(rec);
      tx.oncomplete = () => resolve(key);
      tx.onerror = () => { console.warn("媒体写入失败"); resolve(""); };
    });
  },
  async get(key) {
    if (!key) return null;
    if (this.mem && this.mem[key]) return this.mem[key];
    const db = await this.open();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction("files", "readonly");
      const r = tx.objectStore("files").get(key);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => resolve(null);
    });
  },
  async remove(key) {
    if (!key) return;
    if (this.mem) delete this.mem[key];
    const db = await this.open();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  },
  /** 取媒体 URL：blob URL 会被缓存，避免重复创建 */
  cache: {},
  async url(key) {
    if (!key) return "";
    if (this.cache[key]) return this.cache[key];
    const rec = await this.get(key);
    if (!rec || !rec.blob) return "";
    const u = URL.createObjectURL(rec.blob);
    this.cache[key] = u;
    return u;
  },
  async info(key) {
    const rec = await this.get(key);
    return rec ? { type: rec.type, size: rec.size, name: rec.name } : null;
  },
};

/** 把任意视频链接转成可嵌入的播放地址（支持 B 站 / YouTube / 直链） */
function toEmbed(url) {
  const u = String(url || "").trim();
  if (!u) return { kind: "", src: "" };
  // B 站：https://www.bilibili.com/video/BV1xx411c7mD  |  av 号
  let m = u.match(/bilibili\.com\/video\/(BV[0-9A-Za-z]+|av\d+)/i) || u.match(/^(BV[0-9A-Za-z]{10,}|av\d+)$/i);
  if (m) {
    const id = m[1];
    const param = /^BV/i.test(id) ? "bvid=" + id : "aid=" + id.replace(/^av/i, "");
    return { kind: "bili", src: "//player.bilibili.com/player.html?" + param + "&autoplay=0&high_quality=1&danmaku=0" };
  }
  // YouTube：watch?v=xxx | youtu.be/xxx | /embed/xxx
  m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i) || u.match(/^([\w-]{11})$/);
  if (m) return { kind: "yt", src: "https://www.youtube.com/embed/" + m[1] };
  // 直链视频
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(u)) return { kind: "file", src: u };
  // 其他链接（腾讯视频、优酷等）直接给出跳转卡片
  return { kind: "link", src: u };
}


/* ============ 5. 通用 UI 组件 ============ */
/** 轻提示 */
function toast(msg, type) {
  const root = $("#toastRoot");
  if (!root) return;
  const el = document.createElement("div");
  el.className = "toast " + (type || "");
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .3s, transform .3s";
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    setTimeout(() => el.remove(), 320);
  }, 2200);
}

/** 弹窗 */
function openModal(html, wide) {
  const box = $("#modalBox");
  box.className = "modal-box" + (wide ? " modal-wide" : "");
  box.innerHTML = html;
  $("#modalRoot").hidden = false;
  document.body.classList.add("modal-open");
}
function closeModal() {
  $("#modalRoot").hidden = true;
  $("#modalBox").innerHTML = "";
  document.body.classList.remove("modal-open");
  $$(".img-slot", $("#modalBox")).forEach(() => {});
}

/** 确认框（Promise 风格） */
function confirmBox(title, text, okText) {
  return new Promise((resolve) => {
    const root = $("#confirmRoot");
    $("#confirmTitle").textContent = title || "确认操作";
    $("#confirmText").textContent = text || "";
    $("#confirmYes").textContent = okText || "确定";
    root.hidden = false;
    const done = (v) => {
      root.hidden = true;
      $("#confirmYes").onclick = null;
      $("#confirmNo").onclick = null;
      resolve(v);
    };
    $("#confirmYes").onclick = () => done(true);
    $("#confirmNo").onclick = () => done(false);
    root.querySelector("[data-close-confirm]").onclick = () => done(false);
  });
}

/* ---- 图片占位框 ----
   imgSlot() 生成占位框 HTML；initImageSlots() 把已有图片填充进去。
   用户在框上点一下，就能选本地图片替换（存 IndexedDB，刷新不丢）。 */
function imgSlot(opts) {
  const o = opts || {};
  const label = o.label || "图片";
  const size = o.size || "1200×800";
  return '<div class="img-slot" data-slot="' + esc(o.key || "") + '" data-field="' + esc(o.field || "img") + '"' +
    ' data-store="' + esc(o.store || "") + '" data-record="' + esc(o.record || "") + '"' +
    ' data-kind="' + esc(o.kind || "image") + '" data-url="' + esc(o.url || "") + '"' +
    ' data-label="' + esc(label) + '" data-size="' + esc(size) + '" data-media-key="' + esc(o.mediaKey || "") + '"' +
    ' title="' + esc(label + " · 推荐尺寸 " + size + " · 点击上传本地图片") + '">' +
    slotInner({ hasMedia: false, url: o.url || "", kind: o.kind || "image", label: label, size: size }) +
    "</div>";
}
function slotInner(s) {
  if (s.hasMedia) {
    if (s.kind === "video") {
      return '<video src="' + esc(s.url) + '" class="slot-cover" muted playsinline preload="metadata"></video>' +
        '<div class="ph-actions" style="position:absolute;bottom:8px;left:0;right:0;z-index:3">' +
        '<button type="button" data-slot-replace>更换</button><button type="button" data-slot-clear>移除</button></div>';
    }
    return '<img src="' + esc(s.url) + '" alt="' + esc(s.label || "") + '">' +
      '<div class="ph-actions" style="position:absolute;bottom:8px;left:0;right:0;z-index:3">' +
      '<button type="button" data-slot-replace>更换</button><button type="button" data-slot-clear>移除</button></div>';
  }
  return '<div class="ph-ico">' + (s.kind === "video" ? "&#9658;" : "&#43;") + "</div>" +
    '<div class="ph-tip">点击上传' + (s.kind === "video" ? "视频" : "图片") + "</div>" +
    '<div class="ph-size">' + esc(s.label || "") + " · "+ esc(s.size || "") + "</div>";
}
/** 事件委托：所有图片占位框的点击都在这里统一处理（只绑定一次） */
function bindSlotDelegation() {
  document.addEventListener("click", async (e) => {
    const slot = e.target.closest(".img-slot");
    if (!slot) return;
    const isClear = !!e.target.closest("[data-slot-clear]");
    const isReplace = !!e.target.closest("[data-slot-replace]");
    if (isClear) { e.preventDefault(); clearSlot(slot); return; }
    if (isReplace || !isClear) { e.preventDefault(); pickFileForSlot(slot); }
  });
}
function pickFileForSlot(slot) {
  const kind = slot.dataset.kind || "image";
  const input = document.createElement("input");
  input.type = "file";
  input.accept = kind === "video" ? "video/*" : "image/*";
  input.style.display = "none";
  document.body.appendChild(input);
  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    input.remove();
    if (!file) return;
    const type = file.type || "";
    if (kind === "video" && !/^video\//.test(type)) return toast("请选择视频文件（mp4 / webm 等）", "err");
    if (kind === "image" && !/^image\//.test(type)) return toast("请选择图片文件（jpg / png / webp 等）", "err");
    const maxMB = 120;
    if (file.size > maxMB * 1024 * 1024) return toast("文件太大（上限 " + maxMB + "MB）", "err");
    toast("正在保存到本地媒体库…");
    const key = await MediaDB.put(file);
    if (!key) return toast("保存失败，请重试", "err");
    const url = await MediaDB.url(key);
    applySlot(slot, url, key, type);
  });
  input.click();
}
/** 把媒体写回数据模型：支持全局站点字段、数组记录字段、以及只存浏览器不写模型 */
function applySlot(slot, url, key, mime) {
  const store = slot.dataset.store;
  const record = slot.dataset.record;
  const field = slot.dataset.field;
  slot.dataset.mediaKey = key || "";
  slot.dataset.url = url || "";
  slot.classList.add("has-media");
  slot.innerHTML = slotInner({ hasMedia: true, url: url, kind: slot.dataset.kind, label: slot.dataset.label });
  if (!store) return; // 纯展示槽位（例如后台里临时预览）
  const target = store === "site" ? Store.data.site
    : record ? (Store.data[store] || []).find((x) => x.id === record)
    : null;
  if (!target) return;
  if (key) { target[field] = url; if (field === "img") { target.media = key; target.mime = mime || ""; } else { target.media = key; } }
  Store.save();
  if (field === "img" && slot.dataset.cardCover) { /* 封面同步 */ }
  refreshDynamicBits();
}
async function clearSlot(slot) {
  const key = slot.dataset.mediaKey;
  const store = slot.dataset.store;
  const record = slot.dataset.record;
  const field = slot.dataset.field;
  if (key) { await MediaDB.remove(key); delete MediaDB.cache[key]; }
  slot.dataset.mediaKey = "";
  slot.dataset.url = "";
  slot.classList.remove("has-media");
  slot.innerHTML = slotInner({ hasMedia: false, url: "", kind: slot.dataset.kind, label: slot.dataset.label, size: slot.dataset.size });
  if (!store) return;
  const target = store === "site" ? Store.data.site
    : record ? (Store.data[store] || []).find((x) => x.id === record)
    : null;
  if (!target) return;
  target[field] = "";
  if (field === "img") { target.media = ""; target.mime = ""; }
  Store.save();
  refreshDynamicBits();
}
/** 把当前页面所有槽位里的已有图片填进去 */
async function initImageSlots(root) {
  const slots = $$(".img-slot", root || document);
  for (const slot of slots) {
    const key = slot.dataset.mediaKey;
    if (!key) continue;
    const url = await MediaDB.url(key);
    if (!url) continue;
    slot.dataset.url = url;
    slot.classList.add("has-media");
    slot.innerHTML = slotInner({ hasMedia: true, url: url, kind: slot.dataset.kind, label: slot.dataset.label });
  }
}

/* ============ 6. 主题 / 粒子 / 倒计时 ============ */
const Theme = {
  key: "aneko_theme",
  init() {
    let t = "dark";
    try { t = localStorage.getItem(this.key) || "dark"; } catch (e) {}
    this.apply(t);
  },
  toggle() { this.apply(document.documentElement.dataset.theme === "dark" ? "light" : "dark"); },
  apply(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(this.key, t); } catch (e) {}
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#05070d" : "#f4f8fb");
  },
};

/** 首页飘落粒子：音符 ♪ ♫ 与花瓣 ✿ ❀ */
const Particles = {
  timer: null,
  start(layer) {
    if (!layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.stop();
    const chars = ["♪", "♫", "♬", "✿", "❀", "・", "✦"];
    const build = () => {
      if (!layer.isConnected) return this.stop();
      if (layer.childElementCount > 34) return;
      const el = document.createElement("span");
      const r = Math.random();
      el.className = "particle " + (r < 0.45 ? "p-note" : r < 0.75 ? "p-petal" : "");
      el.textContent = chars[Math.floor(Math.random() * chars.length)];
      el.style.left = Math.random() * 100 + "%";
      el.style.setProperty("--size", (10 + Math.random() * 16).toFixed(0) + "px");
      el.style.setProperty("--dur", (12 + Math.random() * 12).toFixed(1) + "s");
      el.style.setProperty("--delay", (-Math.random() * 18).toFixed(1) + "s");
      el.style.setProperty("--sway", (Math.random() * 120 - 60).toFixed(0) + "px");
      el.style.setProperty("--alpha", (0.22 + Math.random() * 0.45).toFixed(2));
      layer.appendChild(el);
    };
    for (let i = 0; i < 26; i++) build();
    this.timer = setInterval(build, 900);
  },
  stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } },
};

/** 倒计时：显示距离下一个活动还有多久 */
const Countdown = {
  timer: null,
  el: null,
  start() {
    this.stop();
    if (!this.el) return;
    const tick = () => {
      const ev = nextEvent();
      if (!ev || !this.el.isConnected) { if (this.el) this.el.innerHTML = '<div class="cd-label">NEXT EVENT</div><div class="cd-title">近期暂无活动</div><div class="cd-nums"><span>' + "待定"+ "</span></div>"; return; }
      const s = parseDate(ev.start);
      const diff = Math.max(0, s.getTime() - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const mi = Math.floor((diff % 3600000) / 60000);
      const se = Math.floor((diff % 60000) / 1000);
      this.el.innerHTML = '<div class="cd-label">NEXT EVENT</div>' +
        '<div class="cd-title">' + esc(ev.title) + "</div>" +
        '<div class="cd-nums">' +
        '<span>' + d + "<small>天</small></span>" +
        '<span>' + pad2(h) + "<small>时</small></span>" +
        '<span>' + pad2(mi) + "<small>分</small></span>" +
        '<span>' + pad2(se) + "<small>秒</small></span>" +
        "</div>";
    };
    tick();
    this.timer = setInterval(tick, 1000);
  },
  stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } },
};

/** 下一个未结束的活动 */
function nextEvent() {
  const list = (Store.data.events || []).filter((e) => eventState(e) !== "ended" && parseDate(e.start));
  list.sort((a, b) => parseDate(a.start) - parseDate(b.start));
  return list[0] || null;
}


/* ============ 7. 前台页面渲染 ============ */
const QUICKS = [
  { href: "#/about", icon: "users", title: "社团介绍", desc: "我们是谁" },
  { href: "#/events", icon: "calendar", title: "活动日历", desc: "近期活动" },
  { href: "#/gallery", icon: "image", title: "作品展示", desc: "成员创作" },
  { href: "#/upload", icon: "upload", title: "上传作品", desc: "投稿入口" },
  { href: "#/join", icon: "heart", title: "加入我们", desc: "线上报名" },
  { href: "#/recommend", icon: "star", title: "番剧安利", desc: "社团推荐" },
  { href: "#/members", icon: "user", title: "成员部门", desc: "认识我们" },
  { href: "#/posts", icon: "file", title: "公告栏", desc: "通知与规则" },
];

function pageHero(eyebrow, title, sub) {
  return '<div class="container page-hero"><div class="eyebrow" style="color:var(--miku);font-size:12px;font-weight:800;letter-spacing:.22em;text-transform:uppercase">' + esc(eyebrow) + "</div>" +
    "<h1>" + esc(title) + "</h1><p>" + esc(sub) + "</p></div>";
}
function backLink(href, text) {
  return '<a class="back-link" href="' + esc(href) + '">' + ic("back") + esc(text) + "</a>";
}
function stateBadge(ev) {
  const s = eventState(ev);
  return '<span class="state state-' + s + '">' + STATE_TEXT[s] + "</span>";
}
function findById(list, id) { return (list || []).find((x) => x.id === id); }
function approvedWorks() { return (Store.data.works || []).filter((w) => w.status === "approved"); }
function sortedPosts() {
  return (Store.data.posts || []).slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (parseDate(b.date) || 0) - (parseDate(a.date) || 0));
}
function sortedEvents() {
  return (Store.data.events || []).slice().sort((a, b) => (parseDate(a.start) || 0) - (parseDate(b.start) || 0));
}
function hasMedia(w) { return !!(w.media || w.img); }
function isVideoWork(w) {
  if (w.category === "视频") return true;
  if (w.mime && /^video\//.test(w.mime)) return true;
  if (w.link && toEmbed(w.link).kind === "file") return true;
  return false;
}

/* ---- 首页 ---- */
function renderHome() {
  const d = Store.data;
  const slides = d.carousel && d.carousel.length ? d.carousel : DEMO.carousel;
  const posts = sortedPosts().slice(0, 4);
  const works = approvedWorks().filter((w) => w.featured).slice(0, 4);
  const pickWorks = works.length ? works : approvedWorks().slice(0, 4);
  const recs = (d.recommends || []).slice(0, 6);
  const upcoming = sortedEvents().filter((e) => eventState(e) !== "ended")[0];

  const slideHTML = slides.map((s, i) => {
    const slot = s.media
      ? '<div class="slide-media"><img src="' + esc(s.img) + '" alt="' + esc(s.title) + '"></div>'
      : '<div class="slide-media"><div class="slide-fallback"></div><div style="position:absolute;inset:0">' +
        imgSlot({ key: "carousel-" + s.id, label: "轮播图 " + (i + 1), size: "1920×1080", store: "carousel", record: s.id, field: "img", mediaKey: s.media || "", kind: "image" }) +
        "</div></div>";
    return '<div class="hero-slide' + (i === 0 ? " active" : "") + '" data-slide="' + i + '">' + slot + "</div>";
  }).join("");

  return '<div class="hero" id="hero">' +
    '<div class="hero-slides">' + slideHTML + "</div>" +
    '<div class="hero-inner"><div class="container"><div class="hero-copy">' +
    '<div class="eyebrow" id="heroEyebrow">' + esc(slides[0].eyebrow || "Club Profile") + "</div>" +
    '<h1 id="heroTitle">' + esc(slides[0].title) + "</h1>" +
    '<p class="sub" id="heroSub">' + esc(slides[0].sub || "") + "</p>" +
    '<div class="hero-cta">' +
    '<a class="btn btn-primary btn-lg" id="heroBtn" href="' + esc(slides[0].link || "#/about") + '">' + esc(slides[0].btn || "了解更多") + "</a>" +
    '<a class="btn btn-ghost btn-lg" href="#/join">加入我们 ' + ic("heart") + "</a>" +
    "</div></div></div></div>" +
    '<button class="hero-arrow prev" type="button" data-slide-prev aria-label="上一张">' + ic("back") + "</button>" +
    '<button class="hero-arrow next" type="button" data-slide-next aria-label="下一张">' + ic("external") + "</button>" +
    '<div class="hero-countdown" id="heroCountdown"></div>' +
    '<div class="hero-dots" id="heroDots">' + slides.map((s, i) => '<button type="button" data-slide-go="' + i + '" class="' + (i === 0 ? "active" : "") + '" aria-label="第 ' + (i + 1) + ' 张"></button>').join("") + "</div>" +
    "</div>" +

    /* 快速入口 */
    '<section class="section section-tight"><div class="container">' +
    '<div class="section-head"><div><div class="eyebrow">Quick Access</div><h2>快速入口</h2></div>' +
    '<a class="btn btn-ghost btn-sm" href="#/join">还没有账号？先报名 ' + ic("heart") + "</a></div>" +
    '<div class="quick-grid">' + QUICKS.map((q) =>
      '<a class="quick-item" href="' + q.href + '"><span class="quick-ico">' + ic(q.icon) + "</span><b>" + esc(q.title) + "</b><span>"+ esc(q.desc) + "</span></a>").join("") +
    "</div></div></section>" +

    /* 社团简介 */
    '<section class="section"><div class="container">' +
    '<div class="grid grid-2" style="align-items:center;gap:34px">' +
        '<div><div class="eyebrow" style="color:var(--miku);font-size:12px;font-weight:800;letter-spacing:.22em;text-transform:uppercase">About Us</div>' +
    '<h2 style="font-size:clamp(24px,4vw,36px)">' + esc(d.site.name) + "</h2>" +
    '<p class="muted" style="margin-top:14px;font-size:16px">' + nl2br(d.site.intro) + "</p>" +
    '<div class="stat-row">' +
    '<div class="stat"><b>' + esc(String(d.site.members || 0)) + "</b><span>在册社员</span></div>" +
    '<div class="stat"><b>' + esc(String((d.events || []).length)) + "</b><span>记录活动</span></div>" +
    '<div class="stat"><b>' + esc(String(approvedWorks().length)) + "</b><span>展出作品</span></div>" +
    '<div class="stat"><b>' + esc(String((d.departments || []).length)) + "</b><span>下设部门</span></div>" +
    "</div>" +
    '<div class="hero-cta" style="margin-top:24px"><a class="btn btn-primary" href="#/about">社团故事 ' + ic("external") + "</a>" +
    '<a class="btn btn-ghost" href="#/members">成员与部门</a></div></div>' +
    '<div class="card"><div class="card-body"><h3 style="margin-bottom:14px">' + ic("mail", "iico") + " 联系方式</h3>" +
    '<div class="info-list">' +
    infoItem("mail", "邮箱", d.site.email) +
    infoItem("phone", "电话", d.site.phone) +
    infoItem("users", "QQ 群", d.site.qq) +
    infoItem("pin", "活动地点", d.site.place) +
    infoItem("clock", "固定活动", d.site.meeting) +
    "</div>" +
    '<a class="btn btn-primary btn-block" style="margin-top:16px" href="#/join">填写报名表 ' + ic("heart") + "</a>" +
    "</div></div></div></div></section>" +

    /* 最新公告 */
    '<section class="section"><div class="container">' +
    '<div class="section-head"><div><div class="eyebrow">News</div><h2>最新公告</h2></div>' +
    '<a class="btn btn-ghost btn-sm" href="#/posts">全部公告 ' + ic("external") + "</a></div>" +
    (posts.length ? '<div class="grid grid-auto">' + posts.map(postCard).join("") + "</div>"
      : '<div class="empty-state"><div class="big">' + ic("inbox") + '</div><b>暂无公告</b><p class="muted">在后台「公告管理」里发布第一条公告吧。</p></div>') +
    "</div></section>" +

    /* 热门作品 */
    '<section class="section"><div class="container">' +
    '<div class="section-head"><div><div class="eyebrow">Gallery</div><h2>热门作品</h2><p class="muted">点赞数最高的成员创作</p></div>' +
    '<a class="btn btn-primary btn-sm" href="#/upload">上传作品 ' + ic("upload") + "</a></div>" +
    (pickWorks.length ? '<div class="work-grid">' + pickWorks.map(workCard).join("") + "</div>"
      : '<div class="empty-state"><div class="big">' + ic("image") + '</div><b>暂无已通过作品</b><p class="muted">上传作品并在后台审核通过后，会显示在这里。</p></div>') +
    "</div></section>" +

    /* 番剧安利 */
    '<section class="section"><div class="container">' +
    '<div class="section-head"><div><div class="eyebrow">Recommend</div><h2>社团安利墙</h2><p class="muted">社员共同推荐的番剧、游戏与漫画</p></div>' +
    '<a class="btn btn-ghost btn-sm" href="#/recommend">完整榜单 ' + ic("external") + "</a></div>" +
    (recs.length ? '<div class="grid grid-auto">' + recs.map(recCard).join("") + "</div>" : '<div class="empty-state">暂无推荐</div>') +
    "</div></section>" +

    /* 招新 CTA */
    '<section class="section"><div class="container">' +
    '<div class="join-hero"><span class="join-badge">' + ic("spark") + " 线上报名进行中</span>" +
    '<h2 style="font-size:clamp(24px,4.4vw,38px)">' + esc(d.site.slogan) + "</h2>" +
    '<p class="muted" style="max-width:640px;margin-top:10px">' + esc(d.site.joinNote || "") + "</p>" +
    '<div class="hero-cta" style="margin-top:20px"><a class="btn btn-primary btn-lg" href="#/join">立即报名 ' + ic("heart") + "</a>" +
    '<a class="btn btn-ghost btn-lg" href="#/about">先看看我们是谁</a></div></div>' +
    "</div></section>";
}

function infoItem(icon, k, v) {
  return '<div class="info-item"><span class="iico">' + ic(icon) + "</span><div><b>" + esc(k) + "</b><span>"+ esc(v || "未填写") + "</span></div></div>";
}

/* ---- 卡片：公告 / 作品 / 活动 / 推荐 ---- */
function postCard(p) {
  return '<a class="card card-hover media-card" href="#/post/' + esc(p.id) + '">' +
    '<div class="media-thumb">' +
    (p.cover ? '<img class="slot-cover" src="' + esc(p.cover) + '" alt="">'
      : imgSlot({ key: "post-" + p.id, label: "公告配图", size: "1200×700", store: "posts", record: p.id, field: "cover", mediaKey: p.media || "", kind: "image" })) +
    '<div class="media-badge"><span class="pill">' + esc(p.tag || "公告") + "</span>" + (p.pinned ? '<span class="pill">置顶</span>' : "") + "</div>" +
    "</div>" +
    '<div class="card-body"><h3>' + esc(p.title) + "</h3>" +
    '<p class="desc">' + esc(p.summary || "") + "</p>" +
    '<div class="card-meta">' + ic("clock") + "<span>" + esc(fmtDate(p.date)) + "</span>" + ic("user") + "<span>"+ esc(p.author || "社团") + "</span></div>" +
    "</div></a>";
}

function workCard(w) {
  const video = isVideoWork(w);
  const like = (Store.data.stats && Store.data.stats["like_" + w.id]) || 0;
  return '<article class="card card-hover media-card">' +
    '<a href="#/work/' + esc(w.id) + '" class="media-thumb' + (w.category === "Cosplay" ? " tall" : "") + '">' +
    (hasMedia(w)
      ? (video && (w.mime || "").indexOf("video") === 0
        ? '<video class="slot-cover" src="' + esc(w.img) + '" muted playsinline preload="metadata"></video>'
        : '<img class="slot-cover" src="' + esc(w.img) + '" alt="' + esc(w.title) + '">')
      : imgSlot({ key: "work-" + w.id, label: w.category + " 封面", size: w.category === "Cosplay" ? "1080×1350" : "1600×1000", store: "works", record: w.id, field: "img", mediaKey: w.media || "", kind: "image" })) +
    '<div class="media-badge"><span class="pill">' + esc(w.category) + "</span></div>" +
    (video ? '<div class="media-play"><span>' + ic("play") + "</span></div>" : "") +
    "</a>" +
    '<div class="card-body"><h3><a href="#/work/' + esc(w.id) + '">' + esc(w.title) + "</a></h3>" +
    '<div class="card-meta">' + ic("user") + "<span>" + esc(w.author) + "</span>" + ic("clock") + "<span>"+ esc(fmtDate(w.date)) + "</span>" +
    "<span>" + ic("heart") + " " + like + "</span></div>" +
    '<div class="card-actions"><a class="chip-btn" href="#/work/' + esc(w.id) + '">查看详情</a>' +
    '<button class="chip-btn" type="button" data-like="' + esc(w.id) + '">' + ic("heart") + " 点赞</button></div>" +
    "</div></article>";
}

function eventCard(ev) {
  const d = fmtDay(ev.start);
  const s = eventState(ev);
  return '<article class="card card-hover media-card" data-event-card="' + esc(ev.id) + '">' +
    '<div class="card-row">' +
    '<div class="media-thumb">' +
    (ev.img ? '<img class="slot-cover" src="' + esc(ev.img) + '" alt="">'
      : imgSlot({ key: "event-" + ev.id, label: "活动海报", size: "1200×750", store: "events", record: ev.id, field: "img", mediaKey: ev.media || "", kind: "image" })) +
    '<div class="media-badge"><span class="pill">' + esc(ev.category) + "</span></div>" +
    "</div>" +
    '<div class="card-body"><div class="card-meta" style="margin:0 0 6px">' + stateBadge(ev) + "<span>"+ esc(d.mon + d.day + "日") + "</span></div>" +
    "<h3><a href='#/event/" + esc(ev.id) + "'>" + esc(ev.title) + "</a></h3>" +
    '<p class="desc">' + esc(ev.summary || "") + "</p>" +
    '<div class="card-meta">' + ic("clock") + "<span>" + esc(fmtDateTime(ev.start)) + "</span>" + ic("pin") + "<span>"+ esc(ev.place) + "</span></div>" +
    '<div class="card-actions"><a class="btn btn-primary btn-sm" href="#/event/' + esc(ev.id) + '">查看详情</a>' +
    (s !== "ended" ? '<button class="chip-btn" type="button" data-signup="' + esc(ev.id) + '">我要报名</button>' : '<span class="tag">已结束</span>') +
    "</div></div></div></article>";
}

function recCard(r) {
  const full = Math.round((r.score || 0) / 2);
  return '<article class="card card-hover rec-card"><div class="card-body">' +
    '<div class="rec-top"><div style="flex:1;min-width:0"><div class="rec-type">' + esc(r.type) + "</div><h3>"+ esc(r.title) + "</h3>" +
    '<div class="stars">' + "★".repeat(Math.max(0, full)) + "☆".repeat(Math.max(0, 5 - full)) + "</div></div>" +
    '<div class="rec-score">' + esc(String(r.score)) + "</div></div>" +
    '<p class="desc" style="margin-top:12px">' + esc(r.note) + "</p>" +
    '<div class="card-meta">' + ic("user") + "<span>推荐人："+ esc(r.by) + "</span></div>" +
    (r.link ? '<div class="card-actions"><a class="chip-btn" target="_blank" rel="noopener" href="' + esc(r.link) + '">前往观看 ' + ic("external") + "</a></div>" : "") +
    "</div></article>";
}


/* ---- 活动日历 ---- */
const EV_FILTER = { state: "upcoming", cat: "全部" };
function renderEvents() {
  const cats = ["全部"].concat(Array.from(new Set((Store.data.events || []).map((e) => e.category))));
  const all = sortedEvents();
  const list = all.filter((e) => {
    const s = eventState(e);
    const okState = EV_FILTER.state === "upcoming" ? s !== "ended" : s === "ended";
    const okCat = EV_FILTER.cat === "全部" || e.category === EV_FILTER.cat;
    return okState && okCat;
  });
  const nxt = nextEvent();
  return pageHero("Events", "活动日历", "观影会、漫展、工坊、外拍、比赛 —— 全部活动都在这里，点开即可报名。") +
    '<section class="container section-tight">' +
    (nxt ? '<div class="join-hero" style="margin-bottom:26px"><div class="grid grid-2" style="gap:20px;align-items:center">' +
      '<div><span class="join-badge">' + ic("spark") + ' 下一场活动</span><h2 style="font-size:clamp(20px,3.4vw,30px)">' + esc(nxt.title) + "</h2>" +
      '<p class="muted" style="margin-top:8px">' + esc(fmtCN(nxt.start, true)) + " · "+ esc(nxt.place) + "</p>" +
      '<div class="hero-cta" style="margin-top:16px"><a class="btn btn-primary" href="#/event/' + esc(nxt.id) + '">查看详情并报名</a></div></div>' +
      '<div id="eventsCountdown" class="hero-countdown" style="position:static;min-width:0"></div>' +
      "</div></div>" : "") +
    '<div class="filter-row">' +
    '<button class="filter-btn' + (EV_FILTER.state === "upcoming" ? " active" : "") + '" data-ev-state="upcoming" type="button">即将开始 / 进行中</button>' +
    '<button class="filter-btn' + (EV_FILTER.state === "past" ? " active" : "") + '" data-ev-state="past" type="button">已结束</button>' +
    cats.map((c) => '<button class="filter-btn' + (EV_FILTER.cat === c ? " active" : "") + '" data-ev-cat="' + esc(c) + '" type="button">' + esc(c) + "</button>").join("") +
    "</div>" +
    (list.length ? '<div class="grid" style="gap:18px">' + list.map(eventCard).join("") + "</div>"
      : '<div class="empty-state"><div class="big">' + ic("calendar") + '</div><b>没有找到活动</b><p class="muted">换个筛选条件，或到后台「活动管理」里新建一场活动。</p></div>') +
    "</section>";
}

function renderEventDetail(id) {
  const ev = findById(Store.data.events, id);
  if (!ev) return notFound("活动不存在或已被删除", "#/events", "返回活动日历");
  const s = eventState(ev);
  const signups = (Store.data.signups || []).filter((x) => x.eventId === ev.id);
  return '<section class="container section-tight" style="padding-top:34px">' +
    backLink("#/events", "返回活动日历") +
    '<div class="detail-hero">' +
    (ev.img ? '<img class="slot-cover" style="position:relative;width:100%;height:auto;max-height:420px;object-fit:cover" src="' + esc(ev.img) + '" alt="">'
      : imgSlot({ key: "detail-event-" + ev.id, label: "活动海报", size: "1600×900", store: "events", record: ev.id, field: "img", mediaKey: ev.media || "", kind: "image" })) +
    "</div>" +
    '<div class="grid grid-2" style="gap:30px;align-items:start">' +
    "<div>" +
    '<div class="card-meta" style="margin-bottom:10px">' + stateBadge(ev) + '<span class="pill">' + esc(ev.category) + "</span></div>" +
    '<h1 class="detail-title">' + esc(ev.title) + "</h1>" +
    '<p class="muted" style="font-size:16px">' + esc(ev.summary) + "</p>" +
    '<div style="height:22px"></div>' +
    '<h3 style="margin-bottom:10px">活动介绍</h3>' +
    '<div class="detail-body">' + nl2br(ev.content || "暂无详细介绍。") + "</div>" +
    "</div>" +
    '<aside><div class="card"><div class="card-body">' +
    '<h3 style="margin-bottom:14px">活动信息</h3>' +
    '<div class="info-list">' +
    infoItem("clock", "开始", fmtCN(ev.start, true)) +
    infoItem("clock", "结束", fmtCN(ev.end, true)) +
    infoItem("pin", "地点", ev.place) +
    infoItem("users", "名额", ev.capacity || "不限") +
    infoItem("user", "主办部门", ev.organizer || "社团") +
    infoItem("chart", "已报名", signups.length + " 人") +
    "</div>" +
    (s !== "ended"
      ? '<button class="btn btn-primary btn-block" style="margin-top:16px" data-signup="' + esc(ev.id) + '">' + ic("heart") + " 我要报名</button>"
      : '<button class="btn btn-ghost btn-block" style="margin-top:16px" disabled>活动已结束</button>') +
    '<button class="btn btn-ghost btn-block" style="margin-top:10px" type="button" data-share-event="' + esc(ev.id) + '">' + ic("copy") + " 复制活动信息</button>" +
    "</div></div></aside></div></section>";
}

/* ---- 公告 ---- */
const POST_FILTER = { q: "" };
function renderPosts() {
  const list = sortedPosts().filter((p) => {
    if (!POST_FILTER.q) return true;
    const q = POST_FILTER.q.toLowerCase();
    return (p.title + p.summary + p.content + (p.tag || "")).toLowerCase().indexOf(q) >= 0;
  });
  return pageHero("Notice", "公告栏", "招新通知、活动变更、场地规则与社团公告都会发布在这里。") +
    '<section class="container section-tight">' +
    '<div class="admin-toolbar" style="margin-bottom:20px">' +
    '<input class="input" id="postSearch" placeholder="搜索公告标题或内容…" value="' + esc(POST_FILTER.q) + '" style="max-width:320px">' +
    "</div>" +
    (list.length
      ? '<div class="grid" style="gap:14px">' + list.map((p) =>
        '<a class="card card-hover" href="#/post/' + esc(p.id) + '"><div class="card-body" style="display:flex;gap:16px;align-items:flex-start">' +
        (p.cover ? '<div class="media-thumb" style="width:120px;flex:0 0 120px;aspect-ratio:4/3;border-radius:12px;overflow:hidden;position:relative"><img class="slot-cover" src="' + esc(p.cover) + '" alt=""></div>' : "") +
        '<div style="flex:1;min-width:0">' +
        '<div class="card-meta" style="margin:0 0 6px">' + (p.pinned ? '<span class="pill">置顶</span>' : "") + '<span class="tag">' + esc(p.tag || "公告") + "</span><span>" + esc(fmtDate(p.date)) + "</span><span>"+ esc(p.author || "") + "</span></div>" +
        "<h3>" + esc(p.title) + "</h3>" +
        '<p class="desc" style="margin-top:4px">' + esc(p.summary || "") + "</p>" +
        "</div></div></a>").join("") + "</div>"
      : '<div class="empty-state"><div class="big">' + ic("inbox") + '</div><b>没有匹配的公告</b><p class="muted">试试别的关键词。</p></div>') +
    "</section>";
}
function renderPostDetail(id) {
  const p = findById(Store.data.posts, id);
  if (!p) return notFound("公告不存在或已被删除", "#/posts", "返回公告栏");
  return '<section class="container section-tight" style="padding-top:34px;max-width:880px">' +
    backLink("#/posts", "返回公告栏") +
    '<div class="breadcrumb"><a href="#/posts">公告栏</a><span>/</span><span>' + esc(p.tag || "公告") + "</span></div>" +
    '<h1 class="detail-title">' + esc(p.title) + "</h1>" +
    '<div class="detail-meta"><span>' + ic("clock") + " " + esc(fmtCN(p.date, true)) + "</span><span>" + ic("user") + " " + esc(p.author || "社团") + "</span><span>"+ esc(p.tag || "") + "</span></div>" +
    (p.cover ? '<div class="detail-hero"><img style="width:100%;max-height:420px;object-fit:cover" src="' + esc(p.cover) + '" alt=""></div>' : "") +
    '<div class="detail-body prose">' + nl2br(p.content || "") + "</div>" +
    '<div style="margin-top:26px;display:flex;gap:10px;flex-wrap:wrap">' +
    '<button class="btn btn-ghost btn-sm" type="button" data-copy-text="' + esc((p.title + "\n\n" + (p.content || "")).slice(0, 1200)) + '">' + ic("copy") + " 复制全文</button>" +
    '<a class="btn btn-ghost btn-sm" href="#/events">看看相关活动 ' + ic("external") + "</a>" +
    "</div></section>";
}

/* ---- 作品展示 ---- */
const GAL_FILTER = { cat: "全部", kind: "全部", sort: "new", q: "" };
function renderGallery() {
  const cats = ["全部", "插画", "摄影", "Cosplay", "视频", "手工"];
  let list = approvedWorks();
  if (GAL_FILTER.cat !== "全部") list = list.filter((w) => w.category === GAL_FILTER.cat);
  if (GAL_FILTER.kind === "视频") list = list.filter((w) => isVideoWork(w));
  if (GAL_FILTER.kind === "图片") list = list.filter((w) => !isVideoWork(w));
  if (GAL_FILTER.q) {
    const q = GAL_FILTER.q.toLowerCase();
    list = list.filter((w) => (w.title + w.author + (w.desc || "")).toLowerCase().indexOf(q) >= 0);
  }
  list = list.slice().sort((a, b) => {
    if (GAL_FILTER.sort === "like") return ((Store.data.stats && Store.data.stats["like_" + b.id]) || 0) - ((Store.data.stats && Store.data.stats["like_" + a.id]) || 0);
    if (GAL_FILTER.sort === "old") return (parseDate(a.date) || 0) - (parseDate(b.date) || 0);
    return (parseDate(b.date) || 0) - (parseDate(a.date) || 0);
  });
  const pendingCount = (Store.data.works || []).filter((w) => w.status === "pending").length;
  return pageHero("Gallery", "作品展示", "插画、摄影、Cosplay、视频、手工 —— 社员创作的展示墙，点开可看大图与创作故事。") +
    '<section class="container section-tight">' +
    '<div class="filter-row">' +
    cats.map((c) => '<button class="filter-btn' + (GAL_FILTER.cat === c ? " active" : "") + '" data-gal-cat="' + esc(c) + '" type="button">' + esc(c) + "</button>").join("") +
    '<span style="width:12px"></span>' +
    ["全部", "图片", "视频"].map((k) => '<button class="filter-btn' + (GAL_FILTER.kind === k ? " active" : "") + '" data-gal-kind="' + esc(k) + '" type="button">' + esc(k === "全部" ? "全部类型" : k) + "</button>").join("") +
    "</div>" +
    '<div class="admin-toolbar" style="margin-bottom:20px">' +
    '<input class="input" id="galSearch" placeholder="搜索作品 / 作者…" value="' + esc(GAL_FILTER.q) + '" style="max-width:260px">' +
    '<select class="select" id="galSort">' +
    '<option value="new"' + (GAL_FILTER.sort === "new" ? " selected" : "") + ">最新发布</option>" +
    '<option value="like"' + (GAL_FILTER.sort === "like" ? " selected" : "") + ">点赞最多</option>" +
    '<option value="old"' + (GAL_FILTER.sort === "old" ? " selected" : "") + ">最早发布</option>" +
    "</select>" +
    '<a class="btn btn-primary btn-sm" href="#/upload">' + ic("upload") + " 上传作品</a>" +
    (pendingCount ? '<span class="tag">有 ' + pendingCount + " 件作品待审核</span>" : "") +
    "</div>" +
    (list.length ? '<div class="work-grid">' + list.map(workCard).join("") + "</div>"
      : '<div class="empty-state"><div class="big">' + ic("image") + '</div><b>暂无作品</b><p class="muted">换个筛选条件，或点「上传作品」投稿第一件作品。</p></div>') +
    "</section>";
}

function renderWorkDetail(id) {
  const w = findById(Store.data.works, id);
  if (!w) return notFound("作品不存在或已被删除", "#/gallery", "返回作品展示");
  if (w.status !== "approved") {
    return '<section class="container section-tight" style="padding-top:40px;max-width:720px">' +
      '<div class="empty-state"><div class="big">' + ic("lock") + "</div><b>该作品还在审核中</b>" +
      '<p class="muted">作品「' + esc(w.title) + '」当前状态为「' + esc(w.status === "pending" ? "待审核" : "已拒绝") + '」，审核通过后才会公开展示。</p>' +
      '<div style="margin-top:16px"><a class="btn btn-ghost btn-sm" href="#/gallery">返回作品展示</a></div></div></section>';
  }
  const like = (Store.data.stats && Store.data.stats["like_" + w.id]) || 0;
  const view = (Store.data.stats && Store.data.stats["view_" + w.id]) || 0;
  const video = isVideoWork(w);
  let player = "";
  if (video) {
    if (w.media) player = '<div class="video-frame"><video src="' + esc(w.img) + '" controls playsinline preload="metadata"></video></div>';
    else if (w.link) {
      const em = toEmbed(w.link);
      if (em.kind === "bili" || em.kind === "yt") player = '<div class="video-frame"><iframe src="' + esc(em.src) + '" allowfullscreen allow="autoplay; fullscreen; picture-in-picture" loading="lazy" referrerpolicy="no-referrer"></iframe></div>';
      else if (em.kind === "file") player = '<div class="video-frame"><video src="' + esc(em.src) + '" controls playsinline preload="metadata"></video></div>';
      else player = '<div class="empty-state"><b>外部视频链接</b><p class="muted">' + esc(w.link) + '</p><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="' + esc(w.link) + '">在新窗口打开 ' + ic("external") + "</a></div>";
    } else player = imgSlot({ key: "work-detail-" + w.id, label: "本地视频（点击上传）", size: "16:9", store: "works", record: w.id, field: "img", mediaKey: w.media || "", kind: "video" });
  } else if (hasMedia(w)) {
    player = '<div class="detail-hero" style="margin:0"><img style="width:100%;max-height:70vh;object-fit:contain;background:#000" src="' + esc(w.img) + '" alt="' + esc(w.title) + '"></div>';
  } else {
    player = '<div class="detail-hero" style="margin:0">' + imgSlot({ key: "work-detail-"+ w.id, label: w.category + " 作品图", size: "1600×1200", store: "works", record: w.id, field: "img", mediaKey: w.media || "", kind: "image" }) + "</div>";
  }
  return '<section class="container section-tight" style="padding-top:34px;max-width:1000px">' +
    backLink("#/gallery", "返回作品展示") +
    player +
    '<div style="height:26px"></div>' +
    '<div class="grid grid-2" style="gap:26px;align-items:start">' +
    '<div><div class="card-meta" style="margin-bottom:8px"><span class="pill">' + esc(w.category) + "</span></div>" +
    '<h1 class="detail-title">' + esc(w.title) + "</h1>" +
    '<div class="detail-meta"><span>' + ic("user") + " " + esc(w.author) + "</span><span>" + ic("clock") + " " + esc(fmtDate(w.date)) + "</span><span>" + ic("heart") + " " + like + " 赞</span><span>" + ic("chart") + " "+ view + " 次浏览</span></div>" +
    '<h3 style="margin:18px 0 8px">创作故事</h3><div class="detail-body">' + nl2br(w.desc || "作者还没有写下创作故事。") + "</div></div>" +
    '<aside><div class="card"><div class="card-body">' +
    '<h3 style="margin-bottom:12px">支持一下</h3>' +
    '<button class="btn btn-primary btn-block" type="button" data-like="' + esc(w.id) + '">' + ic("heart") + " 点赞（"+ like + "）</button>" +
    '<button class="btn btn-ghost btn-block" style="margin-top:10px" type="button" data-copy-text="' + esc(window.location.origin + window.location.pathname + "#/work/" + w.id) + '">' + ic("copy") + " 复制分享链接</button>" +
    (w.link ? '<a class="btn btn-ghost btn-block" style="margin-top:10px" target="_blank" rel="noopener" href="' + esc(w.link) + '">原始链接 ' + ic("external") + "</a>" : "") +
    '<a class="btn btn-ghost btn-block" style="margin-top:10px" href="#/upload">' + ic("upload") + " 我也要投稿</a>" +
    "</div></div>" +
    '<div class="card" style="margin-top:16px"><div class="card-body"><h3 style="margin-bottom:10px">同类作品</h3>' +
    sameCategory(w).map((x) => '<a href="#/work/' + esc(x.id) + '" class="kv-row" style="text-decoration:none"><span class="k">' + esc(x.title) + '</span><span class="v">' + esc(x.author) + "</span></a>").join("") || '<p class="muted tiny">暂无同类作品</p>' +
    "</div></div></aside></div></section>";
}
function sameCategory(w) {
  return approvedWorks().filter((x) => x.category === w.category && x.id !== w.id).slice(0, 4);
}

/* ---- 成员 / 部门 ---- */
function renderMembers() {
  const depts = Store.data.departments || [];
  const members = Store.data.members || [];
  return pageHero("Members", "成员与部门", "八个部门、一群把兴趣当正事做的人。想加入哪个部门，报名时告诉我们就好。") +
    '<section class="container section-tight">' +
    '<h2 style="font-size:22px;margin-bottom:16px">社团干部</h2>' +
    (members.length ? '<div class="grid grid-4">' + members.map((m) =>
      '<div class="card card-hover member">' +
      '<div class="avatar">' + (m.avatar ? '<img class="slot-cover" src="' + esc(m.avatar) + '" alt="">' : imgSlot({ key: "member-"+ m.id, label: "头像", size: "400×400", store: "members", record: m.id, field: "avatar", mediaKey: m.media || "", kind: "image" })) + "</div>" +
      "<b>" + esc(m.name) + "</b>" +
      '<div><span class="role">' + esc(m.role) + "</span></div>" +
      '<div class="dept">' + esc(m.dept) + "</div>" +
      '<p class="muted tiny" style="margin-top:10px">' + esc(m.intro) + "</p>" +
      "</div>").join("") + "</div>" : '<div class="empty-state">暂无成员信息</div>') +
    '<h2 style="font-size:22px;margin:36px 0 16px">部门介绍</h2>' +
    '<div class="grid grid-3">' + depts.map((d) =>
      '<div class="card card-hover dept-card"><h3>' + ic(d.icon) + esc(d.name) + "</h3>" +
      '<p class="muted" style="font-size:14px">' + esc(d.desc) + "</p>" +
      '<div class="card-meta">' + ic("check") + "<span>"+ esc(d.duty) + "</span></div>" +
      '<div class="card-meta">' + ic("users") + "<span>"+ members.filter((m) => m.dept === d.name).length + " 位负责人</span></div>" +
      "</div>").join("") + "</div>" +
    '<div class="join-hero" style="margin-top:34px"><h2 style="font-size:clamp(20px,3.6vw,30px)">想成为其中一员？</h2>' +
    '<p class="muted" style="margin-top:8px">' + esc(Store.data.site.joinNote || "") + "</p>" +
    '<div class="hero-cta" style="margin-top:16px"><a class="btn btn-primary" href="#/join">填写报名表</a></div></div>' +
    "</section>";
}

/* ---- 番剧 / 游戏推荐墙 ---- */
const REC_FILTER = { type: "全部" };
function renderRecommend() {
  const types = ["全部", "番剧", "游戏", "漫画"];
  const all = Store.data.recommends || [];
  const list = REC_FILTER.type === "全部" ? all : all.filter((r) => r.type === REC_FILTER.type);
  const avg = all.length ? (all.reduce((s, r) => s + (Number(r.score) || 0), 0) / all.length).toFixed(2) : "0.00";
  return pageHero("Recommend", "社团安利墙", "社员共同维护的推荐清单：番剧、游戏、漫画，附上真实评分与一句话短评。") +
    '<section class="container section-tight">' +
    '<div class="stat-row" style="margin-bottom:24px">' +
    '<div class="stat"><b>' + all.length + "</b><span>收录条目</span></div>" +
    '<div class="stat"><b>' + avg + "</b><span>平均评分</span></div>" +
    '<div class="stat"><b>' + new Set(all.map((r) => r.by)).size + "</b><span>参与社员</span></div>" +
    "</div>" +
    '<div class="filter-row">' + types.map((t) => '<button class="filter-btn' + (REC_FILTER.type === t ? " active" : "") + '" data-rec-type="' + esc(t) + '" type="button">' + esc(t) + "</button>").join("") +
    '<button class="filter-btn" type="button" data-rec-add>' + ic("plus") + " 我来安利一部</button></div>" +
    (list.length ? '<div class="grid grid-auto">' + list.map(recCard).join("") + "</div>" : '<div class="empty-state">这个分类还没有条目</div>') +
    "</section>";
}

/* ---- 加入我们 ---- */
function renderJoin() {
  const s = Store.data.site;
  const dl = parseDate(s.joinDeadline);
  const left = dl ? daysBetween(today0(), dl) : null;
  return '<section class="container section-tight" style="padding-top:40px">' +
    '<div class="join-hero">' +
    '<span class="join-badge">' + ic("spark") + (left !== null && left >= 0 ? " 距报名截止还有 "+ left + " 天" : " 长期接受报名") + "</span>" +
    "<h1>" + esc(s.slogan) + "</h1>" +
    '<p class="muted" style="font-size:17px;max-width:680px">' + esc(s.joinNote || "") + "</p>" +
    '<div class="hero-cta" style="margin-top:20px">' +
    '<a class="btn btn-primary btn-lg" href="#joinForm">立即报名 ' + ic("heart") + "</a>" +
    '<a class="btn btn-ghost btn-lg" href="#/events">先看看有什么活动</a>' +
    "</div>" +
    '<div class="stat-row">' +
    '<div class="stat"><b>' + esc(String(s.members || 0)) + "</b><span>在册社员</span></div>" +
    '<div class="stat"><b>' + esc(String((Store.data.departments || []).length)) + "</b><span>可选部门</span></div>" +
    '<div class="stat"><b>0</b><span>会费（元）</span></div>' +
    '<div class="stat"><b>' + esc(s.meeting || "每周三") + '</b><span>固定活动</span></div>' +
    "</div></div></section>" +

    '<section class="container section-tight"><h2 style="font-size:24px;margin-bottom:18px">加入动漫社的理由</h2>' +
    '<div class="reason-grid">' + (Store.data.benefits || []).map((b) =>
      '<div class="card reason card-hover"><div class="rico">' + ic(b.icon) + "</div><h4>" + esc(b.title) + "</h4><p>"+ esc(b.desc) + "</p></div>").join("") +
    "</div></section>" +

    '<section class="container section-tight" id="joinForm">' +
    '<div class="grid grid-2" style="gap:26px;align-items:start">' +
    '<div class="card form-card"><h2 style="font-size:22px;margin-bottom:6px">填写报名信息</h2>' +
    '<p class="muted tiny" style="margin-bottom:16px">信息仅保存在本机浏览器中，提交后可由社团干部在后台查看与导出。</p>' +
    '<form id="joinFormEl" novalidate>' +
    '<div class="form-grid">' +
    field("姓名", '<input class="input" name="name" required placeholder="你的名字或昵称">', true) +
    field("学号", '<input class="input" name="sid" required placeholder="用于核对在校身份">', true) +
    field("年级", '<select class="select" name="grade"><option value="">请选择年级</option><option>大一</option><option>大二</option><option>大三</option><option>大四</option><option>研究生</option><option>其他</option></select>') +
    field("专业", '<input class="input" name="major" placeholder="例如：数字媒体艺术">') +
    field("联系方式", '<input class="input" name="contact" required placeholder="QQ / 微信 / 手机号">', true) +
    field("想加入的部门", '<select class="select" name="dept"><option value="">暂时不确定</option>' + (Store.data.departments || []).map((d) => "<option>"+ esc(d.name) + "</option>").join("") + "<option>只想当普通社员</option></select>") +
    '<div class="span-2">' + field("特长 / 想点亮的新技能", '<input class="input" name="skill" placeholder="例如：会画线稿 / 想学剪辑 / 会一点点日语">') + "</div>" +
    '<div class="span-2">' + field("自我介绍 / 想说的话", '<textarea class="textarea" name="intro" placeholder="喜欢什么作品？想参加什么活动？随便聊聊。"></textarea>') + "</div>" +
    "</div>" +
    '<label class="card-meta" style="margin:6px 0 14px;cursor:pointer"><input type="checkbox" name="agree" style="margin-right:6px">我同意社团在内部联络中使用以上信息</label>' +
    '<div id="joinErr" class="err"></div>' +
    '<button class="btn btn-primary btn-lg btn-block" type="submit">' + ic("heart") + " 提交报名</button>" +
    '<div class="card-actions" style="justify-content:center;margin-top:12px"><button class="chip-btn" type="button" data-copy-qq>复制 QQ 群号：' + esc(s.qq) + "</button></div>" +
    "</form></div>" +
    '<div><h2 style="font-size:22px;margin-bottom:14px">常见问题</h2>' +
    (Store.data.reasons || []).map((f) =>
      '<div class="faq-item"><button class="faq-q" type="button" data-faq><span>' + esc(f.q) + '</span><span>' + ic("plus") + "</span></button>" +
      '<div class="faq-a">' + esc(f.a) + "</div></div>").join("") +
    '<div class="card" style="margin-top:18px"><div class="card-body"><h3 style="margin-bottom:10px">' + ic("users", "iico") + " 联系方式</h3>" +
    '<div class="info-list">' + infoItem("mail", "邮箱", s.email) + infoItem("users", "QQ 群", s.qq) + infoItem("pin", "活动室", s.place) + "</div></div></div>" +
    "</div></div></section>";
}
function field(label, control, req) {
  return '<div class="field span-2"><label>' + esc(label) + (req ? ' <span class="req">*</span>' : "") + "</label>"+ control + "</div>";
}

/* ---- 登录 / 注册（演示） ---- */
function renderLogin() {
  return '<section class="container section-tight" style="padding-top:50px"><div class="auth-wrap">' +
    '<div class="auth-tabs"><button class="active" type="button" data-auth-tab="login">登录</button><button type="button" data-auth-tab="register">注册</button></div>' +
    '<div class="card"><div class="card-body">' +
    '<div id="authLogin">' +
    '<h2 style="font-size:20px;margin-bottom:14px">欢迎回来</h2>' +
    '<div class="field"><label>账号</label><input class="input" id="loginUser" placeholder="学号 / 手机号 / 邮箱"></div>' +
    '<div class="field"><label>密码</label><input class="input" type="password" id="loginPass" placeholder="请输入密码"></div>' +
    '<button class="btn btn-primary btn-block" type="button" data-demo-login>登录</button>' +
    '<p class="hint" style="margin-top:12px">演示站点没有服务器，账号系统为占位功能。社团干部请使用页脚的「管理入口」进入后台。</p>' +
    "</div>" +
    '<div id="authRegister" hidden>' +
    '<h2 style="font-size:20px;margin-bottom:14px">注册社员账号</h2>' +
    '<div class="field"><label>昵称</label><input class="input" placeholder="社团里怎么称呼你"></div>' +
    '<div class="field"><label>手机号 / 邮箱</label><input class="input" placeholder="用于找回密码"></div>' +
    '<div class="field"><label>设置密码</label><input class="input" type="password" placeholder="至少 8 位"></div>' +
    '<button class="btn btn-primary btn-block" type="button" data-demo-register>注册并报名</button>' +
    '<p class="hint" style="margin-top:12px">注册即视为同意社团内部联络使用你填写的信息。真正的报名请到「加入我们」页面填写。</p>' +
    "</div>" +
    '<div class="notice-box" style="margin-top:16px">这是一个纯前端静态演示站：不会向任何服务器发送数据，所有内容都保存在你自己的浏览器里。</div>' +
    "</div></div>" +
    '<div style="margin-top:16px;text-align:center"><button class="linklike" type="button" id="loginAdmin">我是社团干部，前往后台管理 →</button></div>' +
    "</div></section>";
}

function notFound(msg, href, text) {
  return '<section class="container section-tight" style="padding-top:70px"><div class="empty-state" style="max-width:560px;margin:0 auto">' +
    '<div class="big">' + ic("search") + "</div><b>"+ esc(msg) + "</b>" +
    '<div style="margin-top:16px"><a class="btn btn-primary btn-sm" href="' + esc(href || "#/") + '">' + esc(text || "返回首页") + "</a></div>" +
    "</div></section>";
}


/* ============ 8. 上传作品 ============ */
const UP = { mediaKey: "", mediaUrl: "", mediaType: "", coverKey: "" };
function renderUpload() {
  const cats = ["插画", "摄影", "Cosplay", "视频", "手工"];
  const mine = (Store.data.works || []).filter((w) => w.author && w.author === myName());
  return pageHero("Upload", "上传作品", "投稿后会进入后台审核，管理员通过后就会出现在作品展示页。视频可以直接上传本地文件，也可以填写 B站 / YouTube 链接。") +
    '<section class="container section-tight"><div class="grid grid-2" style="gap:26px;align-items:start">' +
    '<div class="card form-card">' +
    '<h2 style="font-size:20px;margin-bottom:14px">新建投稿</h2>' +
    '<form id="uploadForm" novalidate>' +
    '<div class="field"><label>作品标题 <span class="req">*</span></label><input class="input" name="title" placeholder="给你的作品起个名字" required></div>' +
    '<div class="form-grid">' +
    '<div class="field"><label>作品分类 <span class="req">*</span></label><select class="select" name="category">' + cats.map((c) => "<option>"+ c + "</option>").join("") + "</select></div>" +
    '<div class="field"><label>作者署名 <span class="req">*</span></label><input class="input" name="author" value="' + esc(myName()) + '" placeholder="你的笔名 / 昵称" required></div>' +
    "</div>" +
    '<div class="field"><label>作品文件（图片或视频）</label>' +
    '<div class="upload-drop" id="upDrop"><div class="big">' + ic("upload") + "</div>" +
    "<b>点击选择文件，或把文件拖到这里</b>" +
    '<p class="hint">图片支持 JPG / PNG / WebP / GIF（建议 2MB 内）；视频支持 MP4 / WebM（建议 80MB 内）。文件保存在浏览器本地数据库，不会上传到任何服务器。</p>' +
    '<input type="file" id="upFile" accept="image/*,video/*" hidden></div>' +
    '<div id="upPreview"></div></div>' +
    '<div class="field"><label>外部视频链接（选填）</label><input class="input" name="link" placeholder="B站 / YouTube 链接，例如 https://www.bilibili.com/video/BV1xx411c7mD">' +
    '<p class="hint">填了链接就不必再上传视频文件；也支持 mp4 直链。</p></div>' +
    '<div class="field"><label>创作故事 / 作品说明</label><textarea class="textarea" name="desc" placeholder="用了什么工具？灵感来自哪里？想对看的人说什么？"></textarea></div>' +
    '<div id="upErr" class="err"></div>' +
    '<button class="btn btn-primary btn-lg btn-block" type="submit">' + ic("check") + " 提交审核</button>" +
    "</form></div>" +

    '<div><div class="card"><div class="card-body"><h3 style="margin-bottom:12px">投稿须知</h3>' +
    '<ul class="footer-list">' +
    "<li>1. 请只投稿自己创作或已获授权的作品，二创请注明原作与授权情况。</li>" +
    "<li>2. 涉及他人肖像的照片，需获得本人同意才能投稿。</li>" +
    "<li>3. 审核周期一般为 1-3 天，通过后会在作品展示页出现。</li>" +
    "<li>4. 本作品墙的数据保存在你自己的浏览器中；想让全社团都看到，请同时把作品发到社团 QQ 群或云盘。</li>" +
    "</ul></div></div>" +
    '<div class="card" style="margin-top:16px"><div class="card-body"><h3 style="margin-bottom:12px">我的投稿（' + mine.length + "）</h3>" +
    (mine.length ? mine.map((w) =>
      '<div class="kv-row"><div style="min-width:0"><div style="font-weight:700;font-size:14px">' + esc(w.title) + "</div>" +
      '<div class="muted tiny">' + esc(w.category) + " · "+ esc(fmtDate(w.date)) + "</div></div>" +
      '<span class="state ' + (w.status === "approved" ? "state-ongoing" : w.status === "pending" ? "state-pending" : "state-ended") + '">' +
      (w.status === "approved" ? "已通过" : w.status === "pending" ? "审核中" : "未通过") + "</span></div>").join("")
      : '<p class="muted tiny">还没有投稿记录。</p>') +
    '<a class="btn btn-ghost btn-block" style="margin-top:14px" href="#/gallery">' + ic("image") + " 去作品展示页看看</a>" +
    "</div></div>" +
    '<div class="card" style="margin-top:16px"><div class="card-body"><h3 style="margin-bottom:10px">' + ic("lock", "iico") + " 社团干部</h3>" +
    '<p class="muted tiny">审核投稿、发布公告、管理活动都在后台完成。</p>' +
    '<button class="btn btn-primary btn-block" type="button" data-open-admin>进入后台管理</button>' +
    "</div></div></div></div></section>";
}
function myName() { try { return localStorage.getItem("aneko_author") || "匿名社员"; } catch (e) { return "匿名社员"; } }
function setMyName(v) { try { localStorage.setItem("aneko_author", v); } catch (e) {} }

/* ============ 9. 后台管理 ============ */
const ADMIN_KEY = "aneko_admin_ok";
const ADMIN = { tab: "dash" };
function isAdmin() { try { return sessionStorage.getItem(ADMIN_KEY) === "1"; } catch (e) { return false; } }
function setAdmin(v) { try { v ? sessionStorage.setItem(ADMIN_KEY, "1") : sessionStorage.removeItem(ADMIN_KEY); } catch (e) {} }
function checkPassword(pw) { return String(pw) === String(Store.data.site.adminPassword || "admin123"); }

const ADMIN_TABS = [
  { id: "dash", name: "总览", icon: "chart" },
  { id: "posts", name: "公告管理", icon: "file" },
  { id: "events", name: "活动管理", icon: "calendar" },
  { id: "works", name: "作品审核", icon: "image" },
  { id: "carousel", name: "首页轮播", icon: "grid" },
  { id: "recommends", name: "安利墙", icon: "star" },
  { id: "members", name: "成员 / 部门", icon: "users" },
  { id: "signups", name: "报名管理", icon: "inbox" },
  { id: "site", name: "站点设置", icon: "settings" },
  { id: "data", name: "数据与导出", icon: "download" },
];
function renderAdminShell() {
  if (!isAdmin()) {
    return '<section class="container section-tight" style="padding-top:60px"><div class="card gate">' +
      '<div class="center" style="margin-bottom:16px"><div style="font-size:34px">' + ic("lock") + "</div>" +
      '<h2 style="font-size:20px">后台管理</h2><p class="muted tiny">请输入管理密码。默认密码 <b>admin123</b>，可在后台「站点设置」里修改。</p></div>' +
      '<div class="field"><label>管理密码</label><input class="input" type="password" id="adminPass" placeholder="请输入密码"></div>' +
      '<div id="gateErr" class="err"></div>' +
      '<button class="btn btn-primary btn-block" type="button" id="adminLoginBtn">' + ic("lock") + " 进入后台</button>" +
      '<p class="hint" style="margin-top:12px">提示：这是纯前端站点，密码只用于防止误操作，并不具备真实安全性。</p>' +
      "</div></section>";
  }
  const t = ADMIN.tab;
  return '<div class="container admin-shell">' +
    '<aside class="admin-side"><div class="card admin-card">' +
    '<div class="admin-menu">' + ADMIN_TABS.map((x) =>
      '<button type="button" class="' + (t === x.id ? "active" : "") + '" data-admin-tab="' + x.id + '">' + ic(x.icon) + "<span>"+ x.name + "</span>" +
      (x.id === "works" && pendingWorks().length ? '<span class="badge">' + pendingWorks().length + "</span>" : "") +
      (x.id === "signups" && (Store.data.signups || []).length ? '<span class="badge">' + (Store.data.signups || []).length + "</span>" : "") +
      "</button>").join("") + "</div>" +
    '<button class="btn btn-ghost btn-block" style="margin-top:12px" type="button" id="adminLogout">' + ic("logout") + " 退出后台</button>" +
    '<a class="btn btn-ghost btn-block" style="margin-top:8px" href="#/">' + ic("back") + " 返回前台</a>" +
    "</div></aside>" +
    '<div class="admin-main"><div id="adminPanel">' + renderAdminPanel(t) + "</div></div></div>";
}
function pendingWorks() { return (Store.data.works || []).filter((w) => w.status === "pending"); }

function adminTop(title, hint, toolbar) {
  return '<div class="admin-topbar"><div><h2>' + esc(title) + "</h2>" + (hint ? '<p class="admin-hint" style="margin:6px 0 0">' + hint + "</p>" : "") + "</div>" +
    '<div class="admin-toolbar">' + (toolbar || "") + "</div></div>";
}
function renderAdminPanel(t) {
  switch (t) {
    case "dash": return panelDash();
    case "posts": return panelPosts();
    case "events": return panelEvents();
    case "works": return panelWorks();
    case "carousel": return panelCarousel();
    case "recommends": return panelRecommends();
    case "members": return panelMembers();
    case "signups": return panelSignups();
    case "site": return panelSite();
    case "data": return panelData();
    default: return panelDash();
  }
}

function panelDash() {
  const d = Store.data;
  const works = d.works || [];
  const signups = d.signups || [];
  const recentSign = signups.slice(-6).reverse();
  return adminTop("总览", "社团运营数据一览。所有内容都保存在本机浏览器中，可随时导出备份。",
    '<button class="btn btn-primary btn-sm" type="button" data-admin-tab="posts">' + ic("plus") + " 发布公告</button>" +
    '<button class="btn btn-ghost btn-sm" type="button" data-admin-tab="events">' + ic("plus") + " 新建活动</button>") +
    '<div class="grid grid-4" style="gap:14px">' +
    dashStat(pendingWorks().length, "待审核作品", "warn") +
    dashStat(works.filter((w) => w.status === "approved").length, "已通过作品") +
    dashStat((d.events || []).filter((e) => eventState(e) !== "ended").length, "进行中活动") +
    dashStat((d.posts || []).length, "公告总数") +
    dashStat(signups.length, "报名总数") +
    dashStat((d.members || []).length, "成员条目") +
    dashStat((d.recommends || []).length, "安利条目") +
    dashStat((d.departments || []).length, "部门数量") +
    "</div>" +
    '<div class="admin-grid" style="margin-top:20px">' +
    '<div class="card admin-block"><h3>' + ic("inbox", "iico") + " 最新报名</h3>" +
    (recentSign.length ? recentSign.map((s) =>
      '<div class="kv-row"><div><div style="font-weight:700;font-size:14px">' + esc(s.name) + ' <span class="muted tiny">' + esc(s.dept || "未选部门") + "</span></div>" +
      '<div class="muted tiny">' + esc(s.grade || "") + " " + esc(s.major || "") + " · " + esc(s.contact) + " · "+ esc(relTime(s.at)) + "</div></div>" +
      '<button class="chip-btn" type="button" data-admin-tab="signups">查看</button></div>').join("")
      : '<p class="muted tiny">还没有报名记录。前台「加入我们」提交后会出现在这里。</p>') +
    "</div>" +
    '<div class="card admin-block"><h3>' + ic("image", "iico") + " 待审核作品</h3>" +
    (pendingWorks().length ? pendingWorks().slice(0, 5).map((w) =>
      '<div class="kv-row"><div><div style="font-weight:700;font-size:14px">' + esc(w.title) + '</div><div class="muted tiny">' + esc(w.author) + " · "+ esc(w.category) + "</div></div>" +
      '<div class="row-actions"><button class="chip-btn" type="button" data-work-approve="' + esc(w.id) + '">通过</button>' +
      '<button class="chip-btn danger" type="button" data-work-reject="' + esc(w.id) + '">拒绝</button></div></div>').join("")
      : '<p class="muted tiny">全部作品都已处理完毕。</p>') +
    "</div>" +
    '<div class="card admin-block"><h3>' + ic("settings", "iico") + " 快捷操作</h3>" +
    '<div class="row-actions" style="gap:8px">' +
    '<button class="chip-btn" type="button" data-admin-tab="carousel">编辑首页轮播</button>' +
    '<button class="chip-btn" type="button" data-admin-tab="site">修改联系方式</button>' +
    '<button class="chip-btn" type="button" data-admin-tab="data">导出全部数据</button>' +
    "</div>" +
    '<p class="muted tiny" style="margin-top:12px">建议每次大改内容后，到「数据与导出」里导出一次 JSON 备份。</p></div>' +
    "</div>";
}
function dashStat(n, label, kind) {
  return '<div class="stat"' + (kind === "warn" && n > 0 ? ' style="border-color:rgba(255,176,32,.5)"' : "") + "><b" + (kind === "warn" && n > 0 ? ' style="color:var(--warn)"' : "") + ">" + n + "</b><span>" + esc(label) + "</span></div>";
}

/* ---- 通用表单构建 ---- */
function fld(label, name, value, opts) {
  const o = opts || {};
  const v = value === undefined || value === null ? "" : value;
  if (o.type === "textarea") {
    return '<div class="field' + (o.span2 ? " span-2" : "") + '"><label>' + esc(label) + "</label>" +
      '<textarea class="textarea" name="' + name + '" style="min-height:' + (o.rows ? o.rows * 22 : 140) + 'px">' + esc(v) + "</textarea>" +
      (o.hint ? '<p class="hint">' + o.hint + "</p>" : "") + "</div>";
  }
  if (o.type === "select") {
    return '<div class="field' + (o.span2 ? " span-2" : "") + '"><label>' + esc(label) + "</label>" +
      '<select class="select" name="' + name + '">' + (o.options || []).map((op) => '<option value="' + esc(op) + '"' + (String(op) === String(v) ? " selected" : "") + ">"+ esc(op) + "</option>").join("") + "</select>" +
      (o.hint ? '<p class="hint">' + o.hint + "</p>" : "") + "</div>";
  }
  const type = o.type || "text";
  return '<div class="field' + (o.span2 ? " span-2" : "") + '"><label>' + esc(label) + "</label>" +
    '<input class="input" type="' + type + '" name="' + name + '" value="' + esc(v) + '" placeholder="' + esc(o.placeholder || "") + '">' +
    (o.hint ? '<p class="hint">' + o.hint + "</p>" : "") + "</div>";
}
function adminFormModal(title, fieldsHTML, dataName, wide, recordId) {
  openModal('<div class="modal-head"><h3>' + esc(title) + '</h3><button class="icon-btn" type="button" data-close-modal>' + ic("close") + "</button></div>" +
    '<div class="modal-content"><form data-admin-form="' + esc(dataName) + '" data-record-id="' + esc(recordId || "") + '">' +
    '<div class="form-grid">' + fieldsHTML + "</div>" +
    '<div id="formErr" class="err"></div>' +
    '<div class="confirm-actions" style="justify-content:flex-start;margin-top:18px">' +
    '<button class="btn btn-primary" type="submit">' + ic("check") + " 保存</button>" +
    '<button class="btn btn-ghost" type="button" data-close-modal>取消</button>' +
    "</div></form></div>", wide);
}
/** 表单取值 */
function readForm(form) {
  const o = {};
  $$("input, select, textarea", form).forEach((el) => {
    if (!el.name) return;
    o[el.name] = el.type === "checkbox" ? el.checked : el.value.trim();
  });
  return o;
}
function requireFields(o, names) {
  for (const n of names) if (!o[n]) return n;
  return null;
}

/* ---- 公告管理 ---- */
function panelPosts() {
  const list = sortedPosts();
  return adminTop("公告管理", "公告会按「置顶优先 + 时间倒序」显示在公告栏和首页。",
    '<button class="btn btn-primary btn-sm" type="button" id="newPost">' + ic("plus") + " 新建公告</button>") +
    '<div class="table-wrap"><table class="data"><thead><tr><th>封面</th><th>标题</th><th>标签</th><th>日期</th><th>置顶</th><th>操作</th></tr></thead><tbody>' +
    (list.length ? list.map((p) =>
      "<tr><td>" + miniThumb({ store: "posts", record: p.id, field: "cover", mediaKey: p.media || "", url: p.cover || "", label: "公告配图" }) + "</td>" +
      "<td><b>" + esc(p.title) + '</b><div class="muted tiny">' + esc((p.summary || "").slice(0, 40)) + "</div></td>" +
      "<td>" + esc(p.tag || "") + "</td><td>" + esc(fmtDate(p.date)) + "</td><td>" + (p.pinned ? "是" : "—") + "</td>" +
      '<td><div class="row-actions"><button class="chip-btn" type="button" data-post-edit="' + esc(p.id) + '">编辑</button>' +
      '<button class="chip-btn danger" type="button" data-del="posts:' + esc(p.id) + '">删除</button></div></td></tr>').join("")
      : '<tr><td colspan="6" class="muted">暂无公告</td></tr>') +
    "</tbody></table></div>";
}
function miniThumb(o) {
  return '<div class="thumb-mini">' + imgSlot({ key: "mini-" + o.store + "-"+ o.record, label: o.label, size: "120×80", store: o.store, record: o.record, field: o.field, mediaKey: o.mediaKey, kind: "image" }) + "</div>";
}
function postFields(p) {
  const x = p || {};
  return fld("标题", "title", x.title, { span2: true, placeholder: "公告标题" }) +
    fld("标签", "tag", x.tag || "公告", { type: "select", options: ["公告", "招新", "比赛", "通知", "安利", "活动"] }) +
    fld("发布日期", "date", x.date || isoShift(0), { type: "date" }) +
    fld("作者", "author", x.author || "社团") +
    fld("是否置顶", "pinned", String(!!x.pinned), { type: "select", options: ["false", "true"] }) +
    fld("摘要", "summary", x.summary, { span2: true, placeholder: "一句话摘要，显示在列表卡片上" }) +
    fld("正文内容", "content", x.content, { type: "textarea", span2: true, rows: 10, hint: "支持换行；不需要写 HTML。" });
}
function savePost(o, id) {
  const miss = requireFields(o, ["title"]);
  if (miss) return toast("请填写公告标题", "err");
  if (id) {
    const p = findById(Store.data.posts, id);
    if (p) Object.assign(p, { title: o.title, tag: o.tag, date: o.date, author: o.author, pinned: o.pinned === "true", summary: o.summary, content: o.content });
  } else {
    Store.data.posts.unshift({ id: uid("po"), cover: "", media: "", title: o.title, tag: o.tag, date: o.date, author: o.author, pinned: o.pinned === "true", summary: o.summary, content: o.content });
  }
  Store.save(); toast("公告已保存"); closeModal(); refreshAdminPanel();
}

/* ---- 活动管理 ---- */
function panelEvents() {
  const list = sortedEvents();
  return adminTop("活动管理", "活动状态由开始 / 结束时间自动计算，前台会按状态筛选。",
    '<button class="btn btn-primary btn-sm" type="button" id="newEvent">' + ic("plus") + " 新建活动</button>") +
    '<div class="table-wrap"><table class="data"><thead><tr><th>海报</th><th>活动</th><th>分类</th><th>时间</th><th>状态</th><th>报名</th><th>操作</th></tr></thead><tbody>' +
    (list.length ? list.map((e) => {
      const n = (Store.data.signups || []).filter((s) => s.eventId === e.id).length;
      return "<tr><td>" + miniThumb({ store: "events", record: e.id, field: "img", mediaKey: e.media || "", url: e.img || "", label: "活动海报" }) + "</td>" +
        "<td><b>" + esc(e.title) + '</b><div class="muted tiny">' + esc(e.place) + "</div></td>" +
        "<td>" + esc(e.category) + "</td><td>" + esc(fmtDateTime(e.start)) + "</td>" +
        "<td>" + stateBadge(e) + "</td><td>" + n + "</td>" +
        '<td><div class="row-actions"><button class="chip-btn" type="button" data-event-edit="' + esc(e.id) + '">编辑</button>' +
        '<button class="chip-btn" type="button" data-signup="' + esc(e.id) + '">代报名</button>' +
        '<button class="chip-btn danger" type="button" data-del="events:' + esc(e.id) + '">删除</button></div></td></tr>';
    }).join("") : '<tr><td colspan="7" class="muted">暂无活动</td></tr>') +
    "</tbody></table></div>";
}
function eventFields(e) {
  const x = e || {};
  return fld("活动名称", "title", x.title, { span2: true }) +
    fld("分类", "category", x.category || "观影会", { type: "select", options: ["观影会", "比赛", "漫展", "工坊", "外拍", "招新", "其他"] }) +
    fld("主办部门", "organizer", x.organizer || "组织部") +
    fld("开始时间", "start", x.start || isoShift(7) + "T19:00", { type: "datetime-local" }) +
    fld("结束时间", "end", x.end || isoShift(7) + "T21:00", { type: "datetime-local" }) +
    fld("地点", "place", x.place, { span2: true }) +
    fld("名额", "capacity", x.capacity || "不限人数") +
    fld("一句话简介", "summary", x.summary, { span2: true }) +
    fld("详细介绍", "content", x.content, { type: "textarea", span2: true, rows: 10, hint: "支持换行，写清流程与注意事项。" });
}
function saveEvent(o, id) {
  if (!o.title) return toast("请填写活动名称", "err");
  if (!o.start) return toast("请填写开始时间", "err");
  const patch = { title: o.title, category: o.category, organizer: o.organizer, start: o.start, end: o.end, place: o.place, capacity: o.capacity, summary: o.summary, content: o.content };
  if (id) {
    const ev = findById(Store.data.events, id);
    if (ev) Object.assign(ev, patch);
  } else {
    Store.data.events.push(Object.assign({ id: uid("ev"), img: "", media: "" }, patch));
  }
  Store.save(); toast("活动已保存"); closeModal(); refreshAdminPanel();
}

/* ---- 作品审核 ---- */
function panelWorks() {
  const list = (Store.data.works || []).slice().sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1) || (parseDate(b.date) || 0) - (parseDate(a.date) || 0));
  const stat = { pending: 0, approved: 0, rejected: 0 };
  list.forEach((w) => stat[w.status] = (stat[w.status] || 0) + 1);
  return adminTop("作品审核", "审核通过的图片 / 视频才会出现在作品展示页。点封面可以直接替换图片。",
    '<span class="tag">待审核 ' + stat.pending + '</span><span class="tag">已通过 ' + stat.approved + '</span><span class="tag">已拒绝 ' + (stat.rejected || 0) + "</span>" +
    '<button class="btn btn-primary btn-sm" type="button" id="newWork">' + ic("plus") + " 手动添加作品</button>") +
    '<div class="table-wrap"><table class="data"><thead><tr><th>预览</th><th>作品</th><th>分类</th><th>作者</th><th>状态</th><th>首页推荐</th><th>操作</th></tr></thead><tbody>' +
    (list.length ? list.map((w) =>
      "<tr><td>" + miniThumb({ store: "works", record: w.id, field: "img", mediaKey: w.media || "", url: w.img || "", label: "作品封面" }) + "</td>" +
      "<td><b>" + esc(w.title) + "</b>" + (w.link ? '<div class="muted tiny">' + ic("external") + " 外链视频</div>" : "") + "</td>" +
      "<td>" + esc(w.category) + "</td><td>" + esc(w.author) + "</td>" +
      '<td><span class="state ' + (w.status === "approved" ? "state-ongoing" : w.status === "pending" ? "state-pending" : "state-ended") + '">' +
      (w.status === "approved" ? "已通过" : w.status === "pending" ? "待审核" : "已拒绝") + "</span></td>" +
      "<td>" + (w.featured ? "★" : "—") + "</td>" +
      '<td><div class="row-actions">' +
      (w.status !== "approved" ? '<button class="chip-btn" type="button" data-work-approve="' + esc(w.id) + '">通过</button>' : '<button class="chip-btn warn" type="button" data-work-pending="' + esc(w.id) + '">下架</button>') +
      (w.status !== "rejected" ? '<button class="chip-btn danger" type="button" data-work-reject="' + esc(w.id) + '">拒绝</button>' : "") +
      '<button class="chip-btn" type="button" data-work-edit="' + esc(w.id) + '">编辑</button>' +
      '<button class="chip-btn" type="button" data-feature="' + esc(w.id) + '">' + (w.featured ? "取消推荐" : "推荐首页") + "</button>" +
      '<button class="chip-btn danger" type="button" data-del="works:' + esc(w.id) + '">删除</button>' +
      "</div></td></tr>").join("") : '<tr><td colspan="7" class="muted">暂无作品</td></tr>') +
    "</tbody></table></div>";
}
function workFields(w) {
  const x = w || {};
  return fld("作品标题", "title", x.title, { span2: true }) +
    fld("分类", "category", x.category || "插画", { type: "select", options: ["插画", "摄影", "Cosplay", "视频", "手工"] }) +
    fld("作者", "author", x.author || "", { placeholder: "署名" }) +
    fld("发布日期", "date", x.date || isoShift(0), { type: "date" }) +
    fld("状态", "status", x.status || "approved", { type: "select", options: ["approved", "pending", "rejected"] }) +
    fld("外部视频链接", "link", x.link || "", { span2: true, placeholder: "B站 / YouTube 链接或 mp4 直链" }) +
    fld("作品说明", "desc", x.desc, { type: "textarea", span2: true, rows: 6 }) +
    fld("首页推荐", "featured", String(!!x.featured), { type: "select", options: ["false", "true"] });
}
function saveWork(o, id) {
  if (!o.title) return toast("请填写作品标题", "err");
  const patch = { title: o.title, category: o.category, author: o.author, date: o.date, status: o.status, link: o.link, desc: o.desc, featured: o.featured === "true" };
  if (id) {
    const w = findById(Store.data.works, id);
    if (w) Object.assign(w, patch);
  } else {
    Store.data.works.push(Object.assign({ id: uid("wk"), img: "", media: "", mime: "" }, patch));
  }
  Store.save(); toast("作品已保存"); closeModal(); refreshAdminPanel();
}

/* ---- 轮播 / 安利墙 / 成员 ---- */
function panelCarousel() {
  return adminTop("首页轮播", "最多建议 3-5 张。点图片框即可上传本地图片（推荐 1920×1080）。",
    '<button class="btn btn-primary btn-sm" type="button" id="newSlide">' + ic("plus") + " 新增一屏</button>") +
    '<div class="grid grid-3">' + (Store.data.carousel || []).map((s, i) =>
      '<div class="card"><div class="media-thumb">' +
      imgSlot({ key: "admin-slide-" + s.id, label: "轮播图 " + (i + 1), size: "1920×1080", store: "carousel", record: s.id, field: "img", mediaKey: s.media || "", url: s.img || "", kind: "image" }) +
      '</div><div class="card-body"><h3>' + esc(s.title) + "</h3>" +
      '<p class="muted tiny">' + esc(s.eyebrow || "") + " · "+ esc(s.sub || "") + "</p>" +
      '<div class="row-actions"><button class="chip-btn" type="button" data-slide-edit="' + esc(s.id) + '">编辑文案</button>' +
      '<button class="chip-btn danger" type="button" data-del="carousel:' + esc(s.id) + '">删除</button></div></div></div>').join("") +
    "</div>";
}
function slideFields(s) {
  const x = s || {};
  return fld("主标题", "title", x.title, { span2: true }) +
    fld("副标题", "sub", x.sub, { span2: true }) +
    fld("英文小标", "eyebrow", x.eyebrow || "Club Profile") +
    fld("按钮文字", "btn", x.btn || "了解更多") +
    fld("按钮跳转", "link", x.link || "#/about", { placeholder: "#/about 或 https://…" });
}
function saveSlide(o, id) {
  if (!o.title) return toast("请填写主标题", "err");
  if (id) {
    const s = findById(Store.data.carousel, id);
    if (s) Object.assign(s, { title: o.title, sub: o.sub, eyebrow: o.eyebrow, btn: o.btn, link: o.link });
  } else {
    Store.data.carousel.push({ id: uid("slide"), img: "", media: "", title: o.title, sub: o.sub, eyebrow: o.eyebrow, btn: o.btn, link: o.link });
  }
  Store.save(); toast("轮播已保存"); closeModal(); refreshAdminPanel();
}
function panelRecommends() {
  const list = Store.data.recommends || [];
  return adminTop("安利墙", "番剧 / 游戏 / 漫画推荐，评分 0-10，会显示在首页与安利墙页面。",
    '<button class="btn btn-primary btn-sm" type="button" id="newRec">' + ic("plus") + " 新增条目</button>") +
    '<div class="table-wrap"><table class="data"><thead><tr><th>类型</th><th>名称</th><th>评分</th><th>推荐人</th><th>操作</th></tr></thead><tbody>' +
    (list.length ? list.map((r) =>
      "<tr><td>" + esc(r.type) + "</td><td><b>" + esc(r.title) + '</b><div class="muted tiny">' + esc((r.note || "").slice(0, 36)) + "</div></td>" +
      "<td>" + esc(String(r.score)) + "</td><td>" + esc(r.by) + "</td>" +
      '<td><div class="row-actions"><button class="chip-btn" type="button" data-rec-edit="' + esc(r.id) + '">编辑</button>' +
      '<button class="chip-btn danger" type="button" data-del="recommends:' + esc(r.id) + '">删除</button></div></td></tr>').join("")
      : '<tr><td colspan="5" class="muted">暂无条目</td></tr>') +
    "</tbody></table></div>";
}
function recFields(r) {
  const x = r || {};
  return fld("名称", "title", x.title, { span2: true }) +
    fld("类型", "type", x.type || "番剧", { type: "select", options: ["番剧", "游戏", "漫画"] }) +
    fld("评分（0-10）", "score", x.score || 8.5, { type: "number" }) +
    fld("推荐人", "by", x.by || "") +
    fld("链接（选填）", "link", x.link || "", { placeholder: "https://…" }) +
    fld("一句话短评", "note", x.note, { type: "textarea", span2: true, rows: 4 });
}
function saveRec(o, id) {
  if (!o.title) return toast("请填写名称", "err");
  const patch = { title: o.title, type: o.type, score: Number(o.score) || 0, by: o.by, link: o.link, note: o.note };
  if (id) {
    const r = findById(Store.data.recommends, id);
    if (r) Object.assign(r, patch);
  } else Store.data.recommends.unshift(Object.assign({ id: uid("rc") }, patch));
  Store.save(); toast("条目已保存"); closeModal(); refreshAdminPanel();
}
function panelMembers() {
  const depts = Store.data.departments || [];
  const members = Store.data.members || [];
  return adminTop("成员 / 部门", "头像框可以直接点着上传图片。部门图标是内置图标名。",
    '<button class="btn btn-primary btn-sm" type="button" id="newMember">' + ic("plus") + " 添加成员</button>" +
    '<button class="btn btn-ghost btn-sm" type="button" id="newDept">' + ic("plus") + " 添加部门</button>") +
    '<h3 style="font-size:16px;margin-bottom:10px">成员（' + members.length + "）</h3>" +
    '<div class="table-wrap" style="margin-bottom:24px"><table class="data"><thead><tr><th>头像</th><th>姓名</th><th>职务</th><th>部门</th><th>操作</th></tr></thead><tbody>' +
    (members.length ? members.map((m) =>
      "<tr><td>" + miniThumb({ store: "members", record: m.id, field: "avatar", mediaKey: m.media || "", url: m.avatar || "", label: "头像" }) + "</td>" +
      "<td><b>" + esc(m.name) + "</b></td><td>" + esc(m.role) + "</td><td>" + esc(m.dept) + "</td>" +
      '<td><div class="row-actions"><button class="chip-btn" type="button" data-member-edit="' + esc(m.id) + '">编辑</button>' +
      '<button class="chip-btn danger" type="button" data-del="members:' + esc(m.id) + '">删除</button></div></td></tr>').join("")
      : '<tr><td colspan="5" class="muted">暂无成员</td></tr>') + "</tbody></table></div>" +
    '<h3 style="font-size:16px;margin-bottom:10px">部门（' + depts.length + "）</h3>" +
    '<div class="table-wrap"><table class="data"><thead><tr><th>部门</th><th>职责</th><th>简介</th><th>操作</th></tr></thead><tbody>' +
    (depts.length ? depts.map((d) =>
      "<tr><td><b>" + esc(d.name) + "</b></td><td>" + esc(d.duty) + "</td>" +
      '<td class="muted tiny">' + esc((d.desc || "").slice(0, 50)) + "</td>" +
      '<td><div class="row-actions"><button class="chip-btn" type="button" data-dept-edit="' + esc(d.id) + '">编辑</button>' +
      '<button class="chip-btn danger" type="button" data-del="departments:' + esc(d.id) + '">删除</button></div></td></tr>').join("")
      : '<tr><td colspan="4" class="muted">暂无部门</td></tr>') + "</tbody></table></div>";
}
function memberFields(m) {
  const x = m || {};
  const deptNames = (Store.data.departments || []).map((d) => d.name);
  return fld("姓名 / 昵称", "name", x.name, { span2: true }) +
    fld("职务", "role", x.role || "社员", { placeholder: "如：绘画部部长" }) +
    fld("所属部门", "dept", x.dept || (deptNames[0] || "组织部"), { type: "select", options: deptNames.length ? deptNames : ["组织部"] }) +
    fld("一句话介绍", "intro", x.intro, { type: "textarea", span2: true, rows: 4 });
}
function saveMember(o, id) {
  if (!o.name) return toast("请填写姓名", "err");
  const patch = { name: o.name, role: o.role, dept: o.dept, intro: o.intro };
  if (id) {
    const m = findById(Store.data.members, id);
    if (m) Object.assign(m, patch);
  } else Store.data.members.push(Object.assign({ id: uid("mb"), avatar: "", media: "" }, patch));
  Store.save(); toast("成员已保存"); closeModal(); refreshAdminPanel();
}
function deptFields(d) {
  const x = d || {};
  return fld("部门名称", "name", x.name, { span2: true }) +
    fld("图标名", "icon", x.icon || "sparkle", { type: "select", options: ["users", "brush", "sparkle", "camera", "video", "play", "gamepad", "heart", "calendar", "music", "star", "settings"] }) +
    fld("职责关键词", "duty", x.duty || "", { placeholder: "如：插画创作 / 工坊教学" }) +
    fld("部门简介", "desc", x.desc, { type: "textarea", span2: true, rows: 5 });
}
function saveDept(o, id) {
  if (!o.name) return toast("请填写部门名称", "err");
  const patch = { name: o.name, icon: o.icon, duty: o.duty, desc: o.desc };
  if (id) {
    const d = findById(Store.data.departments, id);
    if (d) Object.assign(d, patch);
  } else Store.data.departments.push(Object.assign({ id: uid("dp") }, patch));
  Store.save(); toast("部门已保存"); closeModal(); refreshAdminPanel();
}

/* ---- 报名管理 ---- */
function panelSignups() {
  const list = (Store.data.signups || []).slice().reverse();
  return adminTop("报名管理", "前台「加入我们」与活动代报名的记录都会汇总在这里，可导出 CSV 用 Excel 打开。",
    '<button class="btn btn-primary btn-sm" type="button" id="newSignup">' + ic("plus") + " 手动登记</button>" +
    '<button class="btn btn-ghost btn-sm" type="button" id="exportSignups">' + ic("download") + " 导出 CSV</button>" +
    '<button class="btn btn-ghost btn-sm" type="button" data-del-all="signups">' + ic("trash") + " 清空报名</button>") +
    '<div class="table-wrap"><table class="data"><thead><tr><th>时间</th><th>姓名</th><th>学号</th><th>年级/专业</th><th>联系方式</th><th>部门</th><th>来源</th><th>操作</th></tr></thead><tbody>' +
    (list.length ? list.map((s) =>
      '<tr><td class="muted tiny">' + esc(relTime(s.at)) + "</td><td><b>" + esc(s.name) + "</b></td><td>"+ esc(s.sid || "") + "</td>" +
      "<td>" + esc(s.grade || "") + " " + esc(s.major || "") + "</td><td>" + esc(s.contact) + "</td><td>" + esc(s.dept || "") + "</td>" +
      "<td>" + esc(s.source || "招新报名") + "</td>" +
      '<td><div class="row-actions"><button class="chip-btn" type="button" data-signup-view="' + esc(s.id) + '">详情</button>' +
      '<button class="chip-btn danger" type="button" data-del="signups:' + esc(s.id) + '">删除</button></div></td></tr>').join("")
      : '<tr><td colspan="8" class="muted">还没有报名记录</td></tr>') +
    "</tbody></table></div>";
}
function signupFields(s) {
  const x = s || {};
  return fld("姓名", "name", x.name, {}) +
    fld("学号", "sid", x.sid || "", {}) +
    fld("年级", "grade", x.grade || "大一", { type: "select", options: ["大一", "大二", "大三", "大四", "研究生", "其他"] }) +
    fld("专业", "major", x.major || "") +
    fld("联系方式", "contact", x.contact || "", { span2: true, placeholder: "QQ / 微信 / 手机号" }) +
    fld("意向部门", "dept", x.dept || "只想当普通社员", { type: "select", options: ["只想当普通社员"].concat((Store.data.departments || []).map((d) => d.name)) }) +
    fld("备注 / 自我介绍", "intro", x.intro || "", { type: "textarea", span2: true, rows: 4 });
}
function saveSignup(o, id) {
  if (!o.name) return toast("请填写姓名", "err");
  const patch = { name: o.name, sid: o.sid, grade: o.grade, major: o.major, contact: o.contact, dept: o.dept, intro: o.intro };
  if (id) {
    const s = findById(Store.data.signups, id);
    if (s) Object.assign(s, patch);
  } else {
    Store.data.signups = Store.data.signups || [];
    Store.data.signups.push(Object.assign({ id: uid("sg"), at: new Date().toISOString(), source: "后台登记" }, patch));
  }
  Store.save(); toast("已保存"); closeModal(); refreshAdminPanel();
}

/* ---- 站点设置 ---- */
function panelSite() {
  const s = Store.data.site;
  return adminTop("站点设置", "这里的内容会同步到页头、页脚、首页简介与联系方式。") +
    '<div class="admin-grid">' +
    '<div class="card admin-block"><h3>' + ic('settings', 'iico') + ' 基本信息</h3><form data-admin-form="site">' +
    '<div class="form-grid">' +
    fld("社团名称", "name", s.name, { span2: true }) +
    fld("英文名", "nameEn", s.nameEn, { span2: true }) +
    fld("一句话标语", "slogan", s.slogan, { span2: true }) +
    fld("成立时间", "founded", s.founded, {}) +
    fld("在册人数", "members", s.members, { type: "number" }) +
    fld("社团简介", "intro", s.intro, { type: "textarea", span2: true, rows: 4 }) +
    "</div>" +
    '<button class="btn btn-primary" type="submit">' + ic("check") + " 保存基本信息</button></form></div>" +

    '<div class="card admin-block"><h3>' + ic('mail', 'iico') + ' 联系方式</h3><form data-admin-form="site">' +
    '<div class="form-grid">' +
    fld("邮箱", "email", s.email, {}) +
    fld("电话", "phone", s.phone, {}) +
    fld("QQ 群", "qq", s.qq, {}) +
    fld("活动地点", "place", s.place, {}) +
    fld("固定活动", "meeting", s.meeting, { span2: true }) +
    "</div>" +
    '<button class="btn btn-primary" type="submit">' + ic("check") + " 保存联系方式</button></form></div>" +

    '<div class="card admin-block"><h3>' + ic('heart', 'iico') + ' 招新设置</h3><form data-admin-form="site">' +
    '<div class="form-grid">' +
    fld("报名截止日期", "joinDeadline", s.joinDeadline, { type: "date" }) +
    fld("管理密码", "adminPassword", s.adminPassword, {}) +
    fld("招新说明", "joinNote", s.joinNote, { type: "textarea", span2: true, rows: 3 }) +
    "</div>" +
    '<button class="btn btn-primary" type="submit">' + ic('check') + ' 保存招新设置</button></form></div>' +

    '<div class="card admin-block"><h3>' + ic('file', 'iico') + ' 社团故事（关于页）</h3><form data-admin-form="story">' +
    fld("故事段落", "story", (s.story || []).join("\n\n"), { type: "textarea", span2: true, rows: 10, hint: "空行分段。" }) +
    '<button class="btn btn-primary" type="submit">' + ic("check") + " 保存故事</button></form></div>" +
    "</div>";
}
function saveSite(o) {
  const patch = {};
  ["name", "nameEn", "slogan", "founded", "email", "phone", "qq", "place", "meeting", "intro", "joinNote", "joinDeadline", "adminPassword"].forEach((k) => {
    if (o[k] !== undefined && o[k] !== "") patch[k] = o[k];
  });
  if (o.members !== undefined && o.members !== "") patch.members = Number(o.members) || 0;
  if (o.adminPassword) {
    const old = Store.data.site.adminPassword;
    patch.adminPassword = o.adminPassword;
    if (old !== o.adminPassword) toast("管理密码已更新为：" + o.adminPassword);
  }
  Object.assign(Store.data.site, patch);
  Store.save(); toast("站点设置已保存"); refreshAdminPanel(); refreshShell();
}
function saveStory(o) {
  Store.data.site.story = String(o.story || "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  Store.save(); toast("社团故事已保存");
}

/* ---- 数据与导出 ---- */
function panelData() {
  const size = (() => { try { return (JSON.stringify(Store.data).length / 1024).toFixed(1) + " KB"; } catch (e) { return "?"; } })();
  return adminTop("数据与导出", "全部内容保存在浏览器 localStorage 中。换电脑、清缓存前请先导出备份。") +
    '<div class="admin-grid">' +
    '<div class="card admin-block"><h3>' + ic("download", "iico") + " 导出</h3>" +
    '<p class="muted tiny">当前数据体积约 ' + size + "。JSON 可再次导入，CSV 适合用 Excel 打开报名表。</p>" +
    '<div class="row-actions" style="gap:8px;margin-top:12px">' +
    '<button class="chip-btn" type="button" data-export="json">导出全部数据（JSON）</button>' +
    '<button class="chip-btn" type="button" data-export="posts">导出公告 CSV</button>' +
    '<button class="chip-btn" type="button" data-export="events">导出活动 CSV</button>' +
    '<button class="chip-btn" type="button" data-export="works">导出作品 CSV</button>' +
    '<button class="chip-btn" type="button" data-export="signups">导出报名 CSV</button>' +
    "</div></div>" +
    '<div class="card admin-block"><h3>' + ic("upload", "iico") + " 导入 / 恢复</h3>" +
    '<p class="muted tiny">导入会覆盖当前全部内容，请先导出备份。</p>' +
    '<input type="file" id="importFile" accept="application/json" class="input" style="margin-top:12px">' +
    '<div class="row-actions" style="gap:8px;margin-top:12px">' +
    '<button class="chip-btn warn" type="button" data-del-all="works">清空全部作品</button>' +
    '<button class="chip-btn warn" type="button" data-del-all="posts">清空全部公告</button>' +
    '<button class="chip-btn warn" type="button" data-del-all="events">清空全部活动</button>' +
    '<button class="chip-btn danger" type="button" id="resetAll">恢复出厂演示内容</button>' +
    "</div></div>" +
    '<div class="card admin-block"><h3>' + ic('lock', 'iico') + ' 使用建议</h3>' +
    '<ul class="footer-list">' +
    "<li>1. 部署到 GitHub Pages 后，内容仍保存在每位访客自己的浏览器里 —— 别人看不到你的后台修改。</li>" +
    "<li>2. 想让所有人看到同一份内容：改 app.js 顶部的 DEMO 数据后重新部署。</li>" +
    "<li>3. 报名表数据只在提交者本机，招新现场建议固定用同一台设备登记，活动后导出 CSV。</li>" +
    "</ul></div></div>";
}
function toCSV(rows) {
  if (!rows.length) return "";
  const keys = Array.from(rows.reduce((set, r) => { Object.keys(r).forEach((k) => set.add(k)); return set; }, new Set()));
  const cell = (v) => '"' + String(v === undefined || v === null ? "" : v).replace(/"/g, '""') + '"';
  return "\ufeff" + keys.join(",") + "\n" + rows.map((r) => keys.map((k) => cell(r[k])).join(",")).join("\n");
}
function download(name, text, type) {
  const blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast("已开始下载：" + name);
}


/* ---- 关于我们 ---- */
const TECH = [
  { n: "纯静态前端", d: "HTML + CSS + 原生 JavaScript，没有构建步骤，没有依赖，双击就能打开。" },
  { n: "零外部资源", d: "不使用任何 CDN、字体库或图标库，图标全部是内联 SVG，断网也能完整显示。" },
  { n: "浏览器本地存储", d: "内容存在 localStorage，图片与视频存在 IndexedDB，刷新和关机都不会丢。" },
  { n: "一键部署", d: "可直接上传到 GitHub Pages / Cloudflare Pages / 任意虚拟主机。" },
  { n: "响应式优先", d: "以手机端为基准设计，招新现场扫码填表体验优先保证。" },
  { n: "可换肤", d: "深色 / 浅色一键切换，主题色集中在 CSS 变量里，改一行就能换配色。" },
];
function renderAbout() {
  const s = Store.data.site;
  const story = s.story && s.story.length ? s.story : (DEMO.site.story || []);
  const works = approvedWorks().length;
  return pageHero("About", "关于 " + s.name, "一个把「喜欢」认真做到底的社团。") +
    '<section class="container section-tight">' +
    '<div class="grid grid-2" style="gap:30px;align-items:start">' +
    "<div>" + story.map((p) => '<p class="detail-body" style="margin-bottom:16px">' + nl2br(p) + "</p>").join("") +
    '<div class="grid grid-2" style="margin-top:24px;gap:14px">' +
    aboutCard("sparkle", "热爱", "动画、漫画、游戏、绘画、摄影、Cosplay、音游，只要喜欢就能找到同频的人。") +
    aboutCard("brush", "创作", "社团鼓励产出：绘画工坊、剪辑教学、同人本企划，让兴趣变成作品。") +
    aboutCard("users", "协作", "从场地申请到漫展摊位，所有事都有人一起扛，新人上手就有伙伴。") +
    aboutCard("chart", "长期主义", "七年持续运营，活动有记录、素材有归档、经验有沉淀。") +
    "</div></div>" +
    '<aside><div class="card"><div class="card-body">' +
        '<h3 style="margin-bottom:14px">社团档案</h3>' +
    '<div class="info-list">' +
    infoItem("calendar", "成立时间", s.founded) +
    infoItem("users", "在册人数", s.members + " 人") +
    infoItem("clock", "固定活动", s.meeting) +
    infoItem("pin", "活动室", s.place) +
    infoItem("mail", "邮箱", s.email) +
    infoItem("phone", "电话", s.phone) +
    infoItem("users", "QQ 群", s.qq) +
    "</div></div></div>" +
    '<div class="card" style="margin-top:16px"><div class="card-body"><h3 style="margin-bottom:12px">数字一览</h3>' +
    '<div class="stat-row" style="margin-top:0">' +
    '<div class="stat"><b>' + esc(String(s.members || 0)) + "</b><span>在册社员</span></div>" +
    '<div class="stat"><b>' + esc(String((Store.data.events || []).length)) + "</b><span>活动场次</span></div>" +
    '<div class="stat"><b>' + esc(String(works)) + "</b><span>展出作品</span></div>" +
    '<div class="stat"><b>' + esc(String((Store.data.departments || []).length)) + "</b><span>下设部门</span></div>" +
    "</div>" +
    '<a class="btn btn-primary btn-block" style="margin-top:16px" href="#/join">加入我们 ' + ic("heart") + "</a>" +
    "</div></div></aside></div></section>" +

    '<section class="container section-tight"><div class="section-head"><div><div class="eyebrow">Departments</div><h2>我们在做什么</h2></div>' +
    '<a class="btn btn-ghost btn-sm" href="#/members">成员与部门 ' + ic("external") + "</a></div>" +
    '<div class="grid grid-3">' + (Store.data.departments || []).slice(0, 6).map((d) =>
      '<div class="card card-hover dept-card"><h3>' + ic(d.icon) + esc(d.name) + '</h3><p class="muted" style="font-size:14px">' + esc(d.desc) + "</p></div>").join("") +
    "</div></section>" +

    '<section class="container section-tight"><div class="section-head"><div><div class="eyebrow">Tech</div><h2>这个网站是怎么做的</h2><p class="muted">为什么它不需要服务器，也能长期用下去。</p></div></div>' +
    '<div class="grid grid-3">' + TECH.map((t) =>
      '<div class="card card-hover"><div class="card-body"><h3 style="font-size:16px">' + ic("check", "iico") + esc(t.n) + "</h3>" +
      '<p class="muted" style="font-size:14px;margin:0">' + esc(t.d) + "</p></div></div>").join("") +
    "</div></section>" +

    '<section class="container section-tight"><div class="join-hero">' +
    '<h2 style="font-size:clamp(22px,4vw,32px)">' + esc(s.slogan) + "</h2>" +
    '<p class="muted" style="max-width:660px;margin-top:10px">' + esc(s.joinNote || "") + "</p>" +
    '<div class="hero-cta" style="margin-top:18px"><a class="btn btn-primary btn-lg" href="#/join">填写报名表</a>' +
    '<a class="btn btn-ghost btn-lg" href="#/gallery">看成员作品</a></div></div></section>';
}
function aboutCard(icon, t, d) {
  return '<div class="card card-hover"><div class="card-body"><div style="color:var(--miku);margin-bottom:8px">' + ic(icon) + "</div>" +
    '<h4 style="font-size:16px;margin-bottom:6px">' + esc(t) + "</h4>" +
    '<p class="muted" style="font-size:13px;margin:0">' + esc(d) + "</p></div></div>";
}

/* ============ 10. 交互：轮播 / 筛选 / 表单 / 事件委托 ============ */
const Hero = {
  i: 0, timer: null,
  init(root) {
    this.root = root;
    const slides = $$(".hero-slide", root);
    if (!slides.length) return;
    this.go(0);
    this.timer = setInterval(() => this.next(), 6500);
  },
  go(i) {
    const root = this.root;
    const slides = $$(".hero-slide", root);
    if (!slides.length) return;
    this.i = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === this.i));
    $$(".hero-dots button", root).forEach((b, k) => b.classList.toggle("active", k === this.i));
    const data = (Store.data.carousel || [])[this.i] || {};
    const t = $("#heroTitle", root), s = $("#heroSub", root), e = $("#heroEyebrow", root), b = $("#heroBtn", root);
    if (t) t.textContent = data.title || "";
    if (s) s.textContent = data.sub || "";
    if (e) e.textContent = data.eyebrow || "Club Profile";
    if (b) { b.textContent = data.btn || "了解更多"; b.setAttribute("href", data.link || "#/about"); }
  },
  next() { this.go(this.i + 1); },
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; },
};

function initVisibleView() {
  const view = $(".view:not([hidden])");
  if (!view) return;
  initImageSlots(view);
  Hero.stop();
  if (view.id === "view-home") {
    Hero.init($("#hero", view));
    Particles.start($("#particleLayer"));
    Countdown.el = $("#heroCountdown");
    Countdown.start();
  } else {
    Particles.start($("#particleLayer"));
    Countdown.el = $("#eventsCountdown");
    if (Countdown.el) Countdown.start(); else Countdown.stop();
  }
  if (view.id === "view-upload") bindUploadForm();
  verifyMedias(view);
}
/** 检查 IndexedDB 里的媒体是否还能读出来；读不出来的槽位给出提示 */
async function verifyMedias(root) {
  const slots = $$(".img-slot", root).filter((s) => s.dataset.mediaKey);
  for (const s of slots) {
    const info = await MediaDB.info(s.dataset.mediaKey);
    if (!info) s.title = "这条媒体记录已丢失，请重新上传";
  }
}
/** 数据变化后刷新「非结构性」数字（点赞数等） */
function refreshDynamicBits() {
  const view = $(".view:not([hidden])");
  if (!view) return;
  $$("[data-like]", view).forEach((b) => {
    const id = b.dataset.like;
    const n = (Store.data.stats && Store.data.stats["like_" + id]) || 0;
    if (b.classList.contains("btn")) b.innerHTML = ic("heart") + " 点赞（" + n + "）";
    else b.innerHTML = ic("heart") + " 点赞";
  });
}

/* --- 点赞 --- */
function toggleLike(id) {
  Store.data.stats = Store.data.stats || {};
  const key = "like_" + id;
  Store.data.stats[key] = (Store.data.stats[key] || 0) + 1;
  Store.save();
  toast("感谢支持！已点赞 " + Store.data.stats[key] + " 次");
  route(true);
}
/* --- 浏览计数 --- */
function countView(id) {
  Store.data.stats = Store.data.stats || {};
  const key = "view_" + id;
  Store.data.stats[key] = (Store.data.stats[key] || 0) + 1;
  Store.save();
}

/* --- 活动报名弹窗 --- */
function openSignup(evId) {
  const ev = findById(Store.data.events, evId);
  if (!ev) return toast("活动不存在", "err");
  openModal('<div class="modal-head"><h3>报名：' + esc(ev.title) + '</h3>' +
    '<button class="icon-btn" type="button" data-close-modal>' + ic("close") + "</button></div>" +
    '<div class="modal-content"><p class="muted tiny">时间：' + esc(fmtCN(ev.start, true)) + " · 地点："+ esc(ev.place) + "</p>" +
    '<form id="signupForm" data-event="' + esc(ev.id) + '"><div class="form-grid">' +
    '<div class="field"><label>姓名 <span class="req">*</span></label><input class="input" name="name" required></div>' +
    '<div class="field"><label>学号</label><input class="input" name="sid"></div>' +
    '<div class="field"><label>年级</label><select class="select" name="grade"><option>大一</option><option>大二</option><option>大三</option><option>大四</option><option>研究生</option><option>其他</option></select></div>' +
    '<div class="field"><label>联系方式 <span class="req">*</span></label><input class="input" name="contact" required placeholder="QQ / 微信 / 手机号"></div>' +
    '<div class="field span-2"><label>备注</label><textarea class="textarea" name="intro" style="min-height:80px" placeholder="需要社团提供道具？想组队？"></textarea></div>' +
    '</div><div id="signupErr" class="err"></div>' +
    '<button class="btn btn-primary btn-block" type="submit">' + ic("check") + " 确认报名</button>" +
    "</form></div>");
}

/* --- 上传页逻辑 --- */
function bindUploadForm() {
  const drop = $("#upDrop"), input = $("#upFile");
  if (!drop || !input) return;
  drop.addEventListener("click", () => input.click());
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault(); drop.classList.remove("over");
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleUploadFile(f);
  });
  input.addEventListener("change", () => { const f = input.files && input.files[0]; if (f) handleUploadFile(f); });
}
async function handleUploadFile(file) {
  const isVideo = /^video\//.test(file.type);
  const isImage = /^image\//.test(file.type);
  if (!isVideo && !isImage) return toast("只支持图片或视频文件", "err");
  const limitMB = isVideo ? 120 : 8;
  if (file.size > limitMB * 1024 * 1024) return toast((isVideo ? "视频" : "图片") + "太大，请控制在 " + limitMB + "MB 内", "err");
  toast("正在保存到本地媒体库…");
  const key = await MediaDB.put(file);
  if (!key) return toast("保存失败：浏览器存储可能已满", "err");
  UP.mediaKey = key;
  UP.mediaType = file.type;
  UP.mediaUrl = await MediaDB.url(key);
  const box = $("#upPreview");
  if (box) {
    box.innerHTML = '<div class="media-preview">' + (isVideo
      ? '<video src="' + esc(UP.mediaUrl) + '" controls playsinline></video>'
      : '<img src="' + esc(UP.mediaUrl) + '" alt="预览">') + "</div>" +
      '<p class="hint">已选择：' + esc(file.name) + "（"+ (file.size / 1024 / 1024).toFixed(2) + "MB）</p>";
  }
  toast("文件已就绪，可以提交审核了");
}
function submitUpload(form) {
  const o = readForm(form);
  if (!o.title) { $("#upErr").textContent = "请填写作品标题"; return; }
  if (!o.author) { $("#upErr").textContent = "请填写作者署名"; return; }
  if (!UP.mediaKey && !o.link) { $("#upErr").textContent = "请上传一个作品文件，或填写外部视频链接"; return; }
  if (o.link && toEmbed(o.link).kind === "link") { $("#upErr").textContent = "这个链接无法识别为 B站 / YouTube / mp4 直链，请检查一下"; return; }
  setMyName(o.author);
  const isVideo = o.category === "视频" || /^video\//.test(UP.mediaType);
  Store.data.works.push({
    id: uid("wk"), title: o.title, category: o.category, author: o.author,
    date: isoShift(0), status: "pending", desc: o.desc || "",
    img: UP.mediaKey ? UP.mediaUrl : "", media: UP.mediaKey || "", mime: UP.mediaType || "",
    link: o.link || "", featured: false, isVideo: isVideo,
  });
  Store.save();
  UP.mediaKey = ""; UP.mediaUrl = ""; UP.mediaType = "";
  toast("投稿成功！等待管理员审核");
  route(true);
}


/* --- 全局点击事件委托（只绑定一次，所有动态内容都能响应） --- */
function onClick(e) {
  const t = e.target;

  /* 弹窗 / 确认框关闭 */
  if (t.closest("[data-close-modal]")) { closeModal(); return; }

  /* 轮播 */
  if (t.closest("[data-slide-next]")) { Hero.next(); return; }
  if (t.closest("[data-slide-prev]")) { Hero.go(Hero.i - 1); return; }
  const go = t.closest("[data-slide-go]");
  if (go) { Hero.go(Number(go.dataset.slideGo)); return; }

  /* 筛选：活动 */
  const evState = t.closest("[data-ev-state]");
  if (evState) { EV_FILTER.state = evState.dataset.evState; route(true); return; }
  const evCat = t.closest("[data-ev-cat]");
  if (evCat) { EV_FILTER.cat = evCat.dataset.evCat; route(true); return; }
  /* 筛选：作品 */
  const galCat = t.closest("[data-gal-cat]");
  if (galCat) { GAL_FILTER.cat = galCat.dataset.galCat; route(true); return; }
  const galKind = t.closest("[data-gal-kind]");
  if (galKind) { GAL_FILTER.kind = galKind.dataset.galKind; route(true); return; }
  /* 筛选：安利墙 */
  const recType = t.closest("[data-rec-type]");
  if (recType) { REC_FILTER.type = recType.dataset.recType; route(true); return; }

  /* 点赞 */
  const like = t.closest("[data-like]");
  if (like) { toggleLike(like.dataset.like); return; }

  /* 活动报名 */
  const su = t.closest("[data-signup]");
  if (su) { openSignup(su.dataset.signup); return; }

  /* FAQ 折叠 */
  const faq = t.closest("[data-faq]");
  if (faq) { faq.parentElement.classList.toggle("open"); return; }

  /* 登录 / 注册演示 */
  const authTab = t.closest("[data-auth-tab]");
  if (authTab) {
    const login = authTab.dataset.authTab === "login";
    $$("[data-auth-tab]").forEach((b) => b.classList.toggle("active", b === authTab));
    $("#authLogin").hidden = !login;
    $("#authRegister").hidden = login;
    return;
  }
  if (t.closest("[data-demo-login]")) return toast("演示站点：账号系统未接入服务器", "err");
  if (t.closest("[data-demo-register]")) { toast("演示站点：请到「加入我们」页面填写报名表"); location.hash = "#/join"; return; }
  if (t.closest("[data-open-admin]") || t.closest("#loginAdmin") || t.closest("#adminEntry")) {
    if (t.closest("#adminEntry") && !isAdmin()) ADMIN.tab = "dash";
    location.hash = "#/admin";
    if (location.hash === "#/admin") route(true);
    return;
  }

  /* 复制文本 */
  const copyBtn = t.closest("[data-copy-text]");
  if (copyBtn) { copyText(copyBtn.dataset.copyText); return; }
  if (t.closest("[data-copy-qq]")) { copyText(Store.data.site.qq || ""); return; }
  const share = t.closest("[data-share-event]");
  if (share) {
    const ev = findById(Store.data.events, share.dataset.shareEvent);
    if (ev) copyText("【" + ev.title + "】\n时间：" + fmtCN(ev.start, true) + "\n地点：" + ev.place + "\n" + (ev.summary || "") + "\n来源：" + Store.data.site.name);
    return;
  }

  /* 后台：切换标签 */
  const at = t.closest("[data-admin-tab]");
  if (at) { ADMIN.tab = at.dataset.adminTab; refreshAdminPanel(); return; }

  /* 后台：新增 / 编辑各类内容 */
  if (t.closest("#newPost")) { adminFormModal("新建公告", postFields(null), "posts"); return; }
  const pe = t.closest("[data-post-edit]");
  if (pe) { adminFormModal("编辑公告", postFields(findById(Store.data.posts, pe.dataset.postEdit)), "posts", false, pe.dataset.postEdit); return; }
  if (t.closest("#newEvent")) { adminFormModal("新建活动", eventFields(null), "events", true); return; }
  const ee = t.closest("[data-event-edit]");
  if (ee) { adminFormModal("编辑活动", eventFields(findById(Store.data.events, ee.dataset.eventEdit)), "events", true, ee.dataset.eventEdit); return; }
  if (t.closest("#newWork")) { adminFormModal("添加作品", workFields(null), "works", true); return; }
  const we = t.closest("[data-work-edit]");
  if (we) { adminFormModal("编辑作品", workFields(findById(Store.data.works, we.dataset.workEdit)), "works", true, we.dataset.workEdit); return; }
  if (t.closest("#newSlide")) { adminFormModal("新增轮播屏", slideFields(null), "carousel"); return; }
  const se = t.closest("[data-slide-edit]");
  if (se) { adminFormModal("编辑轮播文案", slideFields(findById(Store.data.carousel, se.dataset.slideEdit)), "carousel", false, se.dataset.slideEdit); return; }
  if (t.closest("#newRec")) { adminFormModal("新增安利条目", recFields(null), "recommends"); return; }
  const re = t.closest("[data-rec-edit]");
  if (re) { adminFormModal("编辑安利条目", recFields(findById(Store.data.recommends, re.dataset.recEdit)), "recommends", false, re.dataset.recEdit); return; }
  if (t.closest("#newMember")) { adminFormModal("添加成员", memberFields(null), "members"); return; }
  const me = t.closest("[data-member-edit]");
  if (me) { adminFormModal("编辑成员", memberFields(findById(Store.data.members, me.dataset.memberEdit)), "members", false, me.dataset.memberEdit); return; }
  if (t.closest("#newDept")) { adminFormModal("添加部门", deptFields(null), "departments"); return; }
  const de = t.closest("[data-dept-edit]");
  if (de) { adminFormModal("编辑部门", deptFields(findById(Store.data.departments, de.dataset.deptEdit)), "departments", false, de.dataset.deptEdit); return; }
  if (t.closest("#newSignup")) { adminFormModal("手动登记报名", signupFields(null), "signups"); return; }
  const sv = t.closest("[data-signup-view]");
  if (sv) {
    const s = findById(Store.data.signups, sv.dataset.signupView);
    if (s) openModal('<div class="modal-head"><h3>报名详情：' + esc(s.name) + '</h3><button class="icon-btn" type="button" data-close-modal>' + ic("close") + "</button></div>" +
      '<div class="modal-content"><div class="info-list">' +
      infoItem("user", "姓名", s.name) + infoItem("file", "学号", s.sid) + infoItem("calendar", "年级 / 专业", (s.grade || "") + " " + (s.major || "")) +
      infoItem("phone", "联系方式", s.contact) + infoItem("users", "意向部门", s.dept) + infoItem("clock", "提交时间", fmtDateTime(s.at)) +
      infoItem("file", "自我介绍", s.intro || "—") + "</div>" +
      '<button class="btn btn-primary btn-block" style="margin-top:16px" type="button" data-copy-text="' + esc(signupText(s)) + '">' + ic("copy") + " 复制为文本</button></div>");
    return;
  }

  /* 后台：作品审核快捷操作 */
  const ap = t.closest("[data-work-approve]");
  if (ap) { setWorkStatus(ap.dataset.workApprove, "approved"); return; }
  const rj = t.closest("[data-work-reject]");
  if (rj) { setWorkStatus(rj.dataset.workReject, "rejected"); return; }
  const pd = t.closest("[data-work-pending]");
  if (pd) { setWorkStatus(pd.dataset.workPending, "pending"); return; }
  const ft = t.closest("[data-feature]");
  if (ft) {
    const w = findById(Store.data.works, ft.dataset.feature);
    if (w) { w.featured = !w.featured; Store.save(); toast(w.featured ? "已加入首页推荐" : "已取消首页推荐"); refreshAdminPanel(); afterRender(); }
    return;
  }

  /* 后台：导出 */
  const ex = t.closest("[data-export]");
  if (ex) { doExport(ex.dataset.export); return; }
  if (t.closest("#exportSignups")) { doExport("signups"); return; }

  /* 后台：删除单条 */
  const del = t.closest("[data-del]");
  if (del) {
    const parts = del.dataset.del.split(":");
    removeRecord(parts[0], parts[1]);
    return;
  }
  /* 后台：清空某类 */
  const delAll = t.closest("[data-del-all]");
  if (delAll) { clearCollection(delAll.dataset.delAll); return; }

  /* 后台：退出 / 恢复出厂 */
  if (t.closest("#adminLogout")) { setAdmin(false); toast("已退出后台"); location.hash = "#/"; return; }
  if (t.closest("#resetAll")) {
    confirmBox("恢复出厂内容", "将删除你所有的本地修改，恢复成内置的演示内容。确定继续吗？", "恢复").then((ok) => {
      if (!ok) return;
      Store.reset(); toast("已恢复出厂演示内容"); ADMIN.tab = "dash"; route(true);
    });
    return;
  }
  if (t.closest("#adminLoginBtn")) {
    const pw = $("#adminPass").value;
    if (checkPassword(pw)) { setAdmin(true); toast("欢迎回来，管理员"); route(true); }
    else { $("#gateErr").textContent = "密码不正确，默认密码是 admin123"; }
    return;
  }
  if (t.closest("#importFile")) return;
}
function signupText(s) {
  return "姓名：" + s.name + "\n学号：" + (s.sid || "") + "\n年级专业：" + (s.grade || "") + " " + (s.major || "") +
    "\n联系方式：" + s.contact + "\n意向部门：" + (s.dept || "") + "\n自我介绍：" + (s.intro || "") + "\n提交时间：" + fmtDateTime(s.at);
}
function setWorkStatus(id, status) {
  const w = findById(Store.data.works, id);
  if (!w) return;
  w.status = status;
  if (status === "approved" && !w.date) w.date = isoShift(0);
  Store.save();
  toast(status === "approved" ? "已通过审核" : status === "rejected" ? "已拒绝该作品" : "已下架，回到待审核");
  refreshAdminPanel(); afterRender();
}
function removeRecord(coll, id) {
  const names = { posts: "公告", events: "活动", works: "作品", recommends: "安利条目", members: "成员", departments: "部门", signups: "报名记录", carousel: "轮播屏" };
  const target = (Store.data[coll] || []).find((x) => x.id === id);
  const label = target ? (target.title || target.name || id) : id;
  confirmBox("删除" + (names[coll] || "记录"), "确定要删除「" + label + "」吗？此操作不可撤销。", "删除").then((ok) => {
    if (!ok) return;
    Store.data[coll] = (Store.data[coll] || []).filter((x) => x.id !== id);
    Store.save(); toast("已删除"); refreshAdminPanel(); afterRender();
  });
}
function clearCollection(coll) {
  const names = { works: "全部作品", posts: "全部公告", events: "全部活动", signups: "全部报名记录" };
  confirmBox("清空" + (names[coll] || "数据"), "将删除" + (names[coll] || "该分类") + "，且不可恢复。确定继续吗？", "清空").then((ok) => {
    if (!ok) return;
    Store.data[coll] = [];
    Store.save(); toast("已清空"); refreshAdminPanel(); afterRender();
  });
}
function doExport(kind) {
  if (kind === "json") {
    download("aneko-site-data-" + isoShift(0) + ".json", JSON.stringify(Store.data, null, 2), "application/json;charset=utf-8");
    return;
  }
  const rows = (Store.data[kind] || []).map((x) => {
    const o = {};
    Object.keys(x).forEach((k) => { o[k] = typeof x[k] === "object" ? JSON.stringify(x[k]) : x[k]; });
    return o;
  });
  if (!rows.length) return toast("没有可导出的数据", "err");
  const names = { posts: "公告", events: "活动", works: "作品", signups: "报名", recommends: "安利" };
  download("aneko-" + kind + "-" + isoShift(0) + ".csv", toCSV(rows), "text/csv;charset=utf-8");
}
function copyText(text) {
  const str = String(text || "");
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = str; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("已复制到剪贴板"); } catch (err) { toast("复制失败，请手动选择文本", "err"); }
    ta.remove();
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(str).then(() => toast("已复制到剪贴板")).catch(fallback);
  } else fallback();
}

/* --- 表单提交（委托） --- */
function onSubmit(e) {
  const form = e.target;
  if (!form || form.tagName !== "FORM") return;
  e.preventDefault();

  /* 后台通用表单 */
  if (form.dataset.adminForm) {
    const kind = form.dataset.adminForm;
    const o = readForm(form);
    const id = form.dataset.recordId || "";
    if (kind === "posts") return savePost(o, id);
    if (kind === "events") return saveEvent(o, id);
    if (kind === "works") return saveWork(o, id);
    if (kind === "carousel") return saveSlide(o, id);
    if (kind === "recommends") return saveRec(o, id);
    if (kind === "members") return saveMember(o, id);
    if (kind === "departments") return saveDept(o, id);
    if (kind === "signups") return saveSignup(o, id);
    if (kind === "site") return saveSite(o);
    if (kind === "story") return saveStory(o);
    return;
  }

  /* 活动报名 */
  if (form.id === "signupForm") {
    const o = readForm(form);
    if (!o.name || !o.contact) { $("#signupErr").textContent = "请填写姓名与联系方式"; return; }
    Store.data.signups = Store.data.signups || [];
    Store.data.signups.push({ id: uid("sg"), eventId: form.dataset.event, source: "活动报名", at: new Date().toISOString(), name: o.name, sid: o.sid, grade: o.grade, contact: o.contact, intro: o.intro, dept: "" });
    Store.save(); closeModal(); toast("报名成功！活动前一天会有人联系你");
    route(true);
    return;
  }

  /* 招新报名 */
  if (form.id === "joinFormEl") {
    const o = readForm(form);
    const err = $("#joinErr");
    if (!o.name) { err.textContent = "请填写姓名"; return; }
    if (!o.sid) { err.textContent = "请填写学号"; return; }
    if (!o.contact) { err.textContent = "请留下联系方式（QQ / 微信 / 手机号）"; return; }
    if (!o.agree) { err.textContent = "请先勾选同意条款"; return; }
    Store.data.signups = Store.data.signups || [];
    Store.data.signups.push({ id: uid("sg"), source: "招新报名", at: new Date().toISOString(), eventId: "", name: o.name, sid: o.sid, grade: o.grade, major: o.major, contact: o.contact, dept: o.dept, skill: o.skill, intro: o.intro });
    Store.save();
    openModal('<div class="modal-head"><h3>报名成功</h3><button class="icon-btn" type="button" data-close-modal>' + ic("close") + "</button></div>" +
      '<div class="modal-content center"><div style="font-size:44px;color:var(--miku)">' + ic("check") + "</div>" +
      '<h3 style="margin:12px 0 6px">欢迎加入 ' + esc(Store.data.site.name) + "！</h3>" +
      '<p class="muted">我们已收到你的信息，组织部会在 48 小时内通过你留下的联系方式与你沟通。</p>' +
      '<p class="muted tiny">你的报名信息保存在本机浏览器中，社团干部可在后台「报名管理」里查看与导出。</p>' +
      '<div class="row-actions" style="justify-content:center;gap:8px;margin-top:14px">' +
      '<button class="btn btn-primary btn-sm" type="button" data-copy-qq>复制 QQ 群号：' + esc(Store.data.site.qq) + "</button>" +
      '<a class="btn btn-ghost btn-sm" href="#/events" data-close-modal>看看近期活动</a></div></div>');
    form.reset();
    return;
  }

  /* 上传作品 */
  if (form.id === "uploadForm") {
    submitUpload(form);
    return;
  }
}
/* 输入框防抖：搜索 / 排序 */
function onInput(e) {
  const t = e.target;
  if (t.id === "postSearch") { POST_FILTER.q = t.value; softReplace(renderPosts(), "view-posts", t); }
  if (t.id === "galSearch") { GAL_FILTER.q = t.value; softReplace(renderGallery(), "view-gallery", t); }
}
function onChange(e) {
  const t = e.target;
  if (t.id === "galSort") { GAL_FILTER.sort = t.value; route(true); }
  if (t.id === "adminPass") { /* 回车提交 */ }
}
/** 局部刷新：保留输入框焦点（用于搜索） */
function softReplace(html, viewId, focusEl) {
  const view = $("#" + viewId);
  if (!view) return;
  const sel = focusEl.id;
  view.innerHTML = html;
  const again = $("#" + sel);
  if (again) { again.focus(); const v = again.value; again.value = ""; again.value = v; }
  initImageSlots(view);
}

/* ============ 11. 路由 ============ */
const ROUTES = ["home", "about", "events", "event", "gallery", "work", "upload", "posts", "post", "members", "recommend", "join", "login", "admin"];
function parseHash() {
  const h = (location.hash || "#/").replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  const name = parts[0] || "home";
  return { name: ROUTES.indexOf(name) >= 0 ? name : "notfound", arg: parts[1] || "", tab: parts[1] || "" };
}
function showView(id) {
  $$(".view").forEach((v) => { v.hidden = v.id !== id; });
}
function setActiveNav(name) {
  const map = { home: "home", about: "about", events: "events", event: "events", gallery: "gallery", work: "gallery", upload: "upload", posts: "posts", post: "posts", members: "members", recommend: "recommend", join: "join", login: "login", admin: "admin" };
  const key = map[name] || name;
  $$("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === key));
}
function route(keepScroll) {
  const r = parseHash();
  const y = keepScroll ? window.scrollY : 0;
  let html = "";
  let viewId = "view-" + r.name;
  switch (r.name) {
    case "home": html = renderHome(); viewId = "view-home"; break;
    case "about": html = renderAbout(); viewId = "view-about"; break;
    case "events": html = renderEvents(); viewId = "view-events"; break;
    case "event": html = renderEventDetail(r.arg); viewId = "view-event-detail"; break;
    case "gallery": html = renderGallery(); viewId = "view-gallery"; break;
    case "work": html = renderWorkDetail(r.arg); viewId = "view-work-detail"; break;
    case "upload": html = renderUpload(); viewId = "view-upload"; break;
    case "posts": html = renderPosts(); viewId = "view-posts"; break;
    case "post": html = renderPostDetail(r.arg); viewId = "view-post-detail"; break;
    case "members": html = renderMembers(); viewId = "view-members"; break;
    case "recommend": html = renderRecommend(); viewId = "view-recommend"; break;
    case "join": html = renderJoin(); viewId = "view-join"; break;
    case "login": html = renderLogin(); viewId = "view-login"; break;
    case "admin":
      if (r.tab && ADMIN_TABS.some((x) => x.id === r.tab)) ADMIN.tab = r.tab;
      html = renderAdminShell(); viewId = "view-admin"; break;
    default: html = notFound("页面不存在", "#/", "回到首页"); viewId = "view-home";
  }
  const el = $("#" + viewId);
  el.innerHTML = html;
  showView(viewId);
  setActiveNav(r.name);
  document.title = titleFor(r) + " · " + Store.data.site.name;
  if (r.name === "work" && r.arg && !$(".empty-state", el)) countView(r.arg);
  if (!keepScroll) window.scrollTo(0, 0); else window.scrollTo(0, y);
  afterRender();
}
function titleFor(r) {
  const map = { home: "首页", about: "关于我们", events: "活动日历", event: "活动详情", gallery: "作品展示", work: "作品详情", upload: "上传作品", posts: "公告栏", post: "公告详情", members: "成员与部门", recommend: "番剧安利", join: "加入我们", login: "登录 / 注册", admin: "后台管理" };
  return map[r.name] || "页面不存在";
}
function afterRender() {
  initVisibleView();
  refreshDynamicBits();
}
/** 后台局部刷新（不改变滚动位置） */
function refreshAdminPanel() {
  const wrap = $("#view-admin");
  if (!wrap) return;
  const y = window.scrollY;
  wrap.innerHTML = renderAdminShell();
  window.scrollTo(0, y);
  initImageSlots(wrap);
}

/* ============ 12. 启动 ============ */
function refreshShell() {
  const s = Store.data.site;
  $$("[data-brand-name]").forEach((el) => { el.textContent = s.name; });
  $$("[data-brand-en]").forEach((el) => { el.textContent = s.nameEn; });
  $$("[data-site-intro]").forEach((el) => { el.textContent = s.intro; });
  $$("[data-site-email]").forEach((el) => { el.textContent = s.email || "未填写"; });
  $$("[data-site-phone]").forEach((el) => { el.textContent = s.phone || "未填写"; });
  $$("[data-site-qq]").forEach((el) => { el.textContent = s.qq || "未填写"; });
  $$("[data-site-place]").forEach((el) => { el.textContent = s.place || "未填写"; });
  const logo = $("[data-logo-slot]");
  if (logo) {
    if (s.logo) logo.innerHTML = '<img src="' + esc(s.logo) + '" alt="logo">';
    else logo.innerHTML = '<span aria-hidden="true">' + esc((s.name || "A").slice(0, 1)) + "</span>";
  }
}
function initShell() {
  refreshShell();
  const y = $("#yearNow");
  if (y) y.textContent = String(new Date().getFullYear());
  const social = $("#socialRow");
  if (social) {
    /* 想改社交链接：在 app.js 顶部 DEMO.site 里加 social 数组，或直接在下面写死你的地址 */
    const items = [
      { name: "B站", icon: "play", href: "" },
      { name: "QQ群", icon: "users", href: "" },
      { name: "微博", icon: "globe", href: "" },
      { name: "公众号", icon: "mail", href: "" },
    ];
    social.innerHTML = items.map((it) => '<a href="' + esc(it.href || "#/join") + '"' +
      (it.href ? ' target="_blank" rel="noopener"' : "") +
      ' title="' + esc(it.name) + (it.href ? "" : "（还没填链接，点进去可以到报名页找我们）") + '">' + ic(it.icon) + "</a>").join("");
  }
  /* 顶部导航：移动端展开 / 收起 */
  const nav = $("#mainNav"), toggle = $("#navToggle");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      document.body.classList.toggle("nav-open", open);
    });
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") { nav.classList.remove("open"); document.body.classList.remove("nav-open"); }
    });
  }
  /* 滚动时给头部加毛玻璃 */
  const header = $("#siteHeader");
  const onScroll = () => { if (header) header.classList.toggle("scrolled", window.scrollY > 12); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  const tt = $("#themeToggle");
  if (tt) tt.addEventListener("click", () => Theme.toggle());
}
function boot() {
  Store.load();
  Theme.init();
  initShell();
  bindSlotDelegation();
  document.addEventListener("click", onClick);
  document.addEventListener("submit", onSubmit);
  document.addEventListener("input", onInput);
  document.addEventListener("change", onChange);
  window.addEventListener("hashchange", () => route(false));
  /* 键盘：Esc 关闭弹窗 */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (!$("#modalRoot").hidden) closeModal(); if (!$("#confirmRoot").hidden) $("#confirmNo").click(); }
  });
  if (!location.hash) location.hash = "#/";
  route(false);
  console.log("%c Aneko动漫社 ", "background:#39e6d0;color:#04121a;font-weight:bold", "站点已启动：纯静态、零依赖。改内容请看 app.js 顶部的 DEMO 数据，或直接进后台管理。");
}
let booted = false;
function bootOnce() {
  if (booted) return;
  booted = true;
  boot();
}
document.addEventListener("DOMContentLoaded", bootOnce);
if (document.readyState === "interactive" || document.readyState === "complete") bootOnce();
