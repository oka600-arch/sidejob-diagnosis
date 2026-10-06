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
async function track(event,extra={}){try{await fetch('/api/analytics/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,diagnosis_id:did,...extra})})}catch(e){}}
async function api(url,opt={}){const r=await fetch(url,{headers:{'Content-Type':'application/json'},...opt});const d=r.status===204?{}:await r.json();if(!r.ok)throw Object.assign(new Error(d.message||d.error),{data:d});return d}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function shell(x){app.innerHTML=`<div class="wrap">${x}</div>`}
function start(){const params=new URLSearchParams(location.search);if(params.get('diagnosis_id')&&params.get('line')==='verified'){did=params.get('diagnosis_id');return loadResult()};renderStart()}
function renderStart(){shell(`<section class="startScreen"><div class="coverTop"><div class="quick">\＼ かんたん<br>20問で診断 ／</div><h1>副業タイプ<br>診断</h1><p class="subtitle">Holland Career Test</p></div><div class="coverCharacterArea"><img class="coverCharacter" src="/assets/cover_character.png" alt="副業タイプ診断キャラクター"></div><div class="coverBenefits"><div><span>♧</span><b>自分の強み<br>がわかる</b></div><div><span>▣</span><b>おすすめの<br>副業がわかる</b></div><div><span>♡</span><b>これからの<br>働き方のヒントに</b></div></div><button class="startBtn" id="start">さっそく診断をはじめる <span>→</span></button><p class="free">＼ 所要時間 約3分・無料 ／</p></section>`);document.getElementById('start').onclick=begin}
async function begin(){try{const d=await api('/api/diagnosis/start',{method:'POST',body:'{}'});did=d.diagnosis_id;qs=(await api('/api/questions')).questions;answers={};idx=0;localStorage.removeItem('sidejob_answers');track('diagnosis_start');renderQ()}catch(e){showErr(e)}}
function renderQ(){const q=qs[idx],pct=Math.round((idx/qs.length)*100);const opts=[...q.options].sort(()=>Math.random()-.5);shell(`<div class="quizHead"><button class="circleBack" id="backTop">‹</button><div class="qcount">質問 ${idx+1} / ${qs.length}</div><div class="shareGhost"></div></div><div class="progress"><span style="width:${Math.max(4,pct)}%"></span></div><section class="quizCard quizCardTextOnly"><div class="question">${escapeHtml(q.text)}</div><div class="options">${opts.map(o=>`<button class="opt" data-a="${o[0]}">${escapeHtml(o[1])}</button>`).join('')}</div></section>`);document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(q,b.dataset.a));document.getElementById('backTop').onclick=()=>{if(idx>0){idx--;renderQ()}}}
async function answer(q,a){answers[q.id]=a;track('question_answer',{question_id:q.id});localStorage.setItem('sidejob_answers',JSON.stringify(answers));try{await api('/api/diagnosis/answer',{method:'POST',body:JSON.stringify({diagnosis_id:did,question_id:q.id,answer:a})});if(idx<qs.length-1){idx++;renderQ()}else{await complete()}}catch(e){showErr(e)}}
async function complete(){try{track('diagnosis_complete');const d=await api('/api/diagnosis/complete',{method:'POST',body:JSON.stringify({diagnosis_id:did})});renderGate(d.preview)}catch(e){showErr(e)}}
function renderGate(p){const type=p.main||'A';const sub=p.sub||'I';shell(`<section class="resultPage gatePage referenceStyleResult"><div class="resultTop"><span>診断結果</span><span class="gateShare">⌯</span></div><div class="polishedHero">${resultCharacter(type,sub)}</div><button class="lineCard" id="line"><span class="lineLogo">LINE</span><span><b>LINEで友だち追加して</b><br><strong>詳しい結果を受け取る</strong></span><i>›</i></button><div class="benefits"><div>TOP5<span>あなたに合った<br>副業</span></div><div>ROADMAP<span>具体的な始め方<br>ロードマップ</span></div><div>LEARN<span>おすすめの<br>学習リソース</span></div></div><button class="homeBtn" id="home">トップに戻る</button>${location.hostname==='localhost'||location.hostname==='127.0.0.1'?'<button class="btn secondary" id="dev">開発テスト：LINE登録済みにする</button>':''}</section>`);document.getElementById('line').onclick=()=>{track('line_click');location.href='/auth/line?diagnosis_id='+encodeURIComponent(did)};const home=document.getElementById('home');if(home)home.onclick=()=>{location.href='/'};const dev=document.getElementById('dev');if(dev)dev.onclick=async()=>{try{await api('/api/dev/verify-line',{method:'POST',body:JSON.stringify({diagnosis_id:did})});loadResult()}catch(e){showErr(e)}}}
async function loadResult(){try{const d=await api('/api/result?diagnosis_id='+encodeURIComponent(did));if(d.locked)return renderGate({icon:'🔒',type:'結果ロック中',color:'#667085'});result=d.result;track('result_view');renderResult()}catch(e){showErr(e)}}
function resultCharacter(type,sub){
  const main=typeInfo[type]||typeInfo.A;
  const sec=typeInfo[sub]||typeInfo.I;
  const mascot=`/assets/dynamic/${type}.webp`;
  const subMascot=`/assets/dynamic/${sub}.webp`;
  return `<div class="resultImageWrap resultCharacterV2 dynamicReferenceResult">
    <div class="dynamicResultHero" style="--main:${main.color};--soft:${main.soft}">
      <div class="dynamicResultKicker">あなたの副業タイプは…</div>
      <div class="dynamicResultMain"><div class="dynamicTypeBadge">${type}</div><div><div class="dynamicTypeName">${escapeHtml(main.name)}</div><div class="dynamicTypeEn">(${escapeHtml(main.en)})</div></div></div>
      <div class="dynamicAction">${escapeHtml(main.action)}</div>
      <div class="dynamicPhrase">${escapeHtml(main.phrase)}</div>
      <div class="dynamicHumanStage">
        <img class="dynamicHuman" src="/assets/dynamic/human.webp" alt="診断キャラクター">
        <div class="mainBuddyOnHands"><span class="buddyLabel">メイン</span><img class="dynamicMascot mainMascot" src="${mascot}" alt="${escapeHtml(main.name)}の相棒キャラクター"></div>
        <div class="subBuddyOnShoulder"><span class="buddyLabel subLabel">サブ ${sub}</span><img class="dynamicMascot subMascot" src="${subMascot}" alt="${escapeHtml(sec.name)}の相棒キャラクター"></div>
      </div>
      <div class="dynamicDescription">${escapeHtml(main.desc||'あなたの興味や行動傾向を活かしやすいタイプです。')}</div>
      <div class="dynamicJobs"><div class="dynamicJobsTitle">こんな副業・仕事が向いています</div>${main.jobs.map(j=>`<div class="dynamicJob">${escapeHtml(j)}</div>`).join('')}</div>
    </div>
  </div>`;
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
