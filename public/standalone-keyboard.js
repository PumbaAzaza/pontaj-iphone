(()=>{'use strict';
const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
if(!standalone)return;
let active=null,upper=true,mode='letters';
const panel=document.createElement('div');panel.id='wh-keyboard';panel.hidden=true;
document.body.appendChild(panel);
const timeFields=new Set(['in1','out1','in2','out2','travelHours']);
function numeric(el){return el.type==='number'||el.type==='tel'||timeFields.has(el.dataset.field)}
function draw(){
 const it=document.documentElement.lang==='it';
 const rows=mode==='numbers'?['123','456','789',':0.,-']:['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
 panel.innerHTML='<div class="wh-kb-bar"><span>'+(active?.closest('label')?.querySelector('span')?.textContent||'WorkHours')+'</span><button type="button" data-kb="done">'+(it?'Fine':'Gata')+'</button></div>'+
 rows.map(r=>'<div class="wh-kb-row">'+[...r].map(c=>'<button type="button" data-kb="'+c+'">'+(upper?c:c.toLowerCase())+'</button>').join('')+'</div>').join('')+
 '<div class="wh-kb-row"><button type="button" data-kb="switch">'+(mode==='numbers'?'ABC':'123')+'</button><button type="button" class="wh-kb-space" data-kb="space">'+(it?'Spazio':'Spațiu')+'</button><button type="button" data-kb="case">⇧</button><button type="button" data-kb="back">⌫</button></div>';
}
function open(el){
 active=el;mode=numeric(el)?'numbers':'letters';upper=true;draw();panel.hidden=false;
 document.body.classList.add('wh-kb-open');
 requestAnimationFrame(()=>el.scrollIntoView({block:'center',behavior:'smooth'}));
}
function close(){panel.hidden=true;active=null;document.body.classList.remove('wh-kb-open')}
document.addEventListener('click',e=>{
 const el=e.target.closest('input:not([type=file]):not([type=checkbox]):not([type=radio]),textarea');
 if(el&&!panel.contains(el)){open(el);return}
 if(!panel.contains(e.target)&&!e.target.closest('label')&&active)close();
},true);
panel.addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.preventDefault()});
panel.addEventListener('click',e=>{
 const btn=e.target.closest('button[data-kb]');if(!btn||!active)return;
 const key=btn.dataset.kb;
 if(key==='done'){close();return}
 if(key==='switch'){mode=mode==='numbers'?'letters':'numbers';draw();return}
 if(key==='case'){upper=!upper;draw();return}
 let value=active.value||'';
 const start=typeof active.selectionStart==='number'?active.selectionStart:value.length;
 const end=typeof active.selectionEnd==='number'?active.selectionEnd:value.length;
 if(key==='back'){active.value=value.slice(0,Math.max(0,start-1))+value.slice(end)}
 else {
 const ch=key==='space'?' ':upper?key:key.toLowerCase();
 active.value=value.slice(0,start)+ch+value.slice(end);
 if(mode==='letters'&&upper){upper=false;draw()}
 }
 active.dispatchEvent(new Event('input',{bubbles:true}));
});
})();