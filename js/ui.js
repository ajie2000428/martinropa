// ══════════════════════════════════
//  ui.js — 通用 UI 工具函数
//  依赖: state.js
// ══════════════════════════════════

// ── XSS 防护：HTML 转义 ──
function escHtml(s){
  return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── 库存状态 ──
function stkInfo(s){
  if(s===0) return {lbl:'缺货',cls:'sn'};
  if(s<20)  return {lbl:'紧张 '+s,cls:'sl'};
  if(s<100) return {lbl:'有货 '+s,cls:'sm'};
  return {lbl:'充足 '+s,cls:'sh'};
}
const stMap = {pending:'待处理',shipping:'运输中',done:'已完成',cancel:'已取消'};
const stCls = {pending:'bp',shipping:'bs',done:'bd',cancel:'bc'};
function ordTotal(o){ return o.items.reduce((s,i)=>s+i.price*i.qty,0); }

// ── 商品图片渲染 (big/mid/sm) ──
function prodVisual(p, mode){
  const hasImg = p.img && p.img.length>10;
  if(mode==='big'||mode==='mid'){
    return hasImg
      ? `<img src="${p.img}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">`
      : p.emoji;
  }
  return hasImg
    ? `<img src="${p.img}" style="width:24px;height:24px;object-fit:cover;border-radius:5px;margin-right:6px;vertical-align:middle">`
    : `<span style="font-size:18px;margin-right:6px">${p.emoji}</span>`;
}
function itemVisualSm(it){
  const p = products.find(x=>x.id===it.id);
  if(p&&p.img&&p.img.length>10)
    return `<img src="${p.img}" style="width:22px;height:22px;object-fit:cover;border-radius:4px;margin-right:5px;vertical-align:middle">`;
  return (it.emoji||'📦')+' ';
}

// ── 商品图片预览（管理员新增/编辑商品用）──
function onProdImgPick(e){
  const f=e.target.files[0]; if(!f)return;
  if(f.size>5*1024*1024){ toast('图片超过5MB，请压缩后再传','r'); e.target.value=''; return; }
  prodImgFile=f;
  const r=new FileReader();
  r.onload=()=>{ prodImgData=r.result; renderProdImgPreview(); };
  r.readAsDataURL(f);
}
function renderProdImgPreview(){
  const el=document.getElementById('mp-img-preview'); if(!el)return;
  el.innerHTML=prodImgData
    ? `<div style="display:flex;align-items:center;gap:10px">
        <img src="${prodImgData}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid var(--border)">
        <span style="color:var(--red);cursor:pointer;font-size:12px" onclick="clearProdImg()">✕ 移除图片</span>
       </div>`
    : '';
}
function clearProdImg(){
  prodImgData=''; prodImgFile=null;
  document.getElementById('mp-img-file').value='';
  renderProdImgPreview();
}

// ── Modal 开关 ──
function openM(id){ document.getElementById(id).classList.add('open'); }
function closeM(id){ document.getElementById(id).classList.remove('open'); }

// 点击遮罩关闭 Modal
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.modal-ov').forEach(m=>{
    m.addEventListener('click', e=>{ if(e.target===m) m.classList.remove('open'); });
  });
});

// ── Toast 提示 ──
function toast(msg, type='g'){
  const el=document.getElementById('toast');
  el.textContent=msg;
  el.style.background = type==='r' ? 'var(--red)' : 'var(--green)';
  el.style.color       = type==='r' ? '#fff' : '#000';
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 3200);
}
