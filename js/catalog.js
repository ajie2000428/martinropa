// ══════════════════════════════════
//  catalog.js — 货盘目录（买家浏览，纯展示）
//  依赖: db.js, state.js, ui.js
// ══════════════════════════════════

function renderCatalog(){
  const grid=document.getElementById('catalog-grid'); if(!grid)return;
  renderWholesalerTabs();
  const q   = document.getElementById('bc-search').value.toLowerCase();
  const cat = document.getElementById('bc-cat').value;
  const stk = document.getElementById('bc-stk').value;
  const list=products.filter(p=>{
    if((p.saleType||'pallet')!=='pallet') return false;
    if(selectedSupplier&&(p.supplier||'')!==selectedSupplier) return false;
    if(cat&&p.cat!==cat) return false;
    if(stk==='in'&&p.stock<20) return false;
    if(stk==='low'&&(p.stock===0||p.stock>=20)) return false;
    if(stk==='out'&&p.stock!==0) return false;
    if(q&&!p.name.toLowerCase().includes(q)&&!p.sku.toLowerCase().includes(q)) return false;
    return true;
  });
  if(!list.length){ grid.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-ico">🔍</div>暂无匹配商品</div>'; return; }

  // 按批发商分组（查看全部时显示分组标题）
  const groups={};
  list.forEach(p=>{ const s=p.supplier||''; (groups[s]=groups[s]||[]).push(p); });
  const showHeader=!selectedSupplier&&Object.keys(groups).length>1;

  let html='';
  Object.keys(groups).forEach(sup=>{
    if(showHeader){
      html+=`<div class="supplier-header" style="grid-column:1/-1">
        <div class="supplier-title">🏬 ${escHtml(sup)}<span class="supplier-count">${groups[sup].length} 款</span></div>
      </div>`;
    }
    html+=groups[sup].map(p=>{
      const si=stkInfo(p.stock);
      return `<div class="prod-card">
        <div class="prod-img">${prodVisual(p,'big')}<span class="stk-badge ${si.cls}">${si.lbl}</span></div>
        <div class="prod-body">
          <div class="prod-sku">${escHtml(p.sku)}</div>
          <div class="prod-name">${escHtml(p.name)}</div>
          <div class="prod-cat">${escHtml(p.cat)}</div>
          <div class="prod-meta">
            <div class="prod-price">¥${p.cost}</div>
            <div class="prod-stk"><strong>${p.stock}</strong>件在库</div>
          </div>
        </div></div>`;
    }).join('');
  });
  grid.innerHTML=html;
}

// ── 本地批发商标签渲染 ──
function renderWholesalerTabs(){
  const container=document.getElementById('supplier-tabs-bar'); if(!container)return;
  if(!wholesalers.length){
    container.innerHTML='<div style="font-size:12px;color:var(--muted);padding:4px 0 12px">暂无批发商，请管理员在「批发商管理」中添加</div>';
    return;
  }
  if(!selectedSupplier) selectedSupplier=wholesalers[0].name;
  const palletProds=products.filter(p=>(p.saleType||'pallet')==='pallet');
  let html=`<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:10px">本地批发商</div>`;
  html+='<div class="sup-tabs">';
  wholesalers.forEach(w=>{
    const count=palletProds.filter(p=>p.supplier===w.name).length;
    const esc=w.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    html+=`<div class="sup-tab${selectedSupplier===w.name?' active':''}" onclick="selectSupplier('${esc}')">🏬 ${escHtml(w.name)} <span style="font-size:10px;opacity:.7">${count}款</span></div>`;
  });
  html+='</div>';
  container.innerHTML=html;
}
function selectSupplier(s){ selectedSupplier=s; renderCatalog(); }
function updateCatalogCartBar(){}
function goToOrder(){ openCartDrawer(); }
