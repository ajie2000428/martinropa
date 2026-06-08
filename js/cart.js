// ══════════════════════════════════
//  cart.js — 购物车操作 & 抽屉 UI
//  依赖: db.js, state.js, ui.js
// ══════════════════════════════════

// ── 购物车数据操作 ──
function addCart(id){
  const p=products.find(x=>x.id===id);
  if(!p||p.stock===0)return;
  const sup=p.supplier||'';
  if(cart.length){
    const cur=cart[0].supplier||'';
    if(cur!==sup){
      toast('购物车已有「'+cur+'」的商品，需先下单或清空才能购买其他供货商','r');
      return;
    }
  }
  const ci=cart.find(c=>c.id===id);
  if(ci) ci.qty++;
  else cart.push({id,name:p.name,emoji:p.emoji,img:p.img||'',price:p.cost,cost:p.cost,sku:p.sku,qty:1,supplier:sup});
  updateCartCount(); renderOrderProds(); renderCartDrawer();
}

function changeQty(id, d){
  const ci=cart.find(c=>c.id===id); if(!ci)return;
  ci.qty+=d;
  if(ci.qty<=0) cart.splice(cart.indexOf(ci),1);
  updateCartCount(); renderCartDrawer(); renderCheckoutSummary(); renderOrderProds();
}

function clearCart(){
  cart=[];
  updateCartCount(); renderCartDrawer(); renderOrderProds();
  closeCartDrawer();
  const co=document.getElementById('checkout-ov');
  if(co) co.classList.remove('open');
}

function updateCartCount(){
  const el=document.getElementById('cart-count');
  if(el) el.textContent=cart.reduce((s,c)=>s+c.qty,0);
}

// ── 购物车抽屉 ──
function openCartDrawer(){
  renderCartDrawer();
  document.getElementById('cart-drawer-ov').classList.add('open');
}
function closeCartDrawer(){
  document.getElementById('cart-drawer-ov').classList.remove('open');
}
function renderCartDrawer(){
  const body   = document.getElementById('cart-drawer-body');
  const totalEl= document.getElementById('drawer-total');
  const btn    = document.getElementById('drawer-checkout-btn');
  const supLbl = document.getElementById('drawer-sup-label');
  if(!body)return;
  if(!cart.length){
    body.innerHTML='<div class="empty" style="padding:50px 0"><div class="empty-ico">🛒</div>购物车为空</div>';
    if(totalEl) totalEl.textContent='¥ 0.00';
    if(btn) btn.disabled=true;
    if(supLbl) supLbl.textContent='';
    return;
  }
  const sup=cart[0].supplier||'';
  if(supLbl) supLbl.textContent=sup?'🏬 '+sup:'';
  body.innerHTML=cart.map(c=>`<div class="cart-item">
    <div class="ce">${(c.img&&c.img.length>10)?`<img src="${c.img}" style="width:32px;height:32px;object-fit:cover;border-radius:6px">`:c.emoji}</div>
    <div class="ci"><div class="cn">${escHtml(c.name)}</div><div class="cs">${escHtml(c.sku)}</div></div>
    <div class="qc">
      <button class="qb" onclick="changeQty(${c.id},-1)">−</button>
      <span class="qn">${c.qty}</span>
      <button class="qb" onclick="changeQty(${c.id},1)">＋</button>
    </div>
    <div class="cp">¥${(c.cost*c.qty).toFixed(0)}</div>
  </div>`).join('');
  if(totalEl) totalEl.textContent='¥ '+cart.reduce((s,c)=>s+c.cost*c.qty,0).toFixed(2);
  if(btn) btn.disabled=false;
}
