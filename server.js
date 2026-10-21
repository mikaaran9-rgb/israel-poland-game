const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const questions = [
 ['🏖️','Beach','🏊','Pool'],
 ['☀️','Summer','❄️','Winter'],
 ['🍕','Pizza','🍔','Burger'],
 ['🐶','Dogs','🐱','Cats'],
 ['🌅','Early bird','🌙','Night owl'],
 ['🎬','Movies','📺','TV series'],
 ['🏙️','Big city','🌳','Countryside'],
 ['✈️','Travel abroad','🏡','Staycation'],
 ['🍫','Chocolate','🍦','Ice cream'],
 ['🎵','Music','🎮','Video games'],
 ['📱','Texting','📞','Calling'],
 ['⛰️','Mountains','🌊','Sea'],
 ['📚','Books','🎥','Films'],
 ['☕','Coffee','🫖','Tea'],
 ['🎉','Big party','🛋️','Cozy evening']
];
const rooms = new Map();
const makeCode = () => {let c; do { c = String(Math.floor(100000+Math.random()*900000)); } while(rooms.has(c)); return c;};
const send = (ws, obj) => { if(ws.readyState===1) ws.send(JSON.stringify(obj)); };
const counts = room => {
 const tally = { Israel:[0,0], Poland:[0,0] };
 for (const p of room.players.values()) if(p.vote!==null) tally[p.country][p.vote]++;
 return tally;
};
const state = room => ({type:'state',code:room.code,phase:room.phase,index:room.index,total:questions.length,question:questions[room.index],counts:counts(room),participants:{Israel:[...room.players.values()].filter(x=>x.country==='Israel').length,Poland:[...room.players.values()].filter(x=>x.country==='Poland').length},voted:[...room.players.values()].filter(x=>x.vote!==null).length});
const broadcast = room => {const s=state(room);send(room.host,s);for(const p of room.players.values()) send(p.ws,{...s,myVote:p.vote,country:p.country});};
const server=http.createServer((req,res)=>{
 let url;try {url=new URL(req.url,'http://localhost');}catch{return res.writeHead(400).end();}
 let file= url.pathname==='/'?'/index.html':url.pathname;
 const target=path.resolve(PUBLIC,'.'+file);
 if(!target.startsWith(PUBLIC+path.sep) && target!==path.join(PUBLIC,'index.html'))return res.writeHead(403).end();
 fs.readFile(target,(err,data)=>{if(err)return res.writeHead(404).end('Not found');res.writeHead(200,{'Content-Type':target.endsWith('.html')?'text/html; charset=utf-8':target.endsWith('.js')?'text/javascript; charset=utf-8':target.endsWith('.css')?'text/css; charset=utf-8':'application/octet-stream','Cache-Control':'no-store'});res.end(data);});
});
const wss = new WebSocketServer({server});
wss.on('connection',ws=>{
 ws.identity=null;
 ws.on('message',raw=>{
 let m;try{m=JSON.parse(raw);}catch{return;}
 if(m.type==='create'){
   if(ws.identity) return;
   const code=makeCode(); const room={code,host:ws,players:new Map(),phase:'lobby',index:0};rooms.set(code,room);ws.identity={role:'host',code};send(ws,{type:'created',code});broadcast(room);return;
 }
 if(m.type==='join'){
   if(ws.identity) return;
   const code=String(m.code||'').trim();const room=rooms.get(code);
   if(!room)return send(ws,{type:'error',message:'Room not found. Check the code.'});
   if(room.phase==='finished')return send(ws,{type:'error',message:'This game has ended.'});
   if(!['Israel','Poland'].includes(m.country))return send(ws,{type:'error',message:'Choose your country.'});
   const id=crypto.randomUUID();room.players.set(id,{id,ws,country:m.country,vote:null});ws.identity={role:'player',code,id};send(ws,{type:'joined',code,country:m.country});broadcast(room);return;
 }
 const who=ws.identity;if(!who)return;
 const room=rooms.get(who.code);if(!room)return;
 if(who.role==='host'){
   if(m.type==='start' && room.phase==='lobby')room.phase='voting';
   else if(m.type==='reveal' && room.phase==='voting')room.phase='results';
   else if(m.type==='next' && room.phase==='results'){if(room.index+1<questions.length){room.index++;room.phase='voting';for(const p of room.players.values())p.vote=null;}else room.phase='finished';}
   else if(m.type==='restart'){room.index=0;room.phase='lobby';for(const p of room.players.values())p.vote=null;}
   else return;
 }else if(m.type==='vote' && room.phase==='voting'){
   const p=room.players.get(who.id);if(!p || ![0,1].includes(m.option))return;p.vote=m.option;
 }else return;
 broadcast(room);
 });
 ws.on('close',()=>{
  const who=ws.identity;if(!who)return;const room=rooms.get(who.code);if(!room)return;
  if(who.role==='host'){for(const p of room.players.values())send(p.ws,{type:'error',message:'The host has disconnected. The room is closed.'});rooms.delete(who.code);}else{room.players.delete(who.id);broadcast(room);}
 });
});
server.listen(PORT,()=>console.log('Game running on http://localhost:'+PORT));
