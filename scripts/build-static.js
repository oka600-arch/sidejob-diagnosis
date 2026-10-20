// Render Static Site用: public/ を dist/ にコピーし、config.js に診断APIのURLを書き込む
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),SRC=path.join(ROOT,'public'),OUT=path.join(ROOT,'dist');
const apiBase=(process.env.API_BASE||'https://sidejob-diagnosis-5.onrender.com').replace(/\/$/,'');
fs.rmSync(OUT,{recursive:true,force:true});
fs.cpSync(SRC,OUT,{recursive:true,filter:p=>!/\.bak/.test(p)});
const gaRaw=(process.env.GA_MEASUREMENT_ID||'G-330W5VMPWR').trim();
const gaId=/^G-[A-Z0-9]+$/.test(gaRaw)&&!/XXXX/.test(gaRaw)?gaRaw:''; // 仮のIDのままなら計測しない
fs.writeFileSync(path.join(OUT,'config.js'),`window.SIDEJOB_API_BASE=${JSON.stringify(apiBase)};\nwindow.SIDEJOB_GA_ID=${JSON.stringify(gaId)};\n`);
console.log('static site built to dist/ with API_BASE='+apiBase+(gaId?' GA='+gaId:' (GA off)'));
