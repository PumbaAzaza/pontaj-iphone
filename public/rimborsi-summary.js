(()=>{
  'use strict';

  const STORAGE_KEY='pontaj-iphone-v2';
  let scheduled=false;

  function number(value){
    const result=Number(String(value??'').replace(',','.'));
    return Number.isFinite(result)?result:0;
  }

  function euro(value,language){
    return new Intl.NumberFormat(language==='it'?'it-IT':'ro-RO',{
      style:'currency',
      currency:'EUR'
    }).format(value);
  }

  function monthlyEntries(prefix){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return Object.values(saved.entries||{}).filter(entry=>String(entry?.date||'').startsWith(prefix));
    }catch(_){
      return [];
    }
  }

  function apply(){
    scheduled=false;

    const monthBlock=document.querySelector('.month');
    const monthCard=monthBlock?.closest('.card');
    const refundCard=monthCard?.querySelector('.stats .stat:nth-child(3)');
    const firstDay=document.querySelector('.grid .day[data-day]');
    if(!refundCard||!firstDay)return;

    const prefix=firstDay.dataset.day.slice(0,7);
    const entries=monthlyEntries(prefix);
    const travelTotal=entries.reduce((sum,entry)=>sum+number(entry.reimbursement),0);
    const mealsTotal=entries.reduce((sum,entry)=>sum+number(entry.lunch)+number(entry.dinner),0);
    const language=document.documentElement.lang==='it'?'it':'ro';
    const travelLabel=language==='it'?'RIMBORSO VIAGGIO':'RAMBURS CĂLĂTORIE';
    const mealsLabel=language==='it'?'PRANZO + CENA':'PRÂNZ + CINĂ';
    const signature=[prefix,language,travelTotal.toFixed(2),mealsTotal.toFixed(2)].join('|');
    if(refundCard.dataset.refundSignature===signature)return;

    refundCard.dataset.refundSignature=signature;
    refundCard.classList.add('refundsSplit');
    refundCard.innerHTML=`
      <div class="refundLine">
        <strong>${euro(travelTotal,language)}</strong>
        <span>${travelLabel}</span>
      </div>
      <div class="refundDivider"></div>
      <div class="refundLine">
        <strong>${euro(mealsTotal,language)}</strong>
        <span>${mealsLabel}</span>
      </div>`;
  }

  function scheduleApply(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(apply);
  }

  const style=document.createElement('style');
  style.textContent=`
    .stat.refundsSplit{padding:8px 5px;display:flex;flex-direction:column;justify-content:center;gap:5px}
    .refundLine strong{font-size:14px;line-height:1.1;white-space:nowrap}
    .refundLine span{display:block;font-size:8px;line-height:1.15;margin-top:3px}
    .refundDivider{border-top:1px solid #e1e6ea}
    @media(max-width:360px){.refundLine strong{font-size:12px}.refundLine span{font-size:7px}}
  `;
  document.head.appendChild(style);

  new MutationObserver(scheduleApply).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('storage',scheduleApply);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleApply);
  else scheduleApply();
})();