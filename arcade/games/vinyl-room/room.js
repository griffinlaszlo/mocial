(function(){
  var THEME=window.ROOM_THEME||'classic', D=window.ROOM_DATA[THEME], A=D.albums, XMAS=THEME==='xmas';
  var $=function(s){return document.querySelector(s)};
  var room=$('#room'); $('#photo').src=D.photo; if(XMAS) room.classList.add('xmas');
  var tile=false; function layout(){ var w=innerWidth,h=innerHeight; tile=(w<380&&h<380&&Math.abs(w-h)<40)||/[?&]poster/.test(location.search); room.classList.toggle('tile',tile); } layout(); addEventListener('resize',layout);

  var seq=[]; A.forEach(function(a,ai){ a.tracks.forEach(function(t,ti){ seq.push([ai,ti]); }); });
  var pos=0, audio=new Audio(); audio.preload='auto'; var playing=false, started=false, POSTER=/[?&]poster/.test(location.search);
  var rack=$('#rack'), thumbs=[], rots=[-1.4,1,-.6,1.5,-1.1,.7,-1.6,1.2];
  A.forEach(function(a,i){ var b=document.createElement('button'); b.style.setProperty('--r',rots[i%8]+'deg'); b.setAttribute('aria-label',a.album+' by '+a.artist); b.innerHTML='<img src="'+a.cover+'" alt="">'; b.onclick=function(e){ e.stopPropagation(); go(seq.findIndex(function(s){return s[0]===i;}),true); }; rack.appendChild(b); thumbs.push(b); });

  // accent colour from the cover art
  var cols={};
  function accent(src,cb){ if(cols[src]) return cb(cols[src]); var im=new Image(); im.onload=function(){ try{ var c=document.createElement('canvas'); c.width=c.height=16; var x=c.getContext('2d'); x.drawImage(im,0,0,16,16); var d=x.getImageData(0,0,16,16).data,r=0,g=0,b=0,w=0; for(var i=0;i<d.length;i+=4){ var mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]),wt=(mx-mn)/255*(mx/255)+.02; r+=d[i]*wt; g+=d[i+1]*wt; b+=d[i+2]*wt; w+=wt; } r/=w; g/=w; b/=w;
      var R=r/255,G=g/255,B=b/255,mx2=Math.max(R,G,B),mn2=Math.min(R,G,B),dd=mx2-mn2,h=0; if(dd){ h=mx2===R?((G-B)/dd)%6:mx2===G?(B-R)/dd+2:(R-G)/dd+4; h=Math.round(((h*60)+360)%360); }
      var s=dd?Math.max(60,Math.min(100,dd/(1-Math.abs(mx2+mn2-1))*100)):0; cols[src]=dd<.1?'#f2c27a':'hsl('+h+' '+Math.round(s)+'% 62%)'; cb(cols[src]); }catch(e){} }; im.src=src; }

  var cur=-1, accentNow='#f2c27a';
  function show(){ var s=seq[pos],a=A[s[0]],t=a.tracks[s[1]];
    if(cur!==s[0]){ cur=s[0]; $('#label').src=a.cover; $('#alb').textContent=a.album; $('#sub2').textContent=a.artist+(a.year?' · '+a.year:'');
      var n=$('.note span'); n.textContent=a.note; n.style.animation='none'; void n.offsetWidth; n.style.animation='';
      thumbs.forEach(function(b,i){ b.classList.toggle('on',i===s[0]); }); accent(a.cover,function(c){ accentNow=c; room.style.setProperty('--accent',c); }); }
    $('#trk').textContent='♪ '+t.t; }
  function load(){ var s=seq[pos],t=A[s[0]].tracks[s[1]]; audio.src=t.f; show(); }
  function setPlaying(p){ playing=p; $('#disc').classList.toggle('spin',p||tile); }

  // real audio drives the glow (bass → painting, mids → chandelier); a gentle idle pulse when nothing is playing
  var ctx=null, an=null, bins=null;
  function ensureCtx(){ if(ctx){ if(ctx.state==='suspended') ctx.resume(); return; } try{ var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; ctx=new AC(); var src=ctx.createMediaElementSource(audio); an=ctx.createAnalyser(); an.fftSize=256; an.smoothingTimeConstant=.7; bins=new Uint8Array(an.frequencyBinCount); src.connect(an); an.connect(ctx.destination); }catch(e){ ctx=null; an=null; } }
  function play(){ if(POSTER) return; ensureCtx(); var pr=audio.play(); if(pr&&pr.then){ pr.then(function(){ started=true; $('#start').classList.add('hide'); }).catch(function(){ if(!started) $('#start').classList.remove('hide'); }); } }
  function go(i,auto){ pos=(i+seq.length)%seq.length; load(); if(auto) play(); }
  audio.addEventListener('play',function(){ setPlaying(true); }); audio.addEventListener('pause',function(){ setPlaying(false); });
  audio.addEventListener('ended',function(){ go(pos+1,true); });
  audio.addEventListener('timeupdate',function(){ $('#bar').style.width=(audio.currentTime/(audio.duration||30)*100)+'%'; });
  function toggle(){ audio.paused?play():audio.pause(); }
  $('#hit').onclick=toggle; $('#nx').onclick=function(e){ e.stopPropagation(); go(pos+1,true); }; $('#pv').onclick=function(e){ e.stopPropagation(); go(pos-1,true); };
  $('#start').onclick=function(){ $('#start').classList.add('hide'); started=true; play(); };

  setPlaying(false); load();
  if(tile){ $('#disc').classList.add('spin'); setInterval(function(){ go(pos+2<seq.length?pos+2:0,false); },3200); } else play();

  // particles: notes drift up off the record (snow too at Christmas)
  var cv=$('#fx'), g=cv.getContext('2d'), P=[], snow=[], W=0, H=0; function size(){ var r=cv.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1); W=cv.width=Math.max(10,r.width*d); H=cv.height=Math.max(10,r.height*d); } size(); addEventListener('resize',size);
  if(XMAS) for(var i=0;i<(tile?22:48);i++) snow.push({x:Math.random(),y:Math.random(),r:.5+Math.random()*1.7,v:.04+Math.random()*.1,s:Math.random()*6.28});
  var NOTES=['♪','♫','♩'], t0=performance.now(), bass=0, mid=0, lastSpawn=0;
  (function frame(now){ requestAnimationFrame(frame); var t=(now-t0)/1000, live=an&&!audio.paused&&bins;
    if(live){ an.getByteFrequencyData(bins); bass=(bins[1]+bins[2]+bins[3]+bins[4])/1020; var m=0; for(var i=6;i<22;i++) m+=bins[i]; mid=m/16/255; bass=Math.min(1,bass*1.25); mid=Math.min(1,mid*1.6); }
    else if(playing){ bass=.32+.22*Math.max(0,Math.sin(t*5.4)); mid=.3+.2*Math.sin(t*2.7+1); }
    else { bass=.1+.04*Math.sin(t*1.3); mid=.12+.04*Math.sin(t*1.1); }
    room.style.setProperty('--bass',bass.toFixed(3)); room.style.setProperty('--mid',mid.toFixed(3));
    g.clearRect(0,0,W,H); var k=W/400;
    if(playing&&now-lastSpawn>(380-bass*260)){ lastSpawn=now; P.push({x:.5+(Math.random()-.5)*.2,y:.68,vx:(Math.random()-.5)*.012,vy:-.05-Math.random()*.05,n:NOTES[(Math.random()*3)|0],life:0,sz:12+Math.random()*10}); }
    g.textAlign='center'; for(var j=P.length-1;j>=0;j--){ var p=P[j]; p.life+=.016; p.x+=p.vx*.016*3+Math.sin(p.life*3)*.0008; p.y+=p.vy*.016; var a=Math.max(0,1-p.life/2.6); if(a<=0){ P.splice(j,1); continue; }
      g.globalAlpha=a*.9; g.fillStyle=accentNow; g.font='700 '+(p.sz*k)+'px system-ui'; g.fillText(p.n,p.x*W,p.y*H); }
    g.globalAlpha=.9; g.fillStyle='#fff'; snow.forEach(function(f){ f.y+=f.v*.016; f.s+=.02; if(f.y>1.02){ f.y=-.02; f.x=Math.random(); } g.beginPath(); g.arc((f.x+Math.sin(f.s)*.012)*W,f.y*H,f.r*k,0,6.28); g.fill(); }); g.globalAlpha=1;
  })(t0);

  // christmas: the same room, dressed. Everything is pinned to a spot in the photo (percent of the photo), bottoms anchored on shelves / table / floor
  if(XMAS){
    var host=$('#lightsHost'), out='';
    function dec(svg,left,top,w,cls){ out+='<div class="dec '+(cls||'')+'" style="left:'+left+'%;top:'+top+'%;width:'+w+'%">'+svg+'</div>'; }
    var CANDLE='<svg viewBox="0 0 20 72"><defs><radialGradient id="cg"><stop offset="0" stop-color="#ffc766" stop-opacity=".95"/><stop offset="1" stop-color="#ffc766" stop-opacity="0"/></radialGradient></defs><circle class="halo" cx="10" cy="12" r="22" fill="url(#cg)"/><rect x="4" y="24" width="12" height="46" rx="2" fill="#f1e6cf"/><rect x="4" y="38" width="12" height="6" fill="#c8242d"/><rect x="4" y="24" width="4" height="46" rx="2" fill="#fff" opacity=".35"/><ellipse class="flame" cx="10" cy="14" rx="3.6" ry="9" fill="#ffae3b"/><ellipse class="flame" cx="10" cy="16" rx="1.9" ry="5" fill="#fff4b8"/></svg>';
    var GLOBE='<svg viewBox="0 0 60 76"><defs><clipPath id="gc"><circle cx="30" cy="30" r="25"/></clipPath><radialGradient id="gg" cx=".35" cy=".3"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".6" stop-color="#bcd8ff" stop-opacity=".16"/><stop offset="1" stop-color="#9fc2ff" stop-opacity=".3"/></radialGradient></defs>'
      +'<circle cx="30" cy="30" r="25" fill="#16314f"/><g clip-path="url(#gc)"><path d="M0 52 Q14 38 28 46 Q42 34 60 50 V60 H0Z" fill="#eef4ff"/><path d="M38 46 l5 -13 l5 13z M41 38 l2 -8 l2 8z" fill="#1d6b3d"/><g fill="#fff"><circle class="sf" cx="14" cy="14" r="1.2"/><circle class="sf s2" cx="24" cy="8" r="1"/><circle class="sf s3" cx="36" cy="12" r="1.3"/><circle class="sf s4" cx="46" cy="20" r="1"/><circle class="sf s2" cx="20" cy="26" r="1.1"/><circle class="sf s3" cx="30" cy="20" r="1"/><circle class="sf" cx="42" cy="30" r="1.2"/><circle class="sf s4" cx="12" cy="34" r="1"/></g></g>'
      +'<circle cx="30" cy="30" r="25" fill="url(#gg)" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/><path d="M13 20 A20 20 0 0 1 24 8" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M13 58 h34 l4 14 h-42z" fill="#5a2f17"/><rect x="11" y="56" width="38" height="4" rx="2" fill="#d6a640"/></svg>';
    var CANE='<svg viewBox="0 0 30 100"><path d="M8 98 V30 C8 8 28 8 28 28" fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round"/><path d="M8 98 V30 C8 8 28 8 28 28" fill="none" stroke="#d9242c" stroke-width="7.5" stroke-linecap="round" stroke-dasharray="6 7.5"/></svg>';
    var TREE=(function(){ var s='<svg viewBox="0 0 100 196"><defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#0c3a21"/><stop offset=".55" stop-color="#1f6d3d"/><stop offset="1" stop-color="#0b3320"/></linearGradient><radialGradient id="sg"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient></defs>'
        +'<ellipse cx="50" cy="190" rx="44" ry="5" fill="#000" opacity=".4"/><rect x="43" y="160" width="14" height="26" fill="#4a2a14"/>'
        +'<polygon points="50,86 97,166 3,166" fill="url(#tg)"/><polygon points="50,50 89,120 11,120" fill="url(#tg)"/><polygon points="50,20 78,76 22,76" fill="url(#tg)"/>'
        +'<path d="M14 150 Q32 160 50 150 T88 150 M20 112 Q38 122 50 112 T80 112 M30 68 Q42 76 50 68 T70 68" fill="none" stroke="#f6e7b8" stroke-width="1.6" stroke-dasharray="2 3" opacity=".8"/>';
      var L=[[40,32],[58,40],[34,64],[52,70],[66,62],[26,100],[44,106],[62,98],[78,108],[20,136],[38,146],[56,140],[72,148],[88,144],[30,160],[64,162]], cs=['#ff4b4b','#ffd24a','#58b6ff','#ff8ad0','#4be08a'];
      L.forEach(function(p,i){ var c=cs[i%5]; s+='<circle class="bulb" cx="'+p[0]+'" cy="'+p[1]+'" r="2.6" fill="'+c+'" style="filter:drop-shadow(0 0 3px '+c+');animation-delay:'+(-(i*.31)%1.6).toFixed(2)+'s"/>'; });
      [[46,52,'#d9242c'],[30,84,'#e8b64a'],[68,88,'#d9242c'],[18,124,'#e8b64a'],[52,126,'#d9242c'],[84,128,'#e8b64a'],[40,158,'#d9242c'],[74,160,'#e8b64a']].forEach(function(o){ s+='<circle cx="'+o[0]+'" cy="'+o[1]+'" r="3.4" fill="'+o[2]+'"/><circle cx="'+(o[0]-1)+'" cy="'+(o[1]-1.2)+'" r="1" fill="#fff" opacity=".7"/>'; });
      s+='<circle cx="50" cy="16" r="16" fill="url(#sg)"/><polygon points="50,6 53,14 62,14 55,19 58,28 50,22 42,28 45,19 38,14 47,14" fill="#ffd95a"/>';
      s+='<rect x="6" y="172" width="26" height="18" fill="#c8242d"/><rect x="17" y="172" width="4" height="18" fill="#f1d27a"/><rect x="62" y="176" width="30" height="14" fill="#1f7a42"/><rect x="74" y="176" width="5" height="14" fill="#f1d27a"/>';
      return s+'</svg>'; })();
    // shelves (tops of the two bookcases), then the table, chandelier and the corner
    dec(CANDLE,15.2,38.6,1.7); dec(GLOBE,29.4,38.6,4.8); dec(CANE,22.4,38.7,2.4,'lean');
    dec(GLOBE,65.8,38.6,4.8); dec(CANDLE,73.4,38.6,1.7); dec(CANE,78.8,38.7,2.4,'lean r');
    dec(CANDLE,22.4,78.6,2.4); dec(CANDLE,75.8,78.6,2.4); dec(GLOBE,69.6,78.2,5.4);
    dec(CANE,38.6,31.2,2.6,'hang'); dec(CANE,45.6,32.4,2.6,'hang'); dec(CANE,53.4,31.6,2.6,'hang flip');
    dec(TREE,83.4,87.5,17.5);
    // a thin string of lights along each bookcase
    var cs2=['#ff4b4b','#ffd24a','#4be08a','#58b6ff','#ff8ad0'], svg='<svg class="lights" viewBox="0 0 100 133.33" preserveAspectRatio="none">';
    [[13.4,32.6],[62.4,81.4]].forEach(function(r){ for(var i=0;i<9;i++){ var x=r[0]+(r[1]-r[0])*i/8, c=cs2[i%5]; svg+='<circle class="bulb" cx="'+x+'" cy="'+(38.2*1.3333)+'" r=".55" fill="'+c+'" style="filter:drop-shadow(0 0 1px '+c+');animation-delay:'+(-(i*.23)%1.5).toFixed(2)+'s"/>'; } });
    host.innerHTML=out+svg+'</svg>';
  }
})();
