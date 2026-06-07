// ══════════════════════════════════
//  db.js — Supabase REST 封装、数据加载、文件上传
//  依赖: config.js
// ══════════════════════════════════

function sbHeaders(extra){
  return Object.assign({
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
  }, extra||{});
}

function sbFrom(table){
  const state={table,filters:[],orderBy:'',single:false};
  const api={
    select(){ state.method='GET'; return api; },
    insert(obj){ state.method='POST'; state.body=Array.isArray(obj)?obj:[obj]; return api; },
    update(obj){ state.method='PATCH'; state.body=obj; return api; },
    delete(){ state.method='DELETE'; return api; },
    eq(col,val){ state.filters.push(col+'=eq.'+encodeURIComponent(val)); return api; },
    order(col,opts){ state.orderBy=col+'.'+((opts&&opts.ascending===false)?'desc':'asc'); return api; },
    maybeSingle(){ state.single=true; return api.run(); },
    then(resolve,reject){ return api.run().then(resolve,reject); },
    async run(){
      try{
        let url=REST+'/'+state.table;
        const qs=[...state.filters];
        if(state.method==='GET'&&state.orderBy) qs.push('order='+state.orderBy);
        if(qs.length) url+='?'+qs.join('&');
        const headers=sbHeaders({'Content-Type':'application/json'});
        if(state.method==='POST'||state.method==='PATCH') headers['Prefer']='return=representation';
        const opt={method:state.method||'GET',headers};
        if(state.body!==undefined) opt.body=JSON.stringify(state.body);
        const resp=await fetch(url,opt);
        if(!resp.ok){
          let msg=await resp.text();
          return {data:null,error:{message:msg||('HTTP '+resp.status)}};
        }
        let data=null;
        const txt=await resp.text();
        if(txt) data=JSON.parse(txt);
        if(state.single) data=(Array.isArray(data)&&data.length)?data[0]:null;
        return {data,error:null};
      }catch(e){
        return {data:null,error:{message:e.message||String(e)}};
      }
    }
  };
  return api;
}
const sb = { from: sbFrom };

// ── DB 行 → 前端对象 映射 ──
function rowToProduct(r){
  return {
    id:r.id, name:r.name, sku:r.sku, cat:r.category,
    saleType:r.sale_type||'pallet',
    supplier:r.supplier||'',
    cost:Number(r.cost)||0, price:Number(r.price)||0, stock:r.stock||0,
    emoji:r.emoji||'📦', img:r.image_url||'', desc:r.description||''
  };
}
function rowToOrder(r){
  return {
    id:r.id, buyerUser:r.buyer_user,
    time:(r.created_at||'').replace('T',' ').slice(0,16),
    name:r.recipient, phone:r.phone, addr:r.address,
    city:r.city, state:r.state, zip:r.zip, country:r.country,
    ship:r.ship_method, status:r.status, note:r.note,
    items:r.items||[], labels:r.labels||[]
  };
}

// ── 从 Supabase 加载全部数据到内存 ──
async function loadAll(){
  const [pr,or,br,cr] = await Promise.all([
    sb.from('products').select().order('id'),
    sb.from('orders').select().order('created_at',{ascending:false}),
    sb.from('buyers').select().order('id'),
    sb.from('categories').select().order('id'),
  ]);
  if(pr.error) throw new Error(pr.error.message);
  if(or.error) throw new Error(or.error.message);
  if(br.error) throw new Error(br.error.message);
  if(cr.error) throw new Error(cr.error.message);
  products   = (pr.data||[]).map(rowToProduct);
  orders     = (or.data||[]).map(rowToOrder);
  buyers     = (br.data||[]).map(b=>({id:b.id,username:b.username,password:b.password,name:b.name,active:b.active}));
  // categories 表同时存产品分类（普通行）和批发商（W| 前缀行）
  const allCats = cr.data||[];
  categories  = allCats.filter(c=>!c.name.startsWith('W|')).map(c=>c.name);
  wholesalers = allCats.filter(c=>c.name.startsWith('W|')).map(c=>({id:c.id,name:c.name.slice(2)}));
}

// ── 文件上传到 Storage，返回公开 URL ──
async function uploadFile(bucket, file){
  const ext=(file.name.split('.').pop()||'bin').toLowerCase();
  const path=Date.now()+'_'+Math.random().toString(36).slice(2,8)+'.'+ext;
  const resp=await fetch(STORAGE+'/object/'+bucket+'/'+path, {
    method:'POST',
    headers:sbHeaders({'Content-Type':file.type||'application/octet-stream'}),
    body:file
  });
  if(!resp.ok){ throw new Error('上传失败：'+await resp.text()); }
  return SUPABASE_URL+'/storage/v1/object/public/'+bucket+'/'+path;
}
