const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),{URL}=require('url');
const PORT=Number(process.env.PORT||3000), ROOT=__dirname, DATA=path.join(ROOT,'data'), STORE=path.join(ROOT,'data','store.json');
const NODE_ENV=process.env.NODE_ENV||'development';
const ADMIN_TOKEN=process.env.ADMIN_TOKEN||'';
const publicUrl=process.env.PUBLIC_URL||'http://localhost:'+PORT;
const questions=JSON.parse(fs.readFileSync(path.join(DATA,'questions.json'))); const sidejobs=JSON.parse(fs.readFileSync(path.join(DATA,'sidejobs.json')));
const typeInfo={R:{name:'現実的タイプ',en:'Realistic',action:'つくる',color:'#9B8A82',soft:'#F5EDE9',icon:'🔨',desc:'手を動かして、実際につくることが好きなタイプです。'},I:{name:'研究的タイプ',en:'Investigative',action:'探究する',color:'#7189A5',soft:'#EAF1F8',icon:'💡',desc:'考えたり調べたりして、深く理解することが好きなタイプです。'},S:{name:'社会的タイプ',en:'Social',action:'つながる',color:'#D596A3',soft:'#F9EDEF',icon:'♡',desc:'人と関わり、誰かの役に立つことが好きなタイプです。'},C:{name:'慣習的タイプ',en:'Conventional',action:'こつこつ',color:'#8EA393',soft:'#EEF4F0',icon:'☑',desc:'正確に整理しながら、こつこつ進めることが好きなタイプです。'},E:{name:'企業的タイプ',en:'Enterprising',action:'動かす',color:'#D9AE4E',soft:'#FBF4DE',icon:'↗',desc:'挑戦したり、人や物事を動かしたりすることが好きなタイプです。'},A:{name:'芸術的タイプ',en:'Artistic',action:'表現する',color:'#8D76A9',soft:'#F1ECF8',icon:'♪',desc:'好きなことや感性を活かして、表現することが好きなタイプです。'}};
const map={A:'R',B:'I',C:'S',D:'C',E:'E',F:'A'};
let store={sessions:{},users:{},analytics:[],advertisements:[]}; try{if(fs.existsSync(STORE))store=JSON.parse(fs.readFileSync(STORE));}catch(e){console.error('STORE_READ',e)}
function persist(){const tmp=STORE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(store,null,2));fs.renameSync(tmp,STORE)}
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>1e6)req.destroy()});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}})})}
function id(){return crypto.randomUUID()}
function session(d){return store.sessions[d]}
function requireAdmin(req){return ADMIN_TOKEN && req.headers.authorization===`Bearer ${ADMIN_TOKEN}`}
function safeAd(a){return {id:a.id,position:a.position,provider:a.provider,enabled:!!a.enabled,priority:Number(a.priority||0)}}
function scoreDiagnosis(answers){const scores={R:0,I:0,S:0,C:0,E:0,A:0}; for(let i=1;i<=15;i++){const a=answers[i];if(!map[a]){const e=new Error('DIAG-003');throw e}scores[map[a]]++} const order=['E','A','R','S','I','C']; const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]||order.indexOf(a[0])-order.indexOf(b[0])); return {scores,main:ranked[0][0],sub:ranked[1][0]}}
function condScore(job,c){let s=0,n=0;if(c.time){const t=[2,5.5,11,15][c.time-1];s+=Math.max(0,100-Math.abs(t-job.required_time)*12);n++}if(c.income){const x=[0.5,2,4,7.5,10][c.income-1];s+=Math.max(0,100-Math.abs(x-job.income_level)*12);n++}if(c.experience){s+=(c.experience>=job.experience_level?100:Math.max(40,100-(job.experience_level-c.experience)*25));n++}if(c.cost){s+=(c.cost>=job.initial_cost?100:Math.max(30,100-(job.initial_cost-c.cost)*30));n++}if(c.style){const x=c.style;const v=x===3?job.people_interaction>=4?100:60:x<=2?job.remote_level>=4?100:55:x===5?80:75;s+=v;n++}return n?s/n:50}
function riaScore(job,scores){const user={};for(const t of Object.keys(scores))user[t]=scores[t]/15*100;let dot=0,nu=0,nj=0;for(const t of Object.keys(user)){dot+=user[t]*Number(job[t]||0);nu+=user[t]*user[t];nj+=Number(job[t]||0)**2}return Math.max(0,Math.min(100,(dot/(Math.sqrt(nu)*Math.sqrt(nj)))*100||0))}
function rankJobs(result,conditions){return sidejobs.map(j=>{const r=riaScore(j,result.scores),c=condScore(j,conditions);return {...j,ria:r,condition:c,total:r*.7+c*.3}}).sort((a,b)=>b.total-a.total).slice(0,5)}
function logError(code,process,req,extra={}){console.error(JSON.stringify({error_code:code,process_name:process,timestamp:new Date().toISOString(),request_id:req.headers['x-request-id']||id(),...extra}))}
function redirect(res,to){res.writeHead(302,{Location:to});res.end()}
function buildRoadmap(job){
  const map={
    'Webデザイン':['Canva/Figmaの基本を覚える','バナーを3点制作する','ポートフォリオを作る','小さな案件に応募する'],
    '動画編集':['カット・テロップ・BGMを練習する','ショート動画を3本制作する','ポートフォリオを作る','初心者向け案件に応募する'],
    'AI画像制作':['生成AIの基本と利用規約を確認する','作品を5点制作する','用途別ポートフォリオを作る','画像制作案件に応募する'],
    'SNS運用':['投稿企画の基本を学ぶ','自分のSNSで実践する','数字を記録・分析する','運用実績をまとめて応募する'],
    'Webライター':['記事構成と文章の基本を学ぶ','1000〜2000字の記事を3本書く','ポートフォリオを作る','初心者向け案件に応募する'],
    'オンライン秘書':['Google Workspace/Excelの基本を整理する','資料作成などのサンプルを作る','できる業務を一覧化する','事務サポート案件に応募する'],
    'データ入力':['タイピングと表計算の基本を確認する','入力・整理の練習をする','実績を1〜3件作る','継続案件に応募する'],
    'リサーチ業務':['検索・情報源の見極め方を学ぶ','調査結果を表に整理する練習をする','リサーチサンプルを作る','調査案件に応募する'],
    '営業代行':['営業トークとヒアリングを整理する','提案文・営業資料を作る','条件と報酬体系を確認する','小さな営業案件から始める'],
    'アフィリエイト':['テーマと読者を決める','SNS/ブログで発信を始める','アクセスと反応を分析する','成約につながる導線を改善する']
  };
  return map[job]||['基礎を学ぶ','小さな作品・実績を作る','ポートフォリオを整える','初心者向け案件に応募する'];
}
function buildLearningResources(job){
  const map={
    'Webデザイン':[
      {title:'Canva Essentials',meta:'Canva公式・約1時間・初心者向け',url:'https://www.canva.com/design-school/courses/canva-essentials/'},
      {title:'Graphic Design Essentials',meta:'Canva公式・約53分・初心者向け',url:'https://www.canva.com/design-school/courses/graphic-design-essentials/'},
      {title:'Figma Learn',meta:'Figma公式・UI/デザインの基礎',url:'https://help.figma.com/hc/en-us/categories/360002051613-Learn-design'}
    ],
    '動画編集':[
      {title:'Premiereでのビデオ編集',meta:'Adobe公式・カット/トリミングなどの基礎',url:'https://helpx.adobe.com/jp/premiere/desktop/edit-projects/intro-to-editing/edit-video-in-premiere.html'},
      {title:'Premiere Pro ことはじめ',meta:'Adobe公式・初心者向けチュートリアル',url:'https://blog.adobe.com/jp/publish/2017/08/22/video-premiere-pro-beginner-tutorials-kotohajime'},
      {title:'DaVinci Resolve Training',meta:'Blackmagic Design公式・無料トレーニング',url:'https://www.blackmagicdesign.com/products/davinciresolve/training'}
    ],
    'AI画像制作':[
      {title:'Canva AI Essentials',meta:'Canva公式・約1時間・初心者向け',url:'https://www.canva.com/design-school/courses/ai-essentials/'},
      {title:'Canva Design School',meta:'Canva公式・AI/デザインの学習コース',url:'https://www.canva.com/design-school/courses/'},
      {title:'OpenAI Academy',meta:'OpenAI公式・AI活用の学習リソース',url:'https://academy.openai.com/'}
    ],
    'SNS運用':[
      {title:'Instagram Creators',meta:'Instagram公式・クリエイター向け情報',url:'https://creators.instagram.com/'},
      {title:'TikTok Academy',meta:'TikTok公式・マーケティング学習',url:'https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en'},
      {title:'Canva Social Media Mastery',meta:'Canva Design School・SNS制作',url:'https://www.canva.com/design-school/courses/'}
    ],
    'Webライター':[
      {title:'Google SEO Starter Guide',meta:'Google公式・SEOの基本',url:'https://developers.google.com/search/docs/fundamentals/seo-starter-guide'},
      {title:'Google Search Essentials',meta:'Google公式・検索に掲載されるための基本',url:'https://developers.google.com/search/docs/essentials'},
      {title:'Google Search Central',meta:'Google公式・SEO/検索の学習リソース',url:'https://developers.google.com/search/help'}
    ],
    'オンライン秘書':[
      {title:'Google Workspace Learning Center',meta:'Google公式・Gmail/Docs/Sheetsなど',url:'https://support.google.com/a/users/answer/9282720'},
      {title:'Google スプレッドシート ヘルプ',meta:'Google公式・表計算の基本',url:'https://support.google.com/docs/topic/9054603'},
      {title:'Microsoft 365 Training',meta:'Microsoft公式・Officeの学習',url:'https://support.microsoft.com/training'}
    ],
    'データ入力':[
      {title:'Google スプレッドシート ヘルプ',meta:'Google公式・表計算の基本',url:'https://support.google.com/docs/topic/9054603'},
      {title:'Microsoft Excel Training',meta:'Microsoft公式・Excelの学習',url:'https://support.microsoft.com/training'},
      {title:'Google Workspace Learning Center',meta:'Google公式・仕事で使うツールの基礎',url:'https://support.google.com/a/users/answer/9282720'}
    ],
    'リサーチ業務':[
      {title:'Google検索の基本',meta:'Google Search Central・検索/情報収集の入口',url:'https://www.google.com/search/howsearchworks/'},
      {title:'Google Search Central',meta:'Google公式・検索に関する基礎知識',url:'https://developers.google.com/search/help'},
      {title:'Google スプレッドシート ヘルプ',meta:'Google公式・調査結果の整理に活用',url:'https://support.google.com/docs/topic/9054603'}
    ],
    '営業代行':[
      {title:'HubSpot Academy',meta:'HubSpot公式・営業/マーケティングの無料講座',url:'https://academy.hubspot.com/ja'},
      {title:'Google Skillshop',meta:'Google公式・広告/マーケティングを学ぶ',url:'https://skillshop.withgoogle.com/intl/ja/'},
      {title:'Google 広告トレーニング',meta:'Google公式・無料オンライン学習',url:'https://skillshop.withgoogle.com/intl/ja_ALL/googleads/'}
    ],
    'アフィリエイト':[
      {title:'Google SEO Starter Guide',meta:'Google公式・SEOの基本',url:'https://developers.google.com/search/docs/fundamentals/seo-starter-guide'},
      {title:'Google Search Essentials',meta:'Google公式・検索の基本とポリシー',url:'https://developers.google.com/search/docs/essentials'},
      {title:'Google Analytics Academy / Skillshop',meta:'Google公式・アクセス解析を学ぶ',url:'https://skillshop.withgoogle.com/intl/ja/'}
    ]
  };
  return map[job]||[
    {title:'Google Skillshop',meta:'Google公式・無料オンライン学習',url:'https://skillshop.withgoogle.com/intl/ja/'},
    {title:'Canva Design School',meta:'Canva公式・デザイン学習',url:'https://www.canva.com/design-school/courses/'},
    {title:'Google Search Central',meta:'Google公式・Webの基礎',url:'https://developers.google.com/search/help'}
  ];
}
function makeDetailContent(jobs){
  const primary=jobs&&jobs[0];
  return {roadmap:primary?buildRoadmap(primary.name):[],learningResources:primary?buildLearningResources(primary.name):[],focusJob:primary?primary.name:''};
}
async function sendLinePush(userId,s){
  const token=process.env.LINE_MESSAGING_ACCESS_TOKEN;
  if(!token||!userId||!s?.result||!s?.jobs) return {sent:false,reason:'not_configured'};
  const top=s.jobs.slice(0,3).map((j,i)=>`${i+1}. ${j.name}`).join('\n');
  const url=`${publicUrl}/?diagnosis_id=${encodeURIComponent(Object.keys(store.sessions).find(k=>store.sessions[k]===s)||'')}&line=verified`;
  const text=`診断結果が出ました🎉\n\nあなたは「${typeInfo[s.result.main].name}」✨\n\nおすすめ副業TOP3\n${top}\n\n🗺️ あなた向けロードマップ\n📚 おすすめ学習リソース\n\n詳しい結果はこちら👇\n${url}`;
  try{
    const r=await fetch('https://api.line.me/v2/bot/message/push',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify({to:userId,messages:[{type:'text',text}]})});
    if(!r.ok){const detail=await r.text();logError('LINE-003','line_push', {headers:{}},{status:r.status,detail});return {sent:false,reason:'api_error'};}
    return {sent:true};
  }catch(e){console.error('LINE_PUSH',e.message);return {sent:false,reason:'request_error'};}
}
async function handle(req,res){const u=new URL(req.url,`http://${req.headers.host}`);try{
if(req.method==='GET'&&u.pathname==='/api/health')return json(res,200,{ok:true});

if(req.method==='GET'&&u.pathname==='/api/ads'){const ads=(store.advertisements||[]).filter(a=>a.enabled).sort((a,b)=>Number(b.priority||0)-Number(a.priority||0));return json(res,200,{ads:ads.map(safeAd)})}
if(req.method==='GET'&&u.pathname==='/api/admin/analytics'){if(!requireAdmin(req))return json(res,401,{error:'AUTH-001',message:'管理者認証が必要です'});const events=store.analytics||[];const count=e=>events.filter(x=>x.event===e).length;return json(res,200,{summary:{diagnosis_start:count('diagnosis_start'),diagnosis_complete:count('diagnosis_complete'),line_click:count('line_click'),line_verified:count('line_verified'),result_view:count('result_view'),share_click:count('share_click'),sidejob_click:count('sidejob_click'),ad_view:count('ad_view'),ad_click:count('ad_click')},types:Object.fromEntries(Object.keys(typeInfo).map(t=>[t,Object.values(store.sessions).filter(s=>s.result?.main===t).length]))})}
if(req.method==='GET'&&u.pathname==='/api/admin/sidejobs'){if(!requireAdmin(req))return json(res,401,{error:'AUTH-001',message:'管理者認証が必要です'});return json(res,200,{sidejobs})}
if(req.method==='POST'&&u.pathname==='/api/admin/ads'){if(!requireAdmin(req))return json(res,401,{error:'AUTH-001',message:'管理者認証が必要です'});const b=await body(req);if(!b.position||!b.provider)return json(res,400,{error:'AD-002',message:'広告設定が不足しています'});const ad={id:id(),position:b.position,provider:b.provider,ad_code:b.ad_code||'',enabled:b.enabled!==false,priority:Number(b.priority||0),createdAt:new Date().toISOString()};store.advertisements.push(ad);persist();return json(res,201,{ad:safeAd(ad)})}
if(req.method==='PATCH'&&u.pathname.startsWith('/api/admin/ads/')){if(!requireAdmin(req))return json(res,401,{error:'AUTH-001',message:'管理者認証が必要です'});const aid=u.pathname.split('/').pop(),ad=(store.advertisements||[]).find(x=>x.id===aid);if(!ad)return json(res,404,{error:'AD-001',message:'広告が見つかりません'});const b=await body(req);Object.assign(ad,{position:b.position??ad.position,provider:b.provider??ad.provider,ad_code:b.ad_code??ad.ad_code,enabled:b.enabled??ad.enabled,priority:b.priority??ad.priority,updatedAt:new Date().toISOString()});persist();return json(res,200,{ad:safeAd(ad)})}
if(req.method==='GET'&&u.pathname==='/api/questions')return json(res,200,{questions});
if(req.method==='POST'&&u.pathname==='/api/diagnosis/start'){const d=id();store.sessions[d]={answers:{},conditions:{},createdAt:new Date().toISOString()};persist();return json(res,200,{diagnosis_id:d});}
if(req.method==='POST'&&u.pathname==='/api/diagnosis/answer'){const b=await body(req),s=session(b.diagnosis_id);if(!s)return json(res,404,{error:'DIAG-001',message:'診断データを取得できません'});const q=questions.find(x=>x.id===b.question_id);if(!q)return json(res,400,{error:'DIAG-003',message:'不正な質問です'});if(!q.options.some(o=>o[0]===b.answer))return json(res,400,{error:'DIAG-003',message:'不正な回答です'});if(q.condition)s.conditions[q.condition]={A:1,B:2,C:3,D:4,E:5}[b.answer];else s.answers[q.id]=b.answer;persist();return json(res,200,{ok:true});}
if(req.method==='POST'&&u.pathname==='/api/diagnosis/complete'){const b=await body(req),s=session(b.diagnosis_id);if(!s)return json(res,404,{error:'DIAG-001',message:'診断データを取得できません'});for(let i=1;i<=20;i++){const q=questions.find(x=>x.id===i);if(q.condition?!s.conditions[q.condition]:!s.answers[i])return json(res,400,{error:'DIAG-003',message:'未回答の質問があります'});}let result;try{result=scoreDiagnosis(s.answers)}catch(e){logError('DIAG-004','scoreDiagnosis',req,{diagnosis_id:b.diagnosis_id});return json(res,500,{error:'DIAG-004',message:'診断スコアの計算に失敗しました'});}s.result=result;s.jobs=rankJobs(result,s.conditions);s.completedAt=new Date().toISOString();persist();return json(res,200,{diagnosis_id:b.diagnosis_id,preview:{main:result.main,type:typeInfo[result.main].name,icon:typeInfo[result.main].icon,color:typeInfo[result.main].color}})}
if(req.method==='GET'&&u.pathname==='/api/result'){const d=u.searchParams.get('diagnosis_id'),s=session(d);if(!s||!s.completedAt)return json(res,404,{error:'DIAG-008',message:'診断結果を取得できません'});if(!s.lineVerified)return json(res,200,{locked:true});return json(res,200,{locked:false,result:{...s.result,info:typeInfo[s.result.main],subInfo:typeInfo[s.result.sub],jobs:s.jobs.map(j=>({id:j.id,name:j.name,category:j.category,description:j.description,match:Math.round(j.total),difficulty:j.difficulty,initial_cost:j.initial_cost,required_time:j.required_time,how_to_start:j.how_to_start})),...makeDetailContent(s.jobs)}})}
if(req.method==='POST'&&u.pathname==='/api/dev/verify-line'){if(NODE_ENV==='production')return json(res,404,{error:'NOT_FOUND',message:'Not found'});const b=await body(req),s=session(b.diagnosis_id);if(!s)return json(res,404,{error:'LINE-002'});s.lineVerified=true;persist();return json(res,200,{ok:true});}
if(req.method==='GET'&&u.pathname==='/auth/line'){const d=u.searchParams.get('diagnosis_id');if(!session(d))return json(res,404,{error:'DIAG-001',message:'診断セッションがありません'});if(!process.env.LINE_CHANNEL_ID||!process.env.LINE_REDIRECT_URI)return json(res,503,{error:'LINE-001',message:'LINE環境変数が未設定です'});const state=id();store.sessions[state]={oauth:true,diagnosis_id:d,createdAt:new Date().toISOString()};persist();const p=new URLSearchParams({response_type:'code',client_id:process.env.LINE_CHANNEL_ID,redirect_uri:process.env.LINE_REDIRECT_URI,state,scope:'profile openid',bot_prompt:'normal'});return redirect(res,'https://access.line.me/oauth2/v2.1/authorize?'+p)}
if(req.method==='GET'&&u.pathname==='/auth/line/callback'){const state=u.searchParams.get('state'),code=u.searchParams.get('code'),os=session(state);if(!os||!os.oauth)return json(res,400,{error:'LINE-002',message:'LINE認証状態が確認できません'});if(!code)return json(res,400,{error:'LINE-001',message:'LINE認証コードがありません'});if(!process.env.LINE_CHANNEL_ID||!process.env.LINE_CHANNEL_SECRET||!process.env.LINE_REDIRECT_URI)return json(res,503,{error:'LINE-001',message:'LINE本番環境変数が未設定です'});const tokenRes=await fetch('https://api.line.me/oauth2/v2.1/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:process.env.LINE_REDIRECT_URI,client_id:process.env.LINE_CHANNEL_ID,client_secret:process.env.LINE_CHANNEL_SECRET})});if(!tokenRes.ok){logError('LINE-001','line_token_exchange',req,{diagnosis_id:os.diagnosis_id,status:tokenRes.status});return json(res,502,{error:'LINE-001',message:'LINE連携に失敗しました'});}const token=await tokenRes.json();const profileRes=await fetch('https://api.line.me/v2/profile',{headers:{Authorization:`Bearer ${token.access_token}`}});if(!profileRes.ok){logError('LINE-001','line_profile',req,{diagnosis_id:os.diagnosis_id,status:profileRes.status});return json(res,502,{error:'LINE-001',message:'LINEユーザー情報を取得できませんでした'});}const profile=await profileRes.json();const s=session(os.diagnosis_id);s.lineVerified=true;s.LINE_user_ID=profile.userId;s.lineVerifiedAt=new Date().toISOString();store.users[profile.userId]={LINE_user_ID:profile.userId,updatedAt:new Date().toISOString()};delete store.sessions[state];persist();await sendLinePush(profile.userId,s);return redirect(res,`/?diagnosis_id=${encodeURIComponent(os.diagnosis_id)}&line=verified`)}
if(req.method==='POST'&&u.pathname==='/api/analytics/event'){const b=await body(req);const allowed=['diagnosis_start','question_answer','diagnosis_complete','line_click','line_verified','result_view','sidejob_click','share_click','share_image_download','ad_view','ad_click'];if(!allowed.includes(b.event))return json(res,400,{error:'DIAG-003',message:'不正なイベントです'});if(!store.analytics)store.analytics=[];store.analytics.push({event:b.event,diagnosis_id:b.diagnosis_id||null,question_id:b.question_id||null,sidejob_id:b.sidejob_id||null,timestamp:new Date().toISOString()});if(store.analytics.length>10000)store.analytics.splice(0,1000);persist();return json(res,204,{})}
if(req.method==='GET'&&u.pathname==='/api/share-image'){const d=u.searchParams.get('diagnosis_id'),s=session(d);if(!s||!s.result)return json(res,404,{error:'DIAG-008',message:'結果がありません'});if(!s.lineVerified)return json(res,403,{error:'LINE-002',message:'LINE登録確認後にシェア画像を生成できます'});const inf=typeInfo[s.result.main],jobs=(s.jobs||[]).slice(0,3).map((j,i)=>`${i+1}. ${j.name}`).join('\\n');const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${inf.color}"/><rect x="55" y="55" width="970" height="1240" rx="48" fill="white" opacity=".96"/><text x="90" y="145" font-family="sans-serif" font-size="34" font-weight="700">副業適性診断</text><text x="90" y="285" font-family="sans-serif" font-size="34">あなたのタイプは</text><text x="90" y="385" font-family="sans-serif" font-size="72" font-weight="800">${esc(inf.name)}</text><text x="90" y="445" font-family="sans-serif" font-size="34">${s.result.main} TYPE</text><text x="90" y="560" font-family="sans-serif" font-size="30" font-weight="700">おすすめ副業 TOP3</text>${jobs.split('\\n').map((x,i)=>`<text x="110" y="635" font-family="sans-serif" font-size="34">${esc(x)}</text>`).join('')}<text x="90" y="1130" font-family="sans-serif" font-size="28">あなたは何タイプ？</text><text x="90" y="1190" font-family="sans-serif" font-size="24">無料で診断できます</text><text x="90" y="1240" font-family="sans-serif" font-size="22">${esc(publicUrl)}</text></svg>`;res.writeHead(200,{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'no-store'});return res.end(svg)}
if(req.method==='GET'){let fp=u.pathname==='/'?path.join(ROOT,'public','index.html'):path.join(ROOT,'public',u.pathname);if(!fp.startsWith(path.join(ROOT,'public')))return json(res,403,{error:'FORBIDDEN'});if(fs.existsSync(fp)){const ext=path.extname(fp);const ct={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp'}[ext]||'application/octet-stream';res.writeHead(200,{'Content-Type':ct});return res.end(fs.readFileSync(fp));}return json(res,404,{error:'NOT_FOUND'})}
return json(res,405,{error:'METHOD_NOT_ALLOWED'});
}catch(e){logError('DIAG-005','unhandled',req,{detail:e.message});return json(res,500,{error:'DIAG-005',message:'申し訳ありません。処理中にエラーが発生しました。'})}}
http.createServer(handle).listen(PORT,()=>console.log(`Sidejob diagnosis running at http://localhost:${PORT}`));
