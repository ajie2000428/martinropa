// ══════════════════════════════════
//  state.js — 全局状态变量
//  所有模块共享，必须最先加载
// ══════════════════════════════════

let products    = [];
let orders      = [];
let buyers      = [];
let categories  = [];
let wholesalers = [];

let cart        = [];
let currentUser = null;
let loginRole   = 'buyer';

let selectedSupplier = '';
let orderChannel     = '独立站';

// 商品图片上传临时状态
let prodImgData = '';
let prodImgFile = null;

// 待上传面单文件列表
let pendingLabels = [];
