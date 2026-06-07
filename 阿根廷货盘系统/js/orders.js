// ══════════════════════════════════
//  orders.js — 买家订单列表、订单详情、面单下载
//  依赖: db.js, state.js, ui.js
// ══════════════════════════════════

// ── 买家标签页导航 ──
function buyerNav(page, el){
  document.querySelectorAll('.buyer-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.b-page').forEach(p=>p.style.display='none');
  document.getElementById('b-'+page).style.display='block';
  if(page==='catalog')  renderCatalog();
  if(page==='order')    renderOrderProds();
  if(page==='myorders') renderMyOrders();
}

// ── 我的订单 ──
function renderMyOrders(){
  const list=orders.filter(o=>o.buyerUser===currentUser.username);
  const wrap=document.querySelector('#b-myorders .tbl-wrap');
  if(wrap) wrap.classList.add('mob-cards');
  document.getElementById('my-orders-tbody').innerHTML=list.length
    ? list.map(o=>`<tr>
        <td data-label="订单号"><span class="mono" style="color:var(--accent);font-size:11px">${escHtml(o.id)}</span></td>
        <td data-label="时间" style="font-size:11px;color:var(--dim)">${escHtml(o.time)}</td>
        <td data-label="收件人">${escHtml(o.name||'美客多')}</td>
        <td data-label="目的地" style="font-size:12px">${escHtml([o.city,o.country].filter(Boolean).join(', ')||'—')}</td>
        <td data-label="件数">${o.items.reduce((s,i)=>s+i.qty,0)} 件</td>
        <td data-label="金额"><span class="mono" style="color:var(--accent2)">¥${ordTotal(o).toFixed(0)}</span></td>
        <td data-label="物流" style="font-size:11px">${escHtml(o.ship||'')}</td>
        <td data-label="状态"><span class="badge ${stCls[o.status]}">${stMap[o.status]}</span></td>
        <td><button class="btn btn-o btn-sm" onclick="viewOrder('${escHtml(o.id)}')">详情</button></td></tr>`).join('')
    : '<tr><td colspan="9"><div class="empty"><div class="empty-ico">📋</div>暂无订单记录</div></td></tr>';
}

// ── 订单详情弹窗 ──
function viewOrder(id){
  const o=orders.find(x=>x.id===id); if(!o)return;
  const total=ordTotal(o);
  document.getElementById('order-detail').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;font-size:13px">
      <div><div style="font-size:10px;color:var(--dim);margin-bottom:3px">订单号</div><div class="mono" style="color:var(--accent)">${escHtml(o.id)}</div></div>
      <div><div style="font-size:10px;color:var(--dim);margin-bottom:3px">时间</div><div>${escHtml(o.time)}</div></div>
      <div><div style="font-size:10px;color:var(--dim);margin-bottom:3px">买家</div><div>${escHtml(o.buyerUser)}</div></div>
      <div><div style="font-size:10px;color:var(--dim);margin-bottom:3px">收件人</div><div>${escHtml(o.name)}</div></div>
      <div><div style="font-size:10px;color:var(--dim);margin-bottom:3px">地址</div><div style="font-size:12px">${escHtml([o.addr,o.city,o.state,o.zip,o.country].filter(Boolean).join(', '))}</div></div>
      <div><div style="font-size:10px;color:var(--dim);margin-bottom:3px">物流</div><div>${escHtml(o.ship||'')}</div></div>
      <div><div style="font-size:10px;color:var(--dim);margin-bottom:3px">状态</div><span class="badge ${stCls[o.status]}">${stMap[o.status]}</span></div>
    </div>
    <hr class="div">
    <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--dim);text-transform:uppercase;margin-bottom:10px">商品明细</div>
    ${o.items.map(i=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
      <span>${itemVisualSm(i)}${escHtml(i.name)} × ${i.qty}</span>
      <span class="mono" style="color:var(--accent2)">¥${(i.price*i.qty).toFixed(0)}</span>
    </div>`).join('')}
    <div style="display:flex;justify-content:space-between;padding-top:12px;font-size:15px;font-weight:600">
      <span>合计</span><span class="mono" style="color:var(--accent2)">¥${total.toFixed(2)}</span>
    </div>
    ${o.note?`<div style="margin-top:12px;background:var(--card);padding:10px;border-radius:6px;font-size:12px;color:var(--dim)">备注：${escHtml(o.note)}</div>`:''}
    ${(o.labels&&o.labels.length)?`
      <hr class="div">
      <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--dim);text-transform:uppercase;margin-bottom:10px">📄 面单文件（${o.labels.length}）</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${o.labels.map((l,li)=>{
          const isImg=l.type&&l.type.startsWith('image/');
          const thumb=isImg
            ?`<img src="${l.url}" style="width:40px;height:40px;object-fit:cover;border-radius:5px;cursor:pointer" onclick="openLabel('${escHtml(o.id)}',${li})">`
            :`<div style="width:40px;height:40px;background:var(--card);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer" onclick="openLabel('${escHtml(o.id)}',${li})">📄</div>`;
          return `<div style="display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:8px 12px">
            ${thumb}
            <span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(l.name)}</span>
            <button class="btn btn-o btn-sm" onclick="openLabel('${escHtml(o.id)}',${li})">查看</button>
            <button class="btn btn-p btn-sm" onclick="downloadLabel('${escHtml(o.id)}',${li})">下载</button>
          </div>`;
        }).join('')}
      </div>`:''}
  `;
  openM('m-order');
}

// ── 面单查看 / 下载 ──
function getLabel(orderId, li){
  const o=orders.find(x=>x.id===orderId);
  if(!o||!o.labels||!o.labels[li])return null;
  return o.labels[li];
}
function openLabel(orderId, li){
  const l=getLabel(orderId,li); if(!l||!l.url)return;
  window.open(l.url,'_blank');
}
async function downloadLabel(orderId, li){
  const l=getLabel(orderId,li); if(!l||!l.url)return;
  try{
    const resp=await fetch(l.url);
    const blob=await resp.blob();
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=l.name||'面单';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    toast('开始下载：'+l.name);
  }catch(e){
    window.open(l.url,'_blank');
    toast('已在新窗口打开，请长按保存','r');
  }
}
