// ══════════════════════════════════
//  checkout.js — 结算页、面单上传、提交订单
//  依赖: db.js, state.js, ui.js, cart.js
// ══════════════════════════════════

// ── 结算页开关 ──
function goToCheckout(){
  if(!cart.length){ toast('购物车为空','r'); return; }
  closeCartDrawer();
  orderChannel='独立站';
  document.querySelectorAll('#co-channel-grid .channel-tab').forEach(t=>t.classList.remove('active'));
  const d=document.getElementById('co-ch-独立站'); if(d)d.classList.add('active');
  const recip=document.getElementById('co-recipient'); if(recip)recip.style.display='block';
  const warn=document.getElementById('co-label-warn'); if(warn)warn.style.display='none';
  const lbl=document.getElementById('co-label-lbl'); if(lbl)lbl.textContent='上传面单文件（PDF / 图片，可多个）';
  const chlbl=document.getElementById('co-channel-label'); if(chlbl)chlbl.textContent='独立站';
  renderCheckoutSummary();
  document.getElementById('checkout-ov').classList.add('open');
}
function closeCheckout(){
  document.getElementById('checkout-ov').classList.remove('open');
}

// ── 订单明细（右侧汇总）──
function renderCheckoutSummary(){
  const el    = document.getElementById('co-cart-items');
  const totalEl= document.getElementById('co-cart-total');
  const ccEl  = document.getElementById('co-cart-count');
  if(!el)return;
  if(!cart.length){ el.innerHTML='<div class="empty"><div class="empty-ico">🛒</div>购物车为空</div>'; return; }
  const sup=cart[0].supplier||'';
  el.innerHTML=`<div style="font-size:11px;color:var(--accent);background:rgba(0,200,255,.08);border:1px solid rgba(0,200,255,.2);border-radius:6px;padding:6px 10px;margin-bottom:8px">🏬 供货商：${escHtml(sup)}</div>`
    +cart.map(c=>`<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="width:30px;text-align:center;flex-shrink:0">${(c.img&&c.img.length>10)?`<img src="${c.img}" style="width:28px;height:28px;object-fit:cover;border-radius:5px">`:c.emoji}</div>
      <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(c.name)}</div><div style="font-size:10px;color:var(--muted)">${escHtml(c.sku)} × ${c.qty}</div></div>
      <div class="mono" style="color:var(--accent2);font-size:12px;flex-shrink:0">¥${(c.cost*c.qty).toFixed(0)}</div>
    </div>`).join('');
  if(totalEl) totalEl.textContent='¥ '+cart.reduce((s,c)=>s+c.cost*c.qty,0).toFixed(2);
  if(ccEl) ccEl.textContent=cart.reduce((s,c)=>s+c.qty,0);
}

// ── 渠道选择 ──
function selectCheckoutChannel(ch, el){
  orderChannel=ch;
  document.querySelectorAll('#co-channel-grid .channel-tab').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  const recip=document.getElementById('co-recipient');
  if(recip) recip.style.display=(ch==='美客多')?'none':'block';
  const warn=document.getElementById('co-label-warn');
  if(warn) warn.style.display=(ch==='美客多')?'block':'none';
  const lbl=document.getElementById('co-label-lbl');
  if(lbl) lbl.textContent=(ch==='美客多')?'📄 上传平台面单文件 *（必须上传）':'上传面单文件（PDF / 图片，可多个）';
  const chlbl=document.getElementById('co-channel-label');
  if(chlbl) chlbl.textContent=ch;
}
// 兼容旧调用
function selectChannel(ch, el){ selectCheckoutChannel(ch, el); }

// ── 一件代发商品列表 ──
function renderOrderProds(){
  const el=document.getElementById('order-prod-grid'); if(!el)return;
  const sEl=document.getElementById('bo-search');
  const q=sEl?sEl.value.toLowerCase():'';
  const lockedSupplier=cart.length?(cart[0].supplier||''):null;
  const list=products.filter(p=>p.saleType==='dropship'&&(!q||(p.name.toLowerCase().includes(q)||p.sku.toLowerCase().includes(q))));

  const lockBanner=lockedSupplier
    ? `<div style="grid-column:1/-1;background:rgba(255,193,7,.1);border:1px solid rgba(255,193,7,.3);border-radius:8px;padding:10px 14px;margin-bottom:4px;font-size:12px;color:var(--yellow)">
        🔒 购物车已锁定供货商「${escHtml(lockedSupplier)}」，只能继续添加该供货商的商品，如需换供货商请先清空购物车
       </div>` : '';

  el.innerHTML=lockBanner+list.map(p=>{
    const ci=cart.find(c=>c.id===p.id);
    const sup=p.supplier||'';
    const locked=lockedSupplier&&lockedSupplier!==sup;
    return `<div class="prod-card" ${locked?'style="opacity:.4"':''}>
      <div class="prod-img" style="height:110px;font-size:38px">${prodVisual(p,'mid')}<span class="stk-badge ${stkInfo(p.stock).cls}" style="font-size:9px">${stkInfo(p.stock).lbl}</span></div>
      <div class="prod-body" style="padding:10px">
        <div class="prod-sku">${escHtml(p.sku)}</div>
        <div class="prod-name" style="font-size:12px">${escHtml(p.name)}</div>
        <div style="font-size:9px;color:var(--dim);margin-top:2px">🏬 ${escHtml(sup)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <span class="mono" style="color:var(--accent2);font-size:15px;font-weight:700">¥${p.cost}</span>
          ${ci
            ?`<div class="qc"><button class="qb" onclick="changeQty(${p.id},-1)">−</button><span class="qn">${ci.qty}</span><button class="qb" onclick="changeQty(${p.id},1)">＋</button></div>`
            :`<button class="add-btn" style="margin:0;width:auto;padding:4px 12px;font-size:12px" ${(p.stock===0||locked)?'disabled':''} onclick="addCart(${p.id})">${locked?'🔒 锁定':'+ 加入'}</button>`}
        </div>
      </div></div>`;
  }).join('');
}

// ── 面单文件处理 ──
function onLabelPick(e){
  const files=[...e.target.files];
  files.forEach(f=>{
    if(f.size>5*1024*1024){ toast('文件 '+f.name+' 超过5MB，已跳过','r'); return; }
    const reader=new FileReader();
    reader.onload=()=>{ pendingLabels.push({name:f.name,type:f.type,size:f.size,file:f,preview:reader.result}); renderLabelPreview(); };
    reader.readAsDataURL(f);
  });
  e.target.value='';
}
function renderLabelPreview(){
  const el=document.getElementById('label-preview'); if(!el)return;
  el.innerHTML=pendingLabels.map((l,i)=>{
    const isImg=l.type.startsWith('image/');
    const thumb=isImg
      ?`<img src="${l.preview}" style="width:38px;height:38px;object-fit:cover;border-radius:5px">`
      :`<div style="width:38px;height:38px;background:var(--surface);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:18px">📄</div>`;
    return `<div style="display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:11px">
      ${thumb}
      <span style="max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(l.name)}</span>
      <span style="color:var(--red);cursor:pointer;font-weight:700" onclick="removeLabel(${i})">✕</span>
    </div>`;
  }).join('');
}
function removeLabel(i){ pendingLabels.splice(i,1); renderLabelPreview(); }

// ── 提交订单 ──
async function submitOrder(){
  if(!cart.length){ toast('请先选择商品','r'); return; }

  // 美客多必须上传面单
  if(orderChannel==='美客多'&&pendingLabels.length===0){
    const warn=document.getElementById('co-label-warn');
    if(warn){ warn.style.display='block'; warn.scrollIntoView({behavior:'smooth',block:'center'}); }
    toast('⚠️ 美客多渠道必须上传平台面单文件，否则无法发货','r');
    return;
  }

  // 收件人信息（独立站/私域必填）
  let name='', addr='', phone='', country='', city='', state='', zip='', ship='美客多平台代发';
  if(orderChannel!=='美客多'){
    name=document.getElementById('f-name').value.trim();
    addr=document.getElementById('f-addr').value.trim();
    if(!name||!addr){ toast('请填写收件人姓名和地址','r'); return; }
    phone  =document.getElementById('f-phone').value;
    country=document.getElementById('f-country').value;
    city   =document.getElementById('f-city').value;
    state  =document.getElementById('f-state').value;
    zip    =document.getElementById('f-zip').value;
    ship   =document.getElementById('f-ship').value;
  } else {
    name='（美客多）'; addr='美客多平台';
  }

  const btn=event&&event.target; if(btn){btn.disabled=true;btn.textContent='校验库存…';}
  try{
    // ① 重新查库存防并发超卖
    const freshRes=await Promise.all(cart.map(ci=>sb.from('products').select().eq('id',ci.id).maybeSingle()));
    for(let i=0;i<cart.length;i++){
      const fresh=freshRes[i].data;
      const need=cart[i].qty;
      if(!fresh||fresh.stock<need){
        toast(`「${cart[i].name}」库存不足（剩余 ${fresh?fresh.stock:0} 件，需要 ${need} 件），请调整数量`,'r');
        if(btn){btn.disabled=false;btn.textContent='🚀 提交代发订单';}
        return;
      }
    }
    if(btn) btn.textContent='提交中…';

    // ② 上传面单文件
    const labels=[];
    for(const l of pendingLabels){
      const url=await uploadFile(BUCKET_LABEL, l.file);
      labels.push({name:l.name,type:l.type,url});
    }

    // ③ 写入订单
    const oid='ORD-'+String(Date.now()).slice(-8).padStart(8,'0');
    const orderSupplier=cart.length?(cart[0].supplier||''):'';
    const items=cart.map(c=>({id:c.id,name:c.name,emoji:c.emoji,qty:c.qty,price:c.cost,supplier:c.supplier||orderSupplier}));
    const total=items.reduce((s,i)=>s+i.price*i.qty,0);
    const userNote=document.getElementById('f-note').value;
    const row={
      id:oid, buyer_user:currentUser.username, recipient:name,
      phone, address:addr, city, state, zip, country,
      ship_method:ship, status:'pending',
      note:('【渠道：'+orderChannel+'】【供货商：'+orderSupplier+'】 '+userNote).trim(),
      items, labels, total
    };
    const {error}=await sb.from('orders').insert(row); if(error) throw error;

    // ④ 扣减库存
    for(const ci of cart){
      const p=products.find(x=>x.id===ci.id);
      if(p){ const ns=Math.max(0,p.stock-ci.qty); await sb.from('products').update({stock:ns}).eq('id',p.id); }
    }
    await loadAll();
    toast('✅ 订单提交成功！订单号：'+oid);
    cart=[]; pendingLabels=[]; renderLabelPreview();
    ['f-name','f-phone','f-addr','f-country','f-city','f-state','f-zip','f-note'].forEach(id=>{ const el=document.getElementById(id); if(el)el.value=''; });
    updateCartCount(); renderCartDrawer(); updateCatalogCartBar();
    closeCheckout();
    setTimeout(()=>{ document.querySelectorAll('.buyer-tab')[2].click(); }, 1200);
  }catch(e){
    toast('提交失败：'+(e.message||e),'r');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='🚀 提交代发订单';}
  }
}
