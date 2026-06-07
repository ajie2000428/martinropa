// ══════════════════════════════════
//  auth.js — 登录 / 登出 / 切换界面
//  管理员入口：martinropa.online?manage=martin8888
// ══════════════════════════════════

const ADMIN_SECRET = 'martin8888'; // 修改此处可更换管理员入口密钥

// 页面加载时检测 URL 参数
document.addEventListener('DOMContentLoaded', ()=>{
  const params   = new URLSearchParams(window.location.search);
  const key      = params.get('manage');
  const tabs     = document.getElementById('login-tabs');
  const logo     = document.querySelector('.login-logo p');

  if(key === ADMIN_SECRET){
    // 显示管理员登录
    if(tabs) tabs.style.display='flex';
    setLoginRole('admin');
    // 清除 URL 中的参数，不留痕迹
    window.history.replaceState({}, '', '/');
  } else {
    // 普通买家入口：只显示买家登录，隐藏管理员选项卡
    loginRole='buyer';
    if(logo) logo.textContent='买家登录';
  }
});

function setLoginRole(r){
  loginRole=r;
  document.querySelectorAll('.ltab').forEach((t,i)=>t.classList.toggle('active',i===(r==='buyer'?0:1)));
}

async function doLogin(){
  const u   = document.getElementById('l-user').value.trim();
  const p   = document.getElementById('l-pass').value.trim();
  const err = document.getElementById('login-err');
  err.style.display='none';
  const btn=document.querySelector('.login-btn');
  const oldTxt=btn.textContent;
  btn.textContent='登录中…'; btn.disabled=true;
  try{
    if(loginRole==='admin'){
      if(u==='admin'&&p==='admin888'){
        currentUser={role:'admin',username:'admin',name:'管理员'};
        await loadAll();
        showScreen('admin');
      } else { err.textContent='账号或密码错误，请重试'; err.style.display='block'; }
    } else {
      const {data,error}=await sb.from('buyers').select('*').eq('username',u).eq('password',p).eq('active',true).maybeSingle();
      if(error) throw error;
      if(data){
        currentUser={role:'buyer',username:data.username,name:data.name||data.username};
        await loadAll();
        showScreen('buyer');
      } else { err.textContent='账号或密码错误，请重试'; err.style.display='block'; }
    }
  }catch(e){
    err.textContent='连接数据库失败：'+(e.message||e); err.style.display='block';
  }finally{
    btn.textContent=oldTxt; btn.disabled=false;
  }
}

function logout(){
  currentUser=null; cart=[];
  document.getElementById('l-user').value='';
  document.getElementById('l-pass').value='';
  // 退出后回到普通买家登录页
  loginRole='buyer';
  const tabs=document.getElementById('login-tabs');
  if(tabs) tabs.style.display='none';
  showScreen('login');
}

function showScreen(s){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  document.getElementById('screen-'+s).classList.add('active');
  refreshAllCatSelects();
  if(s==='admin'){
    document.getElementById('admin-username').textContent=currentUser.name;
    document.getElementById('admin-avatar').textContent='A';
    renderDashboard();
  }
  if(s==='buyer'){
    document.getElementById('buyer-username').textContent=currentUser.name;
    document.getElementById('buyer-avatar').textContent=currentUser.name[0]||'B';
    renderCatalog();
  }
}
