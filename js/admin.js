// ══════════════════════════════════
//  admin.js — 管理员后台全部功能
//  依赖: db.js, state.js, ui.js
// ══════════════════════════════════

// ── 管理员导航 ──
function adminNav(page, el){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.adm-page').forEach(p=>p.style.display='none');
  document.getElementById('adm-'+page).style.display='block';
  if(page==='dashboard')   renderDashboard();
  if(page==='products')    renderAdminProducts();
  if(page==='inventory')   renderAdminInv();
  if(page==='orders')      renderAdminOrders();
  if(page==='buyers')      renderBuyers();
  if(page==='wholesalers') renderAdminWholesalers();
}

// ── 数据概览 ──
function renderDashboard(){
  const inStock  = products.filter(p=>p.stock>=20).length;
  const lowStk   = products.filter(p=>p.stock>0&&p.stock<20).length;
  const outStk   = products.filter(p=>p.stock===0).length;
  const todayOrd = orders.filter(o=>o.time.startsWith(new Date().toISOString().slice(0,10))).length;
  document.getElementById('dash-stats').innerHTML=`
    <div class="stat-card"><div class="stat-ico" style="background:#00c8ff18">📦</div><div><div class="stat-val" style="color:var(--accent)">${products.length}</div><div class="stat-lbl">商品总数</div></div></div>
    <div class="stat-card"><div class="stat-ico" style="background:#00e67618">✅</div><div><div class="stat-val" style="color:var(--green)">${inStock}</div><div class="stat-lbl">有货商品</div></div></div>
    <div class="stat-card"><div class="stat-ico" style="background:#ffc10718">⚠️</div><div><div class="stat-val" style="color:var(--yellow)">${lowStk}</div><div class="stat-lbl">库存紧张</div></div></div>
    <div class="stat-card"><div class="stat-ico" style="background:#f4433618">🚫</div><div><div class="stat-val" style="color:var(--red)">${outStk}</div><div class="stat-lbl">缺货商品</div></div></div>
    <div class="stat-card"><div class="stat-ico" style="background:#ff704318">🧾</div><div><div class="stat-val" style="color:var(--accent2)">${orders.length}</div><div class="stat-lbl">累计订单</div></div></div>
    <div class="stat-card"><div class="stat-ico" style="background:#00c8ff10">📅</div><div><div class="stat-val" style="color:var(--accent)">${todayOrd}</div><div class="stat-lbl">今日订单</div></div></div>
  `;
  const warns=products.filter(p=>p.stock<20);
  document.getElementById('dash-warn').innerHTML = warns.length
    ? `<div class="tbl-wrap"><table><thead><tr><th>商品</th><th>SKU</th><th>库存</th><th>状态</th></tr></thead><tbody>${
        warns.map(p=>`<tr><td>${prodVisual(p,'sm')}${p.name}</td><td class="mono" style="color:var(--accent)">${p.sku}</td><td class="mono">${p.stock}</td><td><span class="badge ${stkInfo(p.stock).cls}">${stkInfo(p.stock).lbl}</span></td></tr>`).join('')
      }</tbody></table></div>`
    : '<div class="empty"><div class="empty-ico">✅</div>所有商品库存充足</div>';
}

// ── 商品管理 ──
function renderAdminProducts(){
  const q=document.getElementById('ap-search').value.toLowerCase();
  const list=products.filter(p=>!q||(p.name.toLowerCase().includes(q)||p.sku.toLowerCase().includes(q)));
  document.getElementById('ap-tbody').innerHTML=list.length
    ? list.map((p)=>`<tr>
        <td>${prodVisual(p,'sm')}${p.name}</td>
        <td style="font-size:12px">🏬 ${p.supplier||'—'}</td>
        <td>${(p.saleType||'pallet')==='pallet'?'<span class="badge bs">🏪 货盘</span>':'<span class="badge bp">📦 代发</span>'}</td>
        <td><span class="mono" style="color:var(--accent)">${p.sku}</span></td>
        <td>${p.cat}</td>
        <td class="mono">${p.stock}</td>
        <td class="mono">¥${p.cost}</td>
        <td class="mono">¥${p.price}</td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-o btn-sm" onclick="openEditProd(${products.indexOf(p)})">编辑</button>
          <button class="btn btn-r" onclick="delProd(${products.indexOf(p)})">删除</button>
        </td></tr>`).join('')
    : '<tr><td colspan="9"><div class="empty"><div class="empty-ico">🔍</div>暂无商品</div></td></tr>';
}

function fillCatSelect(sel, selected, withNew){
  if(!sel)return;
  let html=withNew?'':'<option value="">全部分类</option>';
  html+=categories.map(c=>`<option ${c===selected?'selected':''}>${c}</option>`).join('');
  if(withNew) html+='<option value="__new__">➕ 新建分类…</option>';
  sel.innerHTML=html;
}
function refreshAllCatSelects(){
  const bc=document.getElementById('bc-cat'); if(bc){const v=bc.value;fillCatSelect(bc,v,false);bc.value=v;}
  const ai=document.getElementById('ai-cat'); if(ai){const v=ai.value;fillCatSelect(ai,v,false);ai.value=v;}
}
function onCatSelect(sel){
  const ni=document.getElementById('mp-cat-new');
  if(sel.value==='__new__'){ ni.style.display='block'; ni.focus(); }
  else{ ni.style.display='none'; }
}
function fillWholesalerSelect(selected){
  const sel=document.getElementById('mp-supplier'); if(!sel)return;
  if(wholesalers.length===0){
    sel.innerHTML='<option value="">-- 请先在「批发商管理」添加批发商 --</option>';
    return;
  }
  sel.innerHTML=wholesalers.map(w=>`<option value="${w.name}" ${w.name===selected?'selected':''}>${w.name}</option>`).join('');
}

function openAddProd(){
  document.getElementById('m-prod-title').textContent='新增商品';
  document.getElementById('m-prod-idx').value='';
  ['mp-name','mp-sku','mp-cost','mp-price','mp-stock','mp-emoji','mp-desc'].forEach(id=>document.getElementById(id).value='');
  fillCatSelect(document.getElementById('mp-cat'), categories[0], true);
  document.getElementById('mp-cat-new').style.display='none';
  document.getElementById('mp-cat-new').value='';
  prodImgData=''; prodImgFile=null; document.getElementById('mp-img-file').value=''; renderProdImgPreview();
  document.getElementById('mp-type').value='pallet';
  fillWholesalerSelect('');
  openM('m-prod');
}
function openEditProd(i){
  const p=products[i];
  document.getElementById('m-prod-title').textContent='编辑商品';
  document.getElementById('m-prod-idx').value=i;
  document.getElementById('mp-name').value=p.name;
  document.getElementById('mp-sku').value=p.sku;
  fillCatSelect(document.getElementById('mp-cat'), p.cat, true);
  document.getElementById('mp-cat-new').style.display='none';
  document.getElementById('mp-cat-new').value='';
  document.getElementById('mp-cost').value=p.cost;
  document.getElementById('mp-price').value=p.price;
  document.getElementById('mp-stock').value=p.stock;
  document.getElementById('mp-emoji').value=p.emoji;
  document.getElementById('mp-desc').value=p.desc||'';
  prodImgData=p.img||''; prodImgFile=null; document.getElementById('mp-img-file').value=''; renderProdImgPreview();
  document.getElementById('mp-type').value=p.saleType||'pallet';
  fillWholesalerSelect(p.supplier||'');
  openM('m-prod');
}
async function saveProd(){
  const idx=document.getElementById('m-prod-idx').value;
  const name=document.getElementById('mp-name').value.trim();
  const sku=document.getElementById('mp-sku').value.trim();
  if(!name||!sku){ toast('请填写商品名称和SKU','r'); return; }
  let cat=document.getElementById('mp-cat').value;
  const btn=event&&event.target; if(btn){btn.disabled=true;btn.textContent='保存中…';}
  try{
    if(cat==='__new__'){
      const nc=document.getElementById('mp-cat-new').value.trim();
      if(!nc){ toast('请输入新分类名称','r'); return; }
      if(!categories.includes(nc)){
        const {error}=await sb.from('categories').insert({name:nc});
        if(error&&!String(error.message).includes('duplicate')) throw error;
        categories.push(nc);
      }
      cat=nc;
    }
    let imageUrl=prodImgData;
    if(prodImgFile){ imageUrl=await uploadFile(BUCKET_IMG, prodImgFile); }
    const row={
      name,sku,category:cat,
      sale_type:document.getElementById('mp-type').value||'pallet',
      supplier:document.getElementById('mp-supplier').value.trim(),
      cost:+document.getElementById('mp-cost').value||0,
      price:+document.getElementById('mp-price').value||0,
      stock:+document.getElementById('mp-stock').value||0,
      emoji:document.getElementById('mp-emoji').value||'📦',
      image_url:imageUrl||null,
      description:document.getElementById('mp-desc').value,
    };
    if(idx===''){
      const {error}=await sb.from('products').insert(row); if(error) throw error;
    } else {
      const id=products[+idx].id;
      const {error}=await sb.from('products').update(row).eq('id',id); if(error) throw error;
    }
    await loadAll();
    closeM('m-prod'); renderAdminProducts(); renderDashboard(); refreshAllCatSelects();
    toast(idx===''?'✅ 商品已添加':'✅ 商品已更新');
  }catch(e){ toast('保存失败：'+(e.message||e),'r'); }
  finally{ if(btn){btn.disabled=false;btn.textContent='保存';} }
}
async function delProd(i){
  if(!confirm('确认删除该商品？'))return;
  try{
    const {error}=await sb.from('products').delete().eq('id',products[i].id); if(error) throw error;
    await loadAll(); renderAdminProducts(); renderDashboard();
    toast('商品已删除');
  }catch(e){ toast('删除失败：'+(e.message||e),'r'); }
}

// ── 库存管理 ──
function renderAdminInv(){
  const q=document.getElementById('ai-search').value.toLowerCase();
  const cat=document.getElementById('ai-cat').value;
  const mx=Math.max(...products.map(p=>p.stock),1);
  const list=products.filter(p=>(!cat||p.cat===cat)&&(!q||(p.name.toLowerCase().includes(q)||p.sku.toLowerCase().includes(q))));
  document.getElementById('ai-tbody').innerHTML=list.length
    ? list.map(p=>{
        const si=stkInfo(p.stock);
        const pct=Math.min(100,Math.round(p.stock/mx*100));
        const fc=p.stock===0?'fr':p.stock<20?'fy':'fg';
        return `<tr>
          <td>${prodVisual(p,'sm')}${p.name}</td>
          <td><span class="mono" style="color:var(--accent)">${p.sku}</span></td>
          <td>${p.cat}</td>
          <td><div class="ibar-wrap"><div class="ibar"><div class="ibar-fill ${fc}" style="width:${pct}%"></div></div><span class="mono">${p.stock}</span></div></td>
          <td><span class="badge ${si.cls}">${si.lbl}</span></td>
          <td><button class="btn btn-o btn-sm" onclick="openStk(${products.indexOf(p)})">调整</button></td></tr>`;
      }).join('')
    : '<tr><td colspan="6"><div class="empty"><div class="empty-ico">📦</div>暂无数据</div></td></tr>';
}
function openStk(i){
  const p=products[i];
  document.getElementById('ms-idx').value=i;
  document.getElementById('ms-name').value=p.name;
  document.getElementById('ms-stock').value=p.stock;
  document.getElementById('ms-cost').value=p.cost;
  document.getElementById('ms-price').value=p.price;
  openM('m-stk');
}
async function saveStk(){
  const i=+document.getElementById('ms-idx').value;
  const id=products[i].id;
  const row={stock:+document.getElementById('ms-stock').value,cost:+document.getElementById('ms-cost').value,price:+document.getElementById('ms-price').value};
  try{
    const {error}=await sb.from('products').update(row).eq('id',id); if(error) throw error;
    await loadAll(); closeM('m-stk'); renderAdminInv(); renderDashboard();
    toast('✅ 库存已更新');
  }catch(e){ toast('更新失败：'+(e.message||e),'r'); }
}

// ── 订单管理 ──
function renderAdminOrders(){
  const q=document.getElementById('ao-search').value.toLowerCase();
  const st=document.getElementById('ao-st').value;
  const list=orders.filter(o=>(!st||o.status===st)&&(!q||(o.id.toLowerCase().includes(q)||o.name.toLowerCase().includes(q)||o.buyerUser.toLowerCase().includes(q))));
  document.getElementById('ao-tbody').innerHTML=list.length
    ? list.map(o=>`<tr>
        <td><span class="mono" style="color:var(--accent);font-size:11px">${escHtml(o.id)}</span></td>
        <td>${escHtml(o.buyerUser)}</td>
        <td style="font-size:11px;color:var(--dim)">${escHtml(o.time)}</td>
        <td>${o.items.reduce((s,i)=>s+i.qty,0)} 件</td>
        <td><span class="mono" style="color:var(--accent2)">¥${ordTotal(o).toFixed(0)}</span></td>
        <td style="font-size:11px">${escHtml(o.ship||'')}</td>
        <td><span class="badge ${stCls[o.status]}">${stMap[o.status]}</span>${(o.labels&&o.labels.length)?' <span title="含面单文件">📄</span>':''}</td>
        <td style="display:flex;gap:6px;align-items:center">
          <button class="btn btn-o btn-sm" onclick="viewOrder('${escHtml(o.id)}')">详情</button>
          <select style="font-size:11px;padding:5px 8px;min-width:84px" onchange="changeStatus('${escHtml(o.id)}',this.value)">
            <option value="pending" ${o.status==='pending'?'selected':''}>待处理</option>
            <option value="shipping" ${o.status==='shipping'?'selected':''}>运输中</option>
            <option value="done" ${o.status==='done'?'selected':''}>已完成</option>
            <option value="cancel" ${o.status==='cancel'?'selected':''}>已取消</option>
          </select>
        </td></tr>`).join('')
    : '<tr><td colspan="8"><div class="empty"><div class="empty-ico">📋</div>暂无订单</div></td></tr>';
}
async function changeStatus(id, st){
  if(!st)return;
  const o=orders.find(x=>x.id===id);
  if(o&&o.status!==st){
    try{
      const {error}=await sb.from('orders').update({status:st}).eq('id',id); if(error) throw error;
      o.status=st; renderAdminOrders(); toast('状态已更新为「'+stMap[st]+'」');
    }catch(e){ toast('更新失败：'+(e.message||e),'r'); renderAdminOrders(); }
  }
}

// ── 买家账号管理 ──
function renderBuyers(){
  document.getElementById('buyer-tbody').innerHTML=buyers.map((b,i)=>{
    const cnt=orders.filter(o=>o.buyerUser===b.username).length;
    return `<tr>
      <td><span class="mono" style="color:var(--accent)">${escHtml(b.username)}</span></td>
      <td>${escHtml(b.name)}</td>
      <td><span class="badge ${b.active?'bd':'bc'}">${b.active?'正常':'已禁用'}</span></td>
      <td>${cnt} 单</td>
      <td style="display:flex;gap:6px">
        <button class="btn btn-o btn-sm" onclick="toggleBuyer(${i})">${b.active?'禁用':'启用'}</button>
        <button class="btn btn-r" onclick="delBuyer(${i})">删除</button>
      </td></tr>`;
  }).join('');
}
function openAddBuyer(){
  openM('m-buyer');
  ['mb-user','mb-pass','mb-name'].forEach(id=>document.getElementById(id).value='');
}
async function saveBuyer(){
  const u=document.getElementById('mb-user').value.trim();
  const p=document.getElementById('mb-pass').value.trim();
  if(!u||!p){ toast('请填写账号和密码','r'); return; }
  if(buyers.find(b=>b.username===u)){ toast('账号已存在','r'); return; }
  try{
    const {error}=await sb.from('buyers').insert({username:u,password:p,name:document.getElementById('mb-name').value||u,active:true});
    if(error) throw error;
    await loadAll(); closeM('m-buyer'); renderBuyers(); toast('✅ 买家账号已创建');
  }catch(e){ toast('创建失败：'+(e.message||e),'r'); }
}
async function toggleBuyer(i){
  try{
    const {error}=await sb.from('buyers').update({active:!buyers[i].active}).eq('id',buyers[i].id); if(error) throw error;
    buyers[i].active=!buyers[i].active; renderBuyers();
  }catch(e){ toast('操作失败：'+(e.message||e),'r'); }
}
async function delBuyer(i){
  if(!confirm('确认删除该买家账号？'))return;
  try{
    const {error}=await sb.from('buyers').delete().eq('id',buyers[i].id); if(error) throw error;
    await loadAll(); renderBuyers(); toast('买家账号已删除');
  }catch(e){ toast('删除失败：'+(e.message||e),'r'); }
}

// ── 批发商管理 ──
function renderAdminWholesalers(){
  const tbody=document.getElementById('aw-tbody'); if(!tbody)return;
  if(!wholesalers.length){
    tbody.innerHTML='<tr><td colspan="3"><div class="empty"><div class="empty-ico">🏬</div>暂无批发商，点击「新增批发商」添加</div></td></tr>';
    return;
  }
  const palletProds=products.filter(p=>(p.saleType||'pallet')==='pallet');
  tbody.innerHTML=wholesalers.map((w,i)=>{
    const cnt=palletProds.filter(p=>p.supplier===w.name).length;
    return `<tr>
      <td><span style="font-size:16px;margin-right:6px">🏬</span><strong>${escHtml(w.name)}</strong></td>
      <td><span class="badge bs">${cnt} 款货盘商品</span></td>
      <td><button class="btn btn-r" onclick="delWholesaler(${i})">删除</button></td>
    </tr>`;
  }).join('');
}
function openAddWholesaler(){
  const el=document.getElementById('mw-name'); if(el)el.value='';
  openM('m-wholesaler');
}
async function saveWholesaler(){
  const name=(document.getElementById('mw-name').value||'').trim();
  if(!name){ toast('请输入批发商名称','r'); return; }
  if(wholesalers.find(w=>w.name===name)){ toast('该批发商已存在','r'); return; }
  const btn=event&&event.target; if(btn){btn.disabled=true;btn.textContent='保存中…';}
  try{
    const {error}=await sb.from('categories').insert({name:'W|'+name});
    if(error&&!String(error.message).includes('duplicate')) throw error;
    await loadAll();
    closeM('m-wholesaler'); renderAdminWholesalers(); fillWholesalerSelect('');
    toast('✅ 批发商「'+name+'」已添加');
  }catch(e){ toast('添加失败：'+(e.message||e),'r'); }
  finally{ if(btn){btn.disabled=false;btn.textContent='保存';} }
}
async function delWholesaler(i){
  const w=wholesalers[i];
  const cnt=products.filter(p=>p.supplier===w.name).length;
  const msg=cnt
    ? `批发商「${w.name}」下有 ${cnt} 款商品，删除后货盘目录将不再显示该批发商（商品数据不受影响）。确认删除？`
    : `确认删除批发商「${w.name}」？`;
  if(!confirm(msg))return;
  try{
    const {error}=await sb.from('categories').delete().eq('id',w.id); if(error) throw error;
    await loadAll(); renderAdminWholesalers(); selectedSupplier=''; toast('批发商已删除');
  }catch(e){ toast('删除失败：'+(e.message||e),'r'); }
}
