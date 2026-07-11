(()=>{
  'use strict';

  const TIME_FIELDS=new Set(['in1','out1','in2','out2']);

  function isTimeInput(element){
    return element instanceof HTMLInputElement && TIME_FIELDS.has(element.dataset.field);
  }

  function formatPartial(value){
    const digits=String(value||'').replace(/\D/g,'').slice(0,4);
    return digits.length>2?`${digits.slice(0,2)}:${digits.slice(2)}`:digits;
  }

  function isValidTime(value){
    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  function keepKeyboardOpen(event){
    const active=document.activeElement;
    if(!isTimeInput(active)||active.dataset.manualTime!=='1')return;

    const target=event.target;
    if(target===active)return;

    // Permite trecerea directă la un alt câmp de oră; tastatura rămâne deschisă.
    if(isTimeInput(target))return;

    // O atingere în pagină nu mai poate elimina focusul din câmp.
    // Tastatura se închide numai prin butonul „Gata” al iPhone-ului.
    event.preventDefault();
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
      input.value=formatPartial(input.value);
      // Formularul nu este redesenat cât timp utilizatorul scrie.
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

      // Blur-ul rămas este produs de butonul „Gata”; abia acum transmitem valoarea.
      if(typeof appHandler==='function')appHandler.call(input,{target:input});
    };
  }

  function apply(){
    document.querySelectorAll('input[data-field]').forEach(decorate);
  }

  document.addEventListener('touchstart',keepKeyboardOpen,{capture:true,passive:false});
  document.addEventListener('mousedown',keepKeyboardOpen,true);
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);
  else apply();
})();