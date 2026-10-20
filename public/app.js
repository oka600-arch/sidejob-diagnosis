const app=document.getElementById('app');
let qs=[],answers={},idx=0,did=null,result=null;
const typeInfo={
 R:{name:'現実・実務タイプ',en:'Realistic',action:'つくる・動かす',phrase:'手を動かしてカタチにするのが好き',desc:'アイデアを実際のカタチにしたり、仕組みをつくって動かすことにやりがいを感じるタイプです。',color:'#C9553D',soft:'#F8E9E4',jobs:['Webサイト制作','動画編集','写真・映像撮影','業務効率化・仕組み作り'],symbol:'🔧'},
 I:{name:'研究・探究タイプ',en:'Investigative',action:'調べる・考える',phrase:'深く知る・考えるのが好き',desc:'興味のあることを深く調べたり、知識を集めて考えることで力を発揮するタイプです。',color:'#477D67',soft:'#E9F1EA',jobs:['リサーチ・調査','データ分析','Webライティング','資料作成'],symbol:'🔎'},
 A:{name:'芸術・表現タイプ',en:'Artistic',action:'表現する',phrase:'アイデアを形にするのが好き',desc:'色やデザイン、写真や動画など、自分の感性を使って魅力的に表現するタイプです。',color:'#8A70A6',soft:'#F0EAF6',jobs:['イラスト制作','デザイン制作','SNSコンテンツ','ライティング'],symbol:'🎨'},
 S:{name:'人・サポートタイプ',en:'Social',action:'支える',phrase:'人と関わりサポートするのが好き',desc:'相手の気持ちや困りごとに気づき、人の役に立ったり支えたりすることが得意なタイプです。',color:'#6E9B7D',soft:'#EAF3EC',jobs:['SNS運用サポート','オンライン講師','カスタマーサポート','コミュニティ運営'],symbol:'♡'},
 E:{name:'ビジネス・行動タイプ',en:'Enterprising',action:'動かす',phrase:'チャレンジするのが好き',desc:'自分から動いて人に伝えたり、目標に向かってチャンスを広げることが得意なタイプです。',color:'#E47B49',soft:'#FCEDE4',jobs:['アフィリエイト','SNS発信','営業・企画','Webマーケティング'],symbol:'📣'},
 C:{name:'コツコツ・管理タイプ',en:'Conventional',action:'整える',phrase:'計画して整えるのが好き',desc:'情報や手順を整理し、正確にコツコツ積み上げることで力を発揮するタイプです。',color:'#C99B3D',soft:'#F8F0D9',jobs:['事務サポート','スケジュール管理','データ入力','資料作成'],symbol:'☑'}
};
async function track(event,extra={}){if(window.gtag)gtag('event',event,extra);try{await fetch(API_BASE+'/api/analytics/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,diagnosis_id:did,...extra})})}catch(e){}}
const API_BASE=(window.SIDEJOB_API_BASE||'').replace(/\/$/,'');
// Googleアナリティクス（GA4）。測定IDは scripts/build-static.js が GA_MEASUREMENT_ID 環境変数から書き込む
(function(id){if(!id||location.hostname==='localhost'||location.hostname==='127.0.0.1')return;const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',id)})(window.SIDEJOB_GA_ID);
// 診断APIは無料Web Serviceなので、スリープ中は起動まで待ってからリクエストする
let apiReady=null;
function wakeApi(){if(!apiReady)apiReady=(async()=>{for(let i=0;i<40;i++){try{const r=await fetch(API_BASE+'/api/health',{cache:'no-store'});if(r.ok&&(await r.json()).ok)return true}catch(e){}await new Promise(ok=>setTimeout(ok,3000))}apiReady=null;throw Object.assign(new Error('サーバーに接続できません'),{data:{error:'NET-001',message:'サーバーに接続できませんでした。時間をおいて再試行してください。'}})})();return apiReady}
async function api(url,opt={}){await wakeApi();const r=await fetch(API_BASE+url,{headers:{'Content-Type':'application/json'},...opt});const d=r.status===204?{}:await r.json();if(!r.ok)throw Object.assign(new Error(d.message||d.error),{data:d});return d}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function shell(x){app.innerHTML=`<div class="wrap">${x}</div>`}
function start(){wakeApi().catch(()=>{});const params=new URLSearchParams(location.search);if(params.get('diagnosis_id')&&params.get('line')==='verified'){did=params.get('diagnosis_id');return loadResult()};renderStart()}
function renderStart(){shell(`<section class="startScreen"><div class="coverTop"><div class="quick">\＼ かんたん<br>20問で診断 ／</div><h1>副業タイプ<br>診断</h1><p class="subtitle">Holland Career Test</p></div><div class="coverCharacterArea"><img class="coverCharacter" src="/assets/cover_character.png" alt="副業タイプ診断キャラクター"></div><div class="coverBenefits"><div><span>♧</span><b>自分の強み<br>がわかる</b></div><div><span>▣</span><b>おすすめの<br>副業がわかる</b></div><div><span>♡</span><b>これからの<br>働き方のヒントに</b></div></div><button class="startBtn" id="start">さっそく診断をはじめる <span>→</span></button><p class="free">＼ 所要時間 約3分・無料 ／</p></section>`);document.getElementById('start').onclick=begin}
async function begin(){const btn=document.getElementById('start');if(btn){btn.disabled=true;btn.innerHTML='診断を準備しています…'}try{const d=await api('/api/diagnosis/start',{method:'POST',body:'{}'});did=d.diagnosis_id;qs=(await api('/api/questions')).questions;answers={};idx=0;localStorage.removeItem('sidejob_answers');track('diagnosis_start');renderQ()}catch(e){showErr(e)}}
function renderQ(){const q=qs[idx],pct=Math.round((idx/qs.length)*100);const opts=[...q.options].sort(()=>Math.random()-.5);shell(`<div class="quizHead"><button class="circleBack" id="backTop">‹</button><div class="qcount">質問 ${idx+1} / ${qs.length}</div><div class="shareGhost"></div></div><div class="progress"><span style="width:${Math.max(4,pct)}%"></span></div><section class="quizCard quizCardTextOnly"><div class="question">${escapeHtml(q.text)}</div><div class="options">${opts.map(o=>`<button class="opt" data-a="${o[0]}">${escapeHtml(o[1])}</button>`).join('')}</div></section>`);document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(q,b.dataset.a));document.getElementById('backTop').onclick=()=>{if(idx>0){idx--;renderQ()}}}
async function answer(q,a){answers[q.id]=a;track('question_answer',{question_id:q.id});localStorage.setItem('sidejob_answers',JSON.stringify(answers));try{await api('/api/diagnosis/answer',{method:'POST',body:JSON.stringify({diagnosis_id:did,question_id:q.id,answer:a})});if(idx<qs.length-1){idx++;renderQ()}else{await complete()}}catch(e){showErr(e)}}
async function complete(){try{track('diagnosis_complete');const d=await api('/api/diagnosis/complete',{method:'POST',body:JSON.stringify({diagnosis_id:did})});renderGate(d.preview)}catch(e){showErr(e)}}
function renderGate(p){const type=p.main||'A';const sub=p.sub||'I';if(p.main)track('result_type',{result_type:p.main,result_sub_type:p.sub||''});shell(`<section class="resultPage gatePage referenceStyleResult"><div class="resultTop"><span>診断結果</span><span class="gateShare">⌯</span></div><div class="polishedHero">${resultCharacter(type,sub)}</div><button class="lineCard" id="line"><span class="lineLogo">LINE</span><span><b>LINEで友だち追加して</b><br><strong>詳しい結果を受け取る</strong></span><i>›</i></button><div class="benefits"><div>TOP5<span>あなたに合った<br>副業</span></div><div>ROADMAP<span>具体的な始め方<br>ロードマップ</span></div><div>LEARN<span>おすすめの<br>学習リソース</span></div></div><button class="homeBtn" id="home">トップに戻る</button>${location.hostname==='localhost'||location.hostname==='127.0.0.1'?'<button class="btn secondary" id="dev">開発テスト：LINE登録済みにする</button>':''}</section>`);document.getElementById('line').onclick=()=>{track('line_click');location.href=API_BASE+'/auth/line?diagnosis_id='+encodeURIComponent(did)};const home=document.getElementById('home');if(home)home.onclick=()=>{location.href='/'};const dev=document.getElementById('dev');if(dev)dev.onclick=async()=>{try{await api('/api/dev/verify-line',{method:'POST',body:JSON.stringify({diagnosis_id:did})});loadResult()}catch(e){showErr(e)}}}
async function loadResult(){try{const d=await api('/api/result?diagnosis_id='+encodeURIComponent(did));if(d.locked)return renderGate({icon:'🔒',type:'結果ロック中',color:'#667085'});result=d.result;track('result_view',{result_type:result.main,result_sub_type:result.sub||''});renderResult()}catch(e){showErr(e)}}
function typeNameHtml(name){
  const base=name.replace(/タイプ$/,'');
  return escapeHtml(base).replace(/・/g,'・<wbr>')+(base!==name?'<small>タイプ</small>':'');
}
const jobIcons={
  laptop:'<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  search:'<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l6 6"/>',
  chart:'<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
  pen:'<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/>',
  doc:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  palette:'<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5S14 15 15 15h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  phone:'<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  teach:'<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
  headset:'<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/>',
  users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c2.8 0 5 2.2 5 5"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  megaphone:'<path d="M3 10v4h4l9 5V5L7 10z"/><path d="M19 9a4 4 0 0 1 0 6"/>',
  handshake:'<path d="M2 12l4-4 4 2 3-2 4 1 5 3"/><path d="M6 8v6l5 4 2-1 3 2 4-4"/>',
  trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  clipboard:'<rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9 4V2.5h6V4M8.5 11l2 2 4-4M8.5 17h7"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  keyboard:'<rect x="2" y="6" width="20" height="12" rx="1.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'
};
const jobIconOf={
  'Webサイト制作':'laptop','動画編集':'video','写真・映像撮影':'camera','業務効率化・仕組み作り':'gear',
  'リサーチ・調査':'search','データ分析':'chart','Webライティング':'pen','資料作成':'doc',
  'イラスト制作':'pen','デザイン制作':'palette','SNSコンテンツ':'phone','ライティング':'pen',
  'SNS運用サポート':'phone','オンライン講師':'teach','カスタマーサポート':'headset','コミュニティ運営':'users',
  'アフィリエイト':'link','SNS発信':'megaphone','営業・企画':'handshake','Webマーケティング':'trend',
  '事務サポート':'clipboard','スケジュール管理':'calendar','データ入力':'keyboard'
};
function jobIcon(job){return `<svg viewBox="0 0 24 24" aria-hidden="true">${jobIcons[jobIconOf[job]]||jobIcons.clipboard}</svg>`}
function resultCharacter(type,sub){
  const main=typeInfo[type]||typeInfo.A;
  const sec=typeInfo[sub]||typeInfo.I;
  return `<div class="rv3" style="--main:${main.color};--soft:${main.soft};--sub:${sec.color};--subsoft:${sec.soft}">
    <div class="rv3Hero">
      <div class="rv3Copy">
        <div class="rv3Kicker">あなたの副業タイプは…</div>
        <div class="rv3Type"><div class="rv3Badge">${type}</div><div class="rv3TypeText"><div class="rv3TypeName">${typeNameHtml(main.name)}</div><div class="rv3TypeEn">(${escapeHtml(main.en)})</div></div></div>
        <div class="rv3Action"><span>${escapeHtml(main.action)}</span></div>
        <div class="rv3Phrase">${escapeHtml(main.phrase)}</div>
        <p class="rv3Desc">${escapeHtml(main.desc||'あなたの興味や行動傾向を活かしやすいタイプです。')}</p>
      </div>
      <div class="rv3Stage">
        <img class="rv3Human" src="/assets/dynamic/human.webp" alt="診断キャラクター">
        <img class="rv3Buddy rv3BuddyMain" src="/assets/dynamic/${type}.webp" alt="${escapeHtml(main.name)}の相棒キャラクター">
        <img class="rv3Buddy rv3BuddySub" src="/assets/dynamic/${sub}.webp" alt="${escapeHtml(sec.name)}の相棒キャラクター">
      </div>
    </div>
    <div class="rv3JobsTitle"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/></svg><span>こんな副業・仕事が向いています</span></div>
    <div class="rv3Jobs">${main.jobs.map(j=>`<div class="rv3Job"><i class="rv3JobIcon">${jobIcon(j)}</i><div class="rv3JobText"><b>${escapeHtml(j)}</b><span>${escapeHtml(jobHint(j))}</span></div><i class="rv3JobArrow">›</i></div>`).join('')}</div>
    <div class="rv3Sub">
      <div class="rv3SubLeft">
        <div class="rv3SubKicker">あなたのサブタイプは…</div>
        <div class="rv3SubType"><div class="rv3SubBadge">${sub}</div><div><div class="rv3SubName">${typeNameHtml(sec.name)}</div><div class="rv3SubEn">(${escapeHtml(sec.en)})</div></div></div>
      </div>
      <div class="rv3SubRight"><b>${escapeHtml(sec.phrase)}</b><span>${escapeHtml(sec.desc||'')}</span></div>
    </div>
  </div>`;
}
function jobHint(job){
  const hints={
    'Webサイト制作':'デザイン・コードで形にする','動画編集':'編集スキルでコンテンツをつくる','写真・映像撮影':'撮って伝えるクリエイティブな仕事','業務効率化・仕組み作り':'ツールや仕組みで作業をスムーズにする',
    'リサーチ・調査':'情報を集めて深く調べる','データ分析':'数字から傾向を読み解く','Webライティング':'調べたことを文章で伝える','資料作成':'情報を整理してわかりやすくする',
    'イラスト制作':'感性を使って表現する','デザイン制作':'見た目とアイデアを形にする','SNSコンテンツ':'世界観をコンテンツにする','ライティング':'言葉で魅力を伝える',
    'SNS運用サポート':'相手に寄り添って運用を支える','オンライン講師':'知識をわかりやすく伝える','カスタマーサポート':'困りごとを解決する','コミュニティ運営':'人をつないで場をつくる',
    'アフィリエイト':'発信して人に届ける','SNS発信':'発信で人を動かす','営業・企画':'人を巻き込み進める','Webマーケティング':'戦略を考えて成果につなげる',
    '事務サポート':'正確にコツコツ支える','スケジュール管理':'予定を整理して進める','データ入力':'正確に積み上げる','資料作成':'情報を整理してまとめる'
  };
  return hints[job]||'あなたの強みを活かしやすい仕事';
}
function renderResult(){
  const r=result,t=typeInfo[r.main]||typeInfo.A;
  const jobs=(r.jobs||[]).map((j,i)=>`<article class="jobCard"><div class="jobRank">${i+1}</div><div class="jobBody"><div class="jobName">${escapeHtml(j.name)}</div><div class="jobDesc">${escapeHtml(j.description||'あなたの適性に合った副業です。')}</div><div class="jobMeta"><span>${escapeHtml(j.category||'おすすめ')}</span><span>適性 ${escapeHtml(j.match)}%</span></div></div><span class="jobArrow">›</span></article>`).join('');
  const roadmap=(r.roadmap||[]).map((x,i)=>`<li><b>STEP ${i+1}</b><span>${escapeHtml(x)}</span></li>`).join('');
  const learning=(r.learningResources||[]).map(x=>{if(typeof x==='string')return `<li>${escapeHtml(x)}</li>`;return `<li class="resourceItem"><a href="${escapeHtml(x.url||'#')}" target="_blank" rel="noopener noreferrer"><b>${escapeHtml(x.title||'学習リソース')}</b><small>${escapeHtml(x.meta||'')}</small></a></li>`}).join('');
  shell(`<section class="resultPage polishedResult referenceStyleResult" style="--type:${t.color};--soft:${t.soft}">
    <div class="resultTop"><span>診断結果</span><button id="shareTop" aria-label="シェア">♧</button></div>
    <div class="polishedHero">${resultCharacter(r.main,r.sub)}</div>
    <section class="top5Panel"><div class="top5Title"><h2>あなたにおすすめの副業TOP5</h2></div><div class="top5List">${jobs}</div></section>
    <div class="detailGrid"><section class="detailPanel roadmapPanel"><div class="detailHeading"><div><small>START HERE</small><h3>あなた向けロードマップ</h3></div></div><p class="detailLead">まずは「${escapeHtml(r.focusJob||'おすすめ副業')}」から、できることを1つずつ増やしていこう。</p><ol>${roadmap}</ol></section><section class="detailPanel learningPanel"><div class="detailHeading"><div><small>LEARNING</small><h3>おすすめの学習リソース</h3></div></div><p class="detailLead">今のSTEPに必要なものから選ぼう。</p><ul>${learning}</ul></section></div>
    <button class="homeBtn polishedHome" id="home">トップに戻る</button>
  </section>`);
  document.getElementById('shareTop').onclick=share;
  document.getElementById('home').onclick=()=>{location.href='/'};
}
function shareText(){return `副業タイプ診断やってみた！\n私は「${(typeInfo[result.main]||typeInfo.A).name}」でした✨\nサブタイプは「${(typeInfo[result.sub]||typeInfo.A).name}」でした！\nおすすめ副業は\n${result.jobs.slice(0,3).map(j=>'・'+j.name).join('\n')}\n\nあなたは何タイプ？\n診断URL：${location.origin}`}
async function share(){track('share_click');if(navigator.share){try{await navigator.share({title:'副業タイプ診断',text:shareText(),url:location.origin});return}catch(e){}}await navigator.clipboard?.writeText(shareText());alert('シェア文章をコピーしました！')}
function showErr(e){const msg=e?.data?.message||'申し訳ありません。処理中にエラーが発生しました。';const code=e?.data?.error||'UNKNOWN';app.innerHTML+=`<div class="error"><b>エラーが発生しました</b><br>${escapeHtml(msg)}<br><span>エラーコード：${code}</span><br><button class="btn secondary" onclick="location.reload()">再試行</button></div>`}
start();
