(()=>{
  'use strict';

  const TIME_FIELDS=new Set(['in1','out1','in2','out2']);
  let restoreField='';
  let restorePosition=0;

  function formatPartial(value){
    const digits=String(value||'').replace(/\D/g,'').slice(0,4);
    return digits.length>2?`${digits.slice(0,2)}:${digits.slice(2)}`:digits;
  }

  function isValidTime(value){
    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  function decorate(input){
    if(!TIME_FIELDS.has(input.dataset.field)||input.dataset.manualTime==='1')return;

    const appHandler=input.oninput;
    input.dataset.manualTime='1';
    input.type='text';
    input.inputMode='numeric';
    input.maxLength=5;
    input.placeholder='HH:MM';
    input.autocomplete='off';
    input.autocorrect='off';
    input.spellcheck=false;
    input.setAttribute('aria-label',`${input.previousElementSibling?.textContent||'Ora'} HH:MM`);

    input.oninput=function(){
      const formatted=formatPartial(input.value);
      input.value=formatted;
      restoreField=input.dataset.field;
      restorePosition=formatted.length;
      if(typeof appHandler==='function')appHandler.call(input,{target:input});
    };

    input.onblur=function(){
      const value=input.value.trim();
      if(value && !isValidTime(value)){
        alert('Scrie ora în format HH:MM, de exemplu 08:30.');
        setTimeout(()=>input.focus(),0);
      }
    };
  }

  function apply(){
    document.querySelectorAll('input[data-field]').forEach(decorate);

    if(restoreField){
      const field=restoreField;
      const position=restorePosition;
      restoreField='';
      requestAnimationFrame(()=>{
        const input=document.querySelector(`input[data-field="${field}"]`);
        if(!input)return;
        input.focus();
        try{input.setSelectionRange(position,position)}catch(_){ }
      });
    }
  }

  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);
  else apply();
})();
