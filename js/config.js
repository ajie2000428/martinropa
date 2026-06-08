// ══════════════════════════════════
//  config.js — Supabase 配置 & 常量
//  修改此文件以切换数据库连接
// ══════════════════════════════════

const SUPABASE_URL = 'https://rfekaqroryhfjnmslqmc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_s3YhZGNKfIqq4hwdCyJF5Q_kDoikuD2';
const REST     = SUPABASE_URL + '/rest/v1';
const STORAGE  = SUPABASE_URL + '/storage/v1';

const BUCKET_IMG   = 'product-images';
const BUCKET_LABEL = 'shipping-labels';
