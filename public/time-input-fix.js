(()=>{
  'use strict';

  const TIME_FIELDS=new Set(['in1','out1','in2','out2']);

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

      // Nu trimite încă valoarea aplicației și nu redesena formularul.
      // Tastatura rămâne deschisă chiar și după toate cele 4 cifre.
    };

    input.onblur=function(){
      const value=input.value.trim();
      if(!value){
        if(typeof appHandler==='function')appHandler.call(input,{target:input});
        return;
      }

      if(!isValidTime(value)){
        alert('Scrie ora în format HH:MM, de exemplu 08:30.');
        setTimeout(()=>input.focus(),0);
        return;
      }

      // Valoarea este transmisă aplicației numai când utilizatorul închide
      // singur tastatura cu „Gata” sau atinge în afara câmpului.
      if(typeof appHandler==='function')appHandler.call(input,{target:input});
    };
  }

  function apply(){
    document.querySelectorAll('input[data-field]').forEach(decorate);
  }

  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);
  else apply();
})();