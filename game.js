(() => {
  const $ = (id) => document.getElementById(id);
  const canvas = $('scene'), ctx = canvas.getContext('2d');
  const state = { phase: 'setup', side: 'bat', innings: 1, runs: 0, wickets: 0, balls: 0, target: null, batterIdx: 0, batters: [{name:'J. MORGAN',runs:0,balls:0},{name:'A. KHAN',runs:0,balls:0}], bowler:{name:'R. CHANDRA',runs:0,wickets:0}, overLog:[], shot:'ground', aim:'straight', line:'stumps', length:'good', delivery:null, pending:null, sound:true, matchStart:0 };
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const random=(a,b)=>a+Math.random()*(b-a);
  let W=800,H=250,dpr=1, toastTimer;
  function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
  new ResizeObserver(resize).observe(canvas); resize();
  const overlay=(show)=>$('scene-message').classList.toggle('hide',!show);
  function notify(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1800)}
  function setText(id,value){$(id).textContent=value}
  function getOvers(balls){return `${Math.floor(balls/6)}.${balls%6}`}
  function update(){
    const battingName=state.innings===1?(state.side==='bat'?'ROYALS':'CITY XI'):(state.side==='bat'?'CITY XI':'ROYALS');
    setText('batting-team',battingName);
    setText('innings-label',state.innings===1?'1ST INNINGS':'2ND INNINGS');setText('runs',state.runs);setText('wickets',state.wickets);setText('overs',getOvers(state.balls));
    setText('run-rate',`RR ${state.balls?(state.runs/(state.balls/6)).toFixed(2):'0.00'}`);
    setText('target',state.target===null?'—':state.target);setText('target-label',state.target===null?'TARGET':'TO WIN');
    const need=state.target===null?'10 OVERS':`${Math.max(0,state.target-state.runs)} OFF ${Math.max(0,60-state.balls)} BALLS`;
    setText('need-rate',need);setText('batter-one',state.batters[0].name);setText('batter-two',state.batters[1].name);
    setText('batter-one-status',state.batterIdx===0?'STRIKER':'NON-STRIKER');setText('batter-two-status',state.batterIdx===1?'STRIKER':'NON-STRIKER');
    setText('batter-one-score',`${state.batters[0].runs}(${state.batters[0].balls})`);setText('batter-two-score',`${state.batters[1].runs}(${state.batters[1].balls})`);
    setText('bowler-overs',getOvers(state.balls));setText('bowler-runs',state.bowler.runs);setText('bowler-wickets',state.bowler.wickets);
    $('ball-track').innerHTML='';const inOver=state.balls%6;
    for(let i=0;i<6;i++){const c=document.createElement('span');c.className='ball-chip';if(i<inOver){const o=state.overLog[state.overLog.length-inOver+i];c.textContent=o?.label??'·';c.classList.add(o?.type??'run')}else if(i===inOver&&state.balls<60)c.classList.add('current');$('ball-track').appendChild(c)}
    const chasing=state.innings===2&&state.target!==null;setText('tip-text',chasing?`Need ${Math.max(0,state.target-state.runs)} from ${Math.max(0,60-state.balls)} balls. Pick your moments.`:'Lofted shots can clear the rope—but mistime one and you could be walking.');
  }
  function showPhaseControls(){
    ['setup-controls','bat-controls','bowl-controls','between-controls','result-controls'].forEach(id=>$(id).classList.add('hidden'));
    if(state.phase==='setup')$('setup-controls').classList.remove('hidden');
    if(state.phase==='batting')$('bat-controls').classList.remove('hidden');
    if(state.phase==='bowling')$('bowl-controls').classList.remove('hidden');
    if(state.phase==='break')$('between-controls').classList.remove('hidden');
    if(state.phase==='complete')$('result-controls').classList.remove('hidden');
    if(state.phase==='batting'){setText('control-eyebrow','YOU ARE BATTING');setText('control-title','Read it. Time it. Send it.');setText('control-hint','SPACE / TAP TO SWING')}
    else if(state.phase==='bowling'){setText('control-eyebrow','YOU ARE BOWLING');setText('control-title','Set the field. Beat the bat.');setText('control-hint','SPACE / TAP TO BOWL')}
    else if(state.phase==='setup'){setText('control-eyebrow','CHOOSE YOUR SIDE');setText('control-title','How do you want to play?');setText('control-hint','10 overs · 2 innings')}
    else if(state.phase==='break'){setText('control-eyebrow','INNINGS BREAK');setText('control-title','The chase is on.');setText('control-hint','TARGET SET')}
    else {setText('control-eyebrow','FULL TIME');setText('control-title','That’s the game.');setText('control-hint','CITY LEAGUE · FINAL')}
  }
  document.querySelectorAll('.side-card[data-side]').forEach(b=>b.onclick=()=>{state.side=b.dataset.side;document.querySelectorAll('.side-card').forEach(x=>x.classList.toggle('selected',x===b))});
  function bindChoices(parent,key){document.querySelectorAll(`#${parent} [data-${key}]`).forEach(b=>b.onclick=()=>{state[key]=b.dataset[key];document.querySelectorAll(`#${parent} [data-${key}]`).forEach(x=>x.classList.toggle('active',x===b))})}
  bindChoices('shot-options','shot');bindChoices('aim-options','aim');bindChoices('line-options','line');bindChoices('length-options','length');
  $('start-match').onclick=()=>{state.innings=1;state.runs=0;state.wickets=0;state.balls=0;state.target=null;state.batterIdx=0;state.batters=[{name:'J. MORGAN',runs:0,balls:0},{name:'A. KHAN',runs:0,balls:0}];state.bowler={name:'R. CHANDRA',runs:0,wickets:0};state.overLog=[];state.phase=state.side==='bat'?'batting':'bowling';state.matchStart=Date.now();$('match-status').textContent='LIVE MATCH';overlay(true);setText('commentary',state.side==='bat'?'You’re opening the innings. Find your rhythm.':'The Royals are at the crease. Set your first trap.');showPhaseControls();update();$('home-badge').textContent=state.side==='bat'?'R':'C';};
  $('continue-match').onclick=()=>{state.innings=2;state.runs=0;state.wickets=0;state.balls=0;state.batterIdx=0;state.batters=[{name:'S. PATEL',runs:0,balls:0},{name:'D. REED',runs:0,balls:0}];state.bowler={name:'R. CHANDRA',runs:0,wickets:0};state.overLog=[];state.phase=state.side==='bat'?'bowling':'batting';setText('commentary',state.phase==='batting'?'The target is set. Time to chase.':'Defend your total. Make every ball count.');overlay(true);showPhaseControls();update()};
  $('new-match').onclick=()=>{state.phase='setup';state.innings=1;state.runs=0;state.wickets=0;state.balls=0;state.target=null;state.batters=[{name:'J. MORGAN',runs:0,balls:0},{name:'A. KHAN',runs:0,balls:0}];state.bowler={name:'R. CHANDRA',runs:0,wickets:0};state.overLog=[];setText('match-status','MATCH DAY');setText('commentary','The crowd is settling in. Time to make some noise.');overlay(true);showPhaseControls();update()};
  function startBatBall(){if(state.phase!=='batting')return;if(state.delivery)return;state.delivery={start:performance.now(),swung:false,kind:'bat'};overlay(false);$('play-ball').innerHTML='SWING NOW <span>SPACE ↗</span>';setText('commentary','Watch it closely…');$('play-ball').classList.add('ready-swing')}
  function swing(){if(state.phase!=='batting')return;if(!state.delivery){startBatBall();return}if(state.delivery.swung)return;state.delivery.swung=true;const elapsed=performance.now()-state.delivery.start;const timing=clamp(1-Math.abs(elapsed-1320)/1150,0,1);const timingName=timing>.78?'PERFECT TIMING':timing>.48?'GOOD TIMING':'LATE / EARLY';const shot=state.shot;let outcomes;
    if(shot==='defend') outcomes=[['dot',.55],['1',.33],['2',.08],['W',.04]];
    else if(shot==='loft') outcomes=[['0',.10],['1',.13],['2',.13],['3',.05],['4',.16],['6',.18],['W',.25]];
    else outcomes=[['0',.18],['1',.34],['2',.17],['3',.04],['4',.18],['6',.03],['W',.06]];
    let roll=Math.random();let selected=outcomes.find(x=>(roll-=x[1])<=0)?.[0]||'1';
    if(timing>.8){if(shot==='loft'&&Math.random()<.54)selected='6';else if(shot==='ground'&&Math.random()<.4)selected='4';else if(selected==='W')selected='2'}
    if(timing<.23&&shot==='loft'&&Math.random()<.45)selected='W';
    state.delivery.result={selected,timing,timingName,aim:state.aim};$('play-ball').classList.remove('ready-swing');$('play-ball').innerHTML='BALL IN PLAY <span>…</span>';setText('commentary',`${timingName.toLowerCase()} — ${state.aim} side!`);
  }
  function startBowl(){if(state.phase!=='bowling'||state.delivery)return;state.delivery={start:performance.now(),swung:false,kind:'bowl'};overlay(false);$('bowl-ball').disabled=true;$('bowl-ball').innerHTML='DELIVERING <span>…</span>';setText('commentary',`${state.length.toUpperCase()} length, ${state.line==='wide'?'outside off':state.line==='leg'?'on leg stump':'at the stumps'}…`)}
  $('play-ball').onclick=()=>state.delivery?swing():startBatBall();$('bowl-ball').onclick=startBowl;
  window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat){e.preventDefault();if(state.phase==='batting')swing();else if(state.phase==='bowling')startBowl()}});
  function finishBall(result){state.delivery=null;const out=result==='W';let runs=out?0:(result==='dot'?0:Number(result));const batter=state.batters[state.batterIdx];batter.balls++;state.balls++;state.runs+=runs;state.bowler.runs+=runs;if(out){state.wickets++;state.bowler.wickets++;const names=['L. WATTS','T. GREEN','M. DAS','P. SHAH','K. LEE','R. FOX','N. ALI','B. JONES'];if(state.wickets<10){state.batterIdx=0;state.batters=[state.batters[1],{name:names[(state.wickets-1)%names.length],runs:0,balls:0}]} }
    else {batter.runs+=runs;if(runs%2===1)state.batterIdx=1-state.batterIdx}
    const type=out?'wicket':runs>=4?'boundary':runs?'run':'run';state.overLog.push({label:out?'W':runs,type});
    const isHumanBat=state.phase==='batting';if(!isHumanBat){if(out){setText('commentary','BOWLED HIM! The batter is gone.');}else setText('commentary',runs===0?'A dot ball. Pressure building.':runs>=4?`${runs===6?'SIX!':'FOUR!'} The batter finds the boundary.`:`${runs} run${runs>1?'s':''}. Good running.`)}else if(out)setText('commentary','OUT! The bowler has your number. Next batter in.');else if(runs===0)setText('commentary','Dot ball. Reset and go again.');else setText('commentary',runs>=4?`${runs===6?'SIX!':'FOUR!'} What a hit!`:`${runs} run${runs>1?'s':''}. Keep it ticking.`);
    update();showBallResult(out?'OUT!':runs===0?'DOT BALL':runs===6?'SIX!':runs===4?'FOUR!':`+${runs}`,out?'wicket':runs>=4?'boundary':'run');
    const chaseWon=state.innings===2&&state.runs>=state.target;const inningsDone=state.balls>=60||state.wickets>=10||chaseWon;
    $('play-ball').innerHTML='FACE THE BALL <span>SPACE ↗</span>';$('bowl-ball').disabled=false;$('bowl-ball').innerHTML='BOWL NEXT <span>SPACE ↗</span>';
    if(inningsDone){setTimeout(()=>endInnings(chaseWon),700)}
  }
  function showBallResult(text,type){const c=$('ball-callout');c.textContent=text;c.className=`ball-callout show ${type}`;setTimeout(()=>c.className='ball-callout',1300)}
  function endInnings(chaseWon){if(state.innings===1){state.target=state.runs+1;state.phase='break';setText('between-copy',`${state.side==='bat'?'Royals':'City XI'} set ${state.target} to win. Your chase starts now.`);setText('commentary',`INNINGS COMPLETE — target ${state.target}.`);overlay(true)}else{state.phase='complete';$('match-status').textContent='MATCH COMPLETE';const humanInnings=state.side==='bat'?state.innings===1:false;const humanWon=state.side==='bat'?state.runs>=state.target:chaseWon?false:state.runs<state.target;const tied=state.runs===state.target-1;const result=tied?'IT’S A TIE!':humanWon?'YOU WIN!':'MATCH LOST';setText('result-copy',`${result} ${humanWon?'What a performance.':tied?'Honours even after a superb contest.':'There’s always the next one.'} Final score: ${state.runs}/${state.wickets}.`);setText('commentary',result);overlay(true)}showPhaseControls();update()}
  function resolveBowl(){const line=state.line,length=state.length;let wicket=.13;if(line==='stumps')wicket+=.1;if(length==='good')wicket+=.08;if(line==='wide')wicket-=.04;if(length==='short')wicket-=.05;let runs=0;const r=Math.random();if(r<wicket)runs='W';else if(line==='wide'&&Math.random()<.24)runs=4;else if(length==='short'&&Math.random()<.28)runs=4;else if(length==='full'&&Math.random()<.2)runs=0;else if(r<.48)runs=0;else if(r<.76)runs=1;else if(r<.88)runs=2;else if(r<.96)runs=4;else runs=6;finishBall(runs)}
  function resolveBat(delivery){const r=delivery.result;let value=r?.selected??'0';if(value==='dot')value='0';finishBall(value)}
  function updateAnimation(now){if(state.delivery){const d=state.delivery;const t=clamp((now-d.start)/(d.kind==='bat'?1900:1300),0,1);if(d.kind==='bat'&&d.swung&&!d.resolved){d.resolved=true;setTimeout(()=>resolveBat(d),260)}if(d.kind==='bat'&&!d.swung&&t>=1){d.resolved=true;d.result={selected:'0',timing:0,timingName:'BEATEN',aim:state.aim};setText('commentary','Beaten! No run.');setTimeout(()=>resolveBat(d),200)}if(d.kind==='bowl'&&t>=1&&!d.resolved){d.resolved=true;setTimeout(resolveBowl,220)}}draw(now);requestAnimationFrame(updateAnimation)}
  function draw(now){if(!W||!H)return;ctx.clearRect(0,0,W,H);const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#91b97c');sky.addColorStop(.48,'#62915d');sky.addColorStop(1,'#2f623e');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    const horizon=H*.24;ctx.fillStyle='#243f34';ctx.fillRect(0,horizon,W,H*.16);for(let i=0;i<150;i++){const x=(i*67%W),y=horizon+((i*37)% (H*.14));ctx.fillStyle=['#b5c29a','#d2b37c','#8ca886','#d8ddd0'][i%4];ctx.globalAlpha=.35+((i*13)%6)*.08;ctx.beginPath();ctx.arc(x,y,1+(i%3)*.35,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
    ctx.fillStyle='#bdd49b';ctx.fillRect(0,horizon-4,W,4);ctx.fillStyle='#31573a';ctx.fillRect(0,horizon+H*.16,W,H*.04);
    const cx=W*.5,cy=H*.59,rx=W*.4,ry=H*.35;ctx.fillStyle='#3f7847';ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a5c780';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(cx,cy,rx*.83,ry*.80,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#9bad72';ctx.beginPath();ctx.ellipse(cx,cy+ry*.02,rx*.31,ry*.33,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c2b486';ctx.beginPath();ctx.ellipse(cx,cy+ry*.02,rx*.26,ry*.29,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e2d5a4';ctx.fillRect(cx-2,cy-ry*.25,4,ry*.5);
    // creases and stumps
    ctx.strokeStyle='#fff4cb';ctx.lineWidth=1;for(const yy of [cy-ry*.19,cy+ry*.19]){ctx.beginPath();ctx.moveTo(cx-13,yy);ctx.lineTo(cx+13,yy);ctx.stroke();ctx.fillStyle='#e8e4c8';for(let j=-1;j<=1;j++)ctx.fillRect(cx+j*3,yy-(yy<cy?5:0),1.2,5)}
    // fielders around the ring
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2-.25;const x=cx+Math.cos(a)*rx*.72,y=cy+Math.sin(a)*ry*.72;drawPlayer(x,y,.72,i%3===0?'#eadcc0':'#d7e5cd',false)}
    drawPlayer(cx,cy+ry*.22,.86,'#e3d8bd',true);drawPlayer(cx,cy-ry*.22,.75,'#dbe5d0',false);
    const delivery=state.delivery;if(delivery){const t=clamp((now-delivery.start)/(delivery.kind==='bat'?1900:1300),0,1);let x,y;if(delivery.kind==='bat'){x=cx+(t<.8?0:(t-.8)*W*.08);y=cy+ry*.15-t*ry*.33}else{x=cx+(t-.5)*8;y=cy-ry*.17+t*ry*.30}ctx.fillStyle='#e9483d';ctx.shadowColor='#ffcf79';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(x,y,4.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;if(delivery.kind==='bat'&&delivery.swung){ctx.strokeStyle='#f0edc3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-15,y+9);ctx.lineTo(x+20,y-12);ctx.stroke()}}
    // subtle score line boundary markers
    ctx.fillStyle='#d9e7bc';ctx.globalAlpha=.55;for(let i=0;i<16;i++){const a=i/16*Math.PI*2;ctx.beginPath();ctx.arc(cx+Math.cos(a)*rx*.98,cy+Math.sin(a)*ry*.98,1.1,0,7);ctx.fill()}ctx.globalAlpha=1;
  }
  function drawPlayer(x,y,s,color,batter){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#18382755';ctx.beginPath();ctx.ellipse(0,8,7,3,0,0,7);ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,3.8,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2.3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(0,10);ctx.moveTo(0,5);ctx.lineTo(-4,8);ctx.moveTo(0,5);ctx.lineTo(4,8);ctx.moveTo(0,10);ctx.lineTo(-3,14);ctx.moveTo(0,10);ctx.lineTo(3,14);ctx.stroke();if(batter){ctx.strokeStyle='#e7d8ad';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(4,6);ctx.lineTo(8,-5);ctx.stroke()}ctx.restore()}
  $('sound-toggle').onclick=()=>{state.sound=!state.sound;$('sound-toggle').style.opacity=state.sound?'1':'.45';notify(state.sound?'Sound on':'Sound off')};
  showPhaseControls();update();requestAnimationFrame(updateAnimation);
})();
