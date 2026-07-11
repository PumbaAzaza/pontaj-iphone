"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type DayEntry = {
  date: string;
  in1: string;
  out1: string;
  in2: string;
  out2: string;
  travelHours: string;
  reimbursement: string;
  fair: string;
  stand: string;
  lunch: string;
  dinner: string;
  notes: string;
};

type Language = "ro" | "it";
type Settings = { employeeName: string; language: Language };
type AppTab = "calendar" | "report" | "settings";
type StoredData = { entries?: Record<string, DayEntry>; settings?: Partial<Settings> };

const STORAGE_KEY = "pontaj-iphone-v2";
const OLD_STORAGE_KEY = "pontaj-iphone-v1";
const EMPTY_ENTRY: DayEntry = { date: "", in1: "", out1: "", in2: "", out2: "", travelHours: "", reimbursement: "", fair: "", stand: "", lunch: "", dinner: "", notes: "" };
const LOCALES: Record<Language, string> = { ro: "ro-RO", it: "it-IT" };

const TRANSLATIONS = {
  ro: {
    appName: "Pontaj",
    subtitle: "Datele rămân salvate pe telefon",
    calendar: "Calendar",
    report: "Raport",
    settings: "Setări",
    selectedMonth: "Luna selectată",
    workedHours: "ORE LUCRATE",
    travelHoursStat: "ORE CĂLĂTORIE",
    reimbursements: "RAMBURSĂRI",
    calendarHelp: "Apasă pe o zi pentru a introduce datele.",
    today: "Astăzi",
    addToday: "Adaugă date pentru astăzi",
    reportTemplate: "PDF-ul este construit după modelul „REPORT MENSILE”.",
    work: "LUCRU",
    travel: "CĂLĂTORIE",
    total: "TOTAL",
    savePdf: "Salvează PDF",
    share: "Trimite / WhatsApp",
    noDays: "Nu există zile completate.",
    otherData: "Alte date",
    settingsTitle: "Setări",
    nameInPdf: "Numele apare în PDF.",
    employeeName: "Numele angajatului",
    employeePlaceholder: "Ex.: Borta Călin",
    language: "Limba aplicației",
    romanian: "Română",
    italian: "Italiano",
    saveBackup: "Salvează backup",
    restore: "Restaurare",
    storageNote: "Datele sunt păstrate în memoria browserului de pe telefon. Salvează periodic o copie de siguranță.",
    dailyEntry: "Introducere zilnică",
    entry1: "Intrare 1",
    exit1: "Ieșire 1",
    entry2: "Intrare 2",
    exit2: "Ieșire 2",
    totalWorkHours: "Total ore de lucru",
    workPlusTravel: "Lucru + călătorie",
    travelHours: "Ore călătorie",
    travelReimbursement: "Ramburs călătorie (€)",
    fair: "Fiera / târg",
    fairPlaceholder: "Numele târgului",
    standName: "Nume stand",
    standPlaceholder: "Numele standului sau traseul",
    lunch: "Prânz (€)",
    dinner: "Cină (€)",
    notes: "Observații",
    optional: "Opțional",
    delete: "Șterge",
    saveDay: "Salvează ziua",
    loading: "Se încarcă…",
    loadError: "Datele salvate nu au putut fi citite.",
    daySaved: "Ziua a fost salvată.",
    entryDeleted: "Înregistrarea a fost ștearsă.",
    pdfGenerated: "PDF-ul a fost generat.",
    pdfSaved: "PDF-ul a fost salvat. Îl poți atașa în WhatsApp.",
    dataRestored: "Datele au fost restaurate.",
    invalidBackup: "Fișierul nu este un backup valid.",
    monthlyReport: "Raport lunar",
    weekdays: ["L", "Ma", "Mi", "J", "V", "S", "D"],
  },
  it: {
    appName: "Presenze",
    subtitle: "I dati restano salvati sul telefono",
    calendar: "Calendario",
    report: "Rapporto",
    settings: "Impostazioni",
    selectedMonth: "Mese selezionato",
    workedHours: "ORE LAVORATE",
    travelHoursStat: "ORE DI VIAGGIO",
    reimbursements: "RIMBORSI",
    calendarHelp: "Tocca un giorno per inserire i dati.",
    today: "Oggi",
    addToday: "Aggiungi i dati di oggi",
    reportTemplate: "Il PDF viene creato secondo il modello “REPORT MENSILE”.",
    work: "LAVORO",
    travel: "VIAGGIO",
    total: "TOTALE",
    savePdf: "Salva PDF",
    share: "Invia / WhatsApp",
    noDays: "Non ci sono giorni compilati.",
    otherData: "Altri dati",
    settingsTitle: "Impostazioni",
    nameInPdf: "Il nome appare nel PDF.",
    employeeName: "Nome del dipendente",
    employeePlaceholder: "Es.: Borta Călin",
    language: "Lingua dell’app",
    romanian: "Română",
    italian: "Italiano",
    saveBackup: "Salva backup",
    restore: "Ripristina",
    storageNote: "I dati sono conservati nella memoria del browser del telefono. Salva periodicamente una copia di sicurezza.",
    dailyEntry: "Inserimento giornaliero",
    entry1: "Entrata 1",
    exit1: "Uscita 1",
    entry2: "Entrata 2",
    exit2: "Uscita 2",
    totalWorkHours: "Totale ore di lavoro",
    workPlusTravel: "Lavoro + viaggio",
    travelHours: "Ore di viaggio",
    travelReimbursement: "Rimborso viaggio (€)",
    fair: "Fiera",
    fairPlaceholder: "Nome della fiera",
    standName: "Nome stand",
    standPlaceholder: "Nome dello stand o percorso",
    lunch: "Pranzo (€)",
    dinner: "Cena (€)",
    notes: "Note",
    optional: "Facoltativo",
    delete: "Elimina",
    saveDay: "Salva giornata",
    loading: "Caricamento…",
    loadError: "Non è stato possibile leggere i dati salvati.",
    daySaved: "La giornata è stata salvata.",
    entryDeleted: "La registrazione è stata eliminata.",
    pdfGenerated: "Il PDF è stato generato.",
    pdfSaved: "Il PDF è stato salvato. Puoi allegarlo in WhatsApp.",
    dataRestored: "I dati sono stati ripristinati.",
    invalidBackup: "Il file non è un backup valido.",
    monthlyReport: "Rapporto mensile",
    weekdays: ["L", "Ma", "Me", "G", "V", "S", "D"],
  },
} as const;

const pad = (value: number) => String(value).padStart(2, "0");
const localMonthKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
const dateKey = (year: number, monthIndex: number, day: number) => `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
function monthDate(key: string) { const [year, month] = key.split("-").map(Number); return new Date(year, month - 1, 1); }
function moveMonth(key: string, offset: number) { const date = monthDate(key); date.setMonth(date.getMonth() + offset); return localMonthKey(date); }
function timeMinutes(value: string) { if (!value) return null; const [h, m] = value.split(":").map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null; }
function intervalMinutes(start: string, end: string) { const a = timeMinutes(start), b = timeMinutes(end); if (a === null || b === null) return 0; return b >= a ? b - a : 1440 - a + b; }
function decimalNumber(value: string | number | undefined) { if (typeof value === "number") return Number.isFinite(value) ? value : 0; const parsed = Number(String(value || "").replace(",", ".")); return Number.isFinite(parsed) ? parsed : 0; }
const workMinutes = (entry: DayEntry) => intervalMinutes(entry.in1, entry.out1) + intervalMinutes(entry.in2, entry.out2);
const travelMinutes = (entry: DayEntry) => Math.round(decimalNumber(entry.travelHours) * 60);
const totalMinutes = (entry: DayEntry) => workMinutes(entry) + travelMinutes(entry);
function durationLabel(minutes: number) { const safe = Math.max(0, Math.round(minutes)); return `${Math.floor(safe / 60)}:${pad(safe % 60)}`; }
function moneyLabel(value: string | number, locale: string) { return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(decimalNumber(value)); }
function normalizePdfText(value: string) { return value.replace(/[șş]/gi, m => m === m.toUpperCase() ? "S" : "s").replace(/[țţ]/gi, m => m === m.toUpperCase() ? "T" : "t").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "?"); }
function pdfEscape(value: string) { return normalizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }

function createReportPdf(viewMonth: string, employeeName: string, entries: Record<string, DayEntry>) {
  const view = monthDate(viewMonth), year = view.getFullYear(), monthIndex = view.getMonth(), days = new Date(year, monthIndex + 1, 0).getDate();
  const W = 595.28, H = 841.89, commands: string[] = [];
  const text = (x: number, y: number, value: string, size = 6, bold = false, align: "left" | "center" | "right" = "left", max = 0) => {
    let safe = normalizePdfText(value); if (max && safe.length > max) safe = `${safe.slice(0, Math.max(1, max - 1))}~`;
    const approx = safe.length * size * .48; let drawX = x; if (align === "center") drawX -= approx / 2; if (align === "right") drawX -= approx;
    commands.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${drawX.toFixed(2)} ${y.toFixed(2)} Td (${pdfEscape(safe)}) Tj ET`);
  };
  const line = (x1: number, y1: number, x2: number, y2: number, width = .35) => commands.push(`${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  text(55, 783, "REPORT MENSILE", 8, true); text(55, 748, "NOME", 6, true); text(90, 748, employeeName || "", 6); line(88, 744, 205, 744, .4);
  text(55, 724, "MESE", 6, true); text(90, 724, new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(view), 6); line(88, 720, 205, 720, .4);
  const x0 = 38, top = 674, headerH = 34, rowH = 13, totalH = 15, widths = [40,30,30,30,30,42,42,44,48,44,68,32,32], xs = [x0]; widths.forEach(w => xs.push(xs[xs.length - 1] + w));
  const bottom = top - headerH - days * rowH - totalH; for (const x of xs) line(x, top, x, bottom); line(x0, top, xs[xs.length - 1], top); line(x0, top - headerH, xs[xs.length - 1], top - headerH);
  const headerLines = [["DATA"],["ENTRATA"],["USCITA"],["ENTRATA"],["USCITA"],["TOTALE ORE","DI LAVORO"],["ORE","VIAGGIO"],["RIMBORS","VIAGGIO"],["TOTALE ORE","LAVORO PIU","VIAGGI"],["FIERA"],["NOME STAND"],["Pranzo"],["Cena"]];
  headerLines.forEach((parts, i) => { const center = (xs[i] + xs[i + 1]) / 2, gap = 7, start = top - 17 + (parts.length - 1) * gap / 2; parts.forEach((part, j) => text(center, start - j * gap, part, parts.length === 3 ? 4.2 : 4.8, true, "center")); });
  let sumWork = 0, sumTravel = 0, sumReimb = 0, sumLunch = 0, sumDinner = 0;
  for (let day = 1; day <= days; day += 1) {
    const key = dateKey(year, monthIndex, day), entry = entries[key] || { ...EMPTY_ENTRY, date: key }, work = workMinutes(entry), travel = travelMinutes(entry), all = work + travel;
    sumWork += work; sumTravel += travel; sumReimb += decimalNumber(entry.reimbursement); sumLunch += decimalNumber(entry.lunch); sumDinner += decimalNumber(entry.dinner);
    const yTop = top - headerH - (day - 1) * rowH, yBottom = yTop - rowH; line(x0, yBottom, xs[xs.length - 1], yBottom, .25);
    const values = [`${pad(day)}/${pad(monthIndex + 1)}/${String(year).slice(-2)}`, entry.in1, entry.out1, entry.in2, entry.out2, durationLabel(work), travel > 0 ? durationLabel(travel) : "", decimalNumber(entry.reimbursement) > 0 ? `EUR ${decimalNumber(entry.reimbursement).toFixed(2)}` : "", durationLabel(all), entry.fair, entry.stand, decimalNumber(entry.lunch) > 0 ? `EUR ${decimalNumber(entry.lunch).toFixed(2)}` : "", decimalNumber(entry.dinner) > 0 ? `EUR ${decimalNumber(entry.dinner).toFixed(2)}` : ""];
    values.forEach((value, i) => text((xs[i] + xs[i + 1]) / 2, yBottom + 4.3, value, 4.6, i === 5 || i === 8, "center", i === 10 ? 21 : i === 9 ? 14 : 15));
  }
  line(x0, bottom + totalH, xs[xs.length - 1], bottom + totalH); line(x0, bottom, xs[xs.length - 1], bottom, .5); text(xs[5] - 4, bottom + 5, "TOTALI", 5.2, true, "right");
  text((xs[5]+xs[6])/2,bottom+5,durationLabel(sumWork),5.5,true,"center"); text((xs[6]+xs[7])/2,bottom+5,durationLabel(sumTravel),5.5,true,"center"); text((xs[7]+xs[8])/2,bottom+5,`EUR ${sumReimb.toFixed(2)}`,5.2,true,"center"); text((xs[8]+xs[9])/2,bottom+5,durationLabel(sumWork+sumTravel),5.5,true,"center"); text((xs[11]+xs[12])/2,bottom+5,`EUR ${sumLunch.toFixed(2)}`,5.2,true,"center"); text((xs[12]+xs[13])/2,bottom+5,`EUR ${sumDinner.toFixed(2)}`,5.2,true,"center");
  const stream = commands.join("\n"), objects: string[] = []; objects[1] = "<< /Type /Catalog /Pages 2 0 R >>"; objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"; objects[3] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`; objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"; objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"; objects[6] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  let pdf = "%PDF-1.4\n%Pontaj\n"; const offsets = [0]; for (let i = 1; i <= 6; i += 1) { offsets[i] = pdf.length; pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`; } const xref = pdf.length; pdf += "xref\n0 7\n0000000000 65535 f \n"; for (let i = 1; i <= 6; i += 1) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`; pdf += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const bytes = new Uint8Array(pdf.length); for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 255; return new Blob([bytes], { type: "application/pdf" });
}

function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
function migrateOldData(): StoredData | null { try { const raw = localStorage.getItem(OLD_STORAGE_KEY); if (!raw) return null; const old = JSON.parse(raw) as { entries?: Record<string,{date?:string;start?:string;end?:string;note?:string}>; settings?:{employeeName?:string} }; const entries: Record<string,DayEntry> = {}; Object.entries(old.entries || {}).forEach(([key,value]) => { entries[key] = { ...EMPTY_ENTRY, date: value.date || key, in1: value.start || "", out1: value.end || "", notes: value.note || "" }; }); return { entries, settings: { employeeName: old.settings?.employeeName || "", language: "ro" } }; } catch { return null; } }

export default function PontajApp() {
  const [entries,setEntries] = useState<Record<string,DayEntry>>({});
  const [settings,setSettings] = useState<Settings>({employeeName:"",language:"ro"});
  const [viewMonth,setViewMonth] = useState(() => localMonthKey(new Date()));
  const [activeTab,setActiveTab] = useState<AppTab>("calendar");
  const [selectedDate,setSelectedDate] = useState<string|null>(null);
  const [draft,setDraft] = useState<DayEntry|null>(null);
  const [hydrated,setHydrated] = useState(false);
  const [toast,setToast] = useState("");

  const language = settings.language;
  const locale = LOCALES[language];
  const t = TRANSLATIONS[language];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY), parsed = saved ? JSON.parse(saved) as StoredData : migrateOldData();
      if (parsed?.entries) setEntries(parsed.entries);
      if (parsed?.settings) setSettings({ employeeName: parsed.settings.employeeName || "", language: parsed.settings.language === "it" ? "it" : "ro" });
    } catch { setToast(TRANSLATIONS.ro.loadError); }
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify({entries,settings})); }, [entries,settings,hydrated]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""),3200); return () => clearTimeout(timer); }, [toast]);

  const view = useMemo(() => monthDate(viewMonth),[viewMonth]);
  const year = view.getFullYear(), monthIndex = view.getMonth(), daysInMonth = new Date(year,monthIndex+1,0).getDate(), firstDayOffset = (new Date(year,monthIndex,1).getDay()+6)%7;
  const monthName = new Intl.DateTimeFormat(locale,{month:"long",year:"numeric"}).format(view);
  const calendarDays = useMemo(() => { const cells: Array<string|null> = Array(firstDayOffset).fill(null); for(let day=1;day<=daysInMonth;day+=1) cells.push(dateKey(year,monthIndex,day)); while(cells.length%7) cells.push(null); return cells; },[firstDayOffset,daysInMonth,year,monthIndex]);
  const monthEntries = useMemo(() => Object.values(entries).filter(e => e.date.startsWith(`${viewMonth}-`)).sort((a,b)=>a.date.localeCompare(b.date)),[entries,viewMonth]);
  const workedMinutes = monthEntries.reduce((s,e)=>s+workMinutes(e),0), travelledMinutes = monthEntries.reduce((s,e)=>s+travelMinutes(e),0), reimbursementTotal = monthEntries.reduce((s,e)=>s+decimalNumber(e.reimbursement),0);

  function openEntry(key:string){setSelectedDate(key);setDraft(entries[key]?{...entries[key]}:{...EMPTY_ENTRY,date:key});}
  function saveDraft(){if(!selectedDate||!draft)return;const hasAny=[draft.in1,draft.out1,draft.in2,draft.out2,draft.travelHours,draft.reimbursement,draft.fair,draft.stand,draft.lunch,draft.dinner,draft.notes].some(v=>String(v).trim()!=="");setEntries(current=>{const next={...current};if(hasAny)next[selectedDate]={...draft,date:selectedDate};else delete next[selectedDate];return next});setDraft(null);setSelectedDate(null);setToast(t.daySaved);}
  function removeEntry(){if(!selectedDate)return;setEntries(current=>{const next={...current};delete next[selectedDate];return next});setDraft(null);setSelectedDate(null);setToast(t.entryDeleted);}
  function downloadPdf(){downloadBlob(createReportPdf(viewMonth,settings.employeeName,entries),`report-mensile-${viewMonth}.pdf`);setToast(t.pdfGenerated);}
  async function sharePdf(){const blob=createReportPdf(viewMonth,settings.employeeName,entries),filename=`report-mensile-${viewMonth}.pdf`,file=new File([blob],filename,{type:"application/pdf"});try{if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:"REPORT MENSILE",text:`${t.monthlyReport} ${monthName}`,files:[file]});return;}}catch(error){if(error instanceof DOMException&&error.name==="AbortError")return;}downloadBlob(blob,filename);setToast(t.pdfSaved);}
  function exportBackup(){downloadBlob(new Blob([JSON.stringify({entries,settings},null,2)],{type:"application/json"}),`backup-pontaj-${new Date().toISOString().slice(0,10)}.json`);}
  async function importBackup(event:ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];event.target.value="";if(!file)return;try{const parsed=JSON.parse(await file.text()) as StoredData;if(!parsed.entries||!parsed.settings)throw new Error();setEntries(parsed.entries);setSettings({employeeName:parsed.settings.employeeName||"",language:parsed.settings.language==="it"?"it":"ro"});setToast(t.dataRestored);}catch{setToast(t.invalidBackup);}}

  const today=new Date(),todayKey=dateKey(today.getFullYear(),today.getMonth(),today.getDate()),selectedDateLabel=selectedDate?new Intl.DateTimeFormat(locale,{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date(`${selectedDate}T12:00:00`)):"";
  if(!hydrated)return <main className="loading">{t.loading}</main>;

  return <main className="app"><style>{`:root{--bg:#f3f5f7;--card:#fff;--ink:#17202a;--muted:#68727d;--line:#e1e6ea;--primary:#126b5a;--primary2:#0b5547;--soft:#e4f2ee;--danger:#b3261e}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.app{width:min(100%,720px);min-height:100svh;margin:auto;padding:max(18px,env(safe-area-inset-top)) 15px calc(30px + env(safe-area-inset-bottom))}.loading{min-height:100vh;display:grid;place-items:center}.header{display:flex;align-items:center;gap:12px;margin-bottom:16px}.logo{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(145deg,#19816e,#0b5749);color:#fff;font-size:24px}.headerText{min-width:0}.header strong{font-size:20px}.header span{display:block;color:var(--muted);font-size:12px}.languageQuick{margin-left:auto;border:1px solid var(--line);background:#fff;border-radius:12px;padding:9px 8px;font:inherit;font-weight:750;color:var(--primary2)}.tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:5px;background:#fff;border:1px solid var(--line);border-radius:17px;margin-bottom:14px}.tabs button{border:0;background:transparent;padding:12px 5px;border-radius:12px;color:var(--muted);font-weight:700}.tabs button.active{background:var(--soft);color:var(--primary2)}.card{background:#fff;border:1px solid var(--line);border-radius:22px;box-shadow:0 14px 38px rgba(20,35,45,.07);padding:17px;margin-bottom:14px}.month{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;text-align:center}.month button,.close{width:42px;height:42px;border:1px solid var(--line);background:#fff;border-radius:13px;font-size:22px}.month h1{font-size:20px;margin:0;text-transform:capitalize}.month small{color:var(--muted)}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}.stat{background:#f7f8fa;border-radius:14px;padding:12px 8px;text-align:center}.stat strong{display:block;font-size:17px}.stat span{font-size:10px;color:var(--muted)}.calendarTitle{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.calendarTitle h2{margin:0;font-size:17px}.today{border:0;background:var(--soft);color:var(--primary2);font-weight:700;border-radius:10px;padding:8px 10px}.week,.grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.week span{text-align:center;color:var(--muted);font-size:10px;font-weight:700;padding:4px}.day,.spacer{aspect-ratio:.9}.day{border:1px solid transparent;border-radius:12px;background:#f7f8fa;display:grid;place-content:center;gap:2px;text-align:center}.day span{font-weight:700}.day small{font-size:9px;color:var(--muted);min-height:11px}.day.has{background:var(--soft);color:var(--primary2)}.day.now{border-color:var(--primary)}.primary,.secondary,.danger{min-height:48px;border-radius:15px;border:0;padding:0 16px;font-weight:750}.primary{background:var(--primary);color:#fff}.secondary{background:var(--soft);color:var(--primary2);border:1px solid #cfe5df}.danger{background:#fcebea;color:var(--danger)}.wide{width:100%}.report h1,.settings h1{margin:0 0 4px;text-transform:capitalize}.muted{color:var(--muted);font-size:13px}.actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px}.list{margin-top:18px}.row{width:100%;border:0;border-bottom:1px solid var(--line);background:transparent;padding:12px 2px;display:grid;grid-template-columns:1fr auto;text-align:left}.row strong{display:block}.row small{color:var(--muted)}.settings label,.field{display:block;margin-bottom:13px}.settings label span,.field>span{display:block;font-size:12px;font-weight:750;margin-bottom:6px;color:#3d4650}input,textarea,select{width:100%;border:1px solid #cfd6dc;border-radius:12px;padding:12px;font:inherit;background:#fff;color:var(--ink)}input[type=time]{min-height:48px}.sheetBack{position:fixed;inset:0;background:rgba(18,25,32,.46);display:flex;align-items:flex-end;justify-content:center;z-index:20}.sheet{width:min(100%,720px);max-height:92svh;overflow:auto;background:#fff;border-radius:24px 24px 0 0;padding:12px 17px calc(20px + env(safe-area-inset-bottom))}.sheetHead{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px}.sheetHead h2{font-size:19px;margin:3px 0;text-transform:capitalize}.sheetHead span{font-size:11px;color:var(--muted);text-transform:uppercase;font-weight:700}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.calc{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0 14px}.calc div{background:var(--soft);padding:12px;border-radius:13px}.calc span{display:block;font-size:10px;color:var(--muted)}.calc strong{font-size:18px}.sheetActions{display:grid;grid-template-columns:auto 1fr;gap:9px;margin-top:8px}.toast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));transform:translateX(-50%);background:#17202a;color:#fff;padding:12px 16px;border-radius:13px;z-index:30;max-width:90%;text-align:center}.backup{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}.fileButton{position:relative;display:flex;align-items:center;justify-content:center}.fileButton input{position:absolute;opacity:0;inset:0}.note{font-size:12px;color:var(--muted);line-height:1.45}.empty{text-align:center;padding:20px;color:var(--muted)}`}</style>
    <header className="header"><div className="logo">◫</div><div className="headerText"><strong>{t.appName}</strong><span>{t.subtitle}</span></div><select className="languageQuick" aria-label={t.language} value={language} onChange={event=>setSettings(current=>({...current,language:event.target.value as Language}))}><option value="ro">RO</option><option value="it">IT</option></select></header>
    <nav className="tabs"><button className={activeTab==="calendar"?"active":""} onClick={()=>setActiveTab("calendar")}>{t.calendar}</button><button className={activeTab==="report"?"active":""} onClick={()=>setActiveTab("report")}>{t.report}</button><button className={activeTab==="settings"?"active":""} onClick={()=>setActiveTab("settings")}>{t.settings}</button></nav>
    {activeTab==="calendar"&&<><section className="card"><div className="month"><button onClick={()=>setViewMonth(moveMonth(viewMonth,-1))}>‹</button><div><small>{t.selectedMonth}</small><h1>{monthName}</h1></div><button onClick={()=>setViewMonth(moveMonth(viewMonth,1))}>›</button></div><div className="stats"><div className="stat"><strong>{durationLabel(workedMinutes)}</strong><span>{t.workedHours}</span></div><div className="stat"><strong>{durationLabel(travelledMinutes)}</strong><span>{t.travelHoursStat}</span></div><div className="stat"><strong>{moneyLabel(reimbursementTotal,locale)}</strong><span>{t.reimbursements}</span></div></div></section><section className="card"><div className="calendarTitle"><div><h2>{t.calendar}</h2><div className="muted">{t.calendarHelp}</div></div><button className="today" onClick={()=>setViewMonth(localMonthKey(new Date()))}>{t.today}</button></div><div className="week">{t.weekdays.map(day=><span key={day}>{day}</span>)}</div><div className="grid">{calendarDays.map((key,index)=>!key?<span className="spacer" key={`empty-${index}`}/>:<button key={key} className={`day ${entries[key]?"has":""} ${key===todayKey?"now":""}`} onClick={()=>openEntry(key)}><span>{Number(key.slice(-2))}</span><small>{entries[key]?durationLabel(totalMinutes(entries[key])):""}</small></button>)}</div></section><button className="primary wide" onClick={()=>openEntry(todayKey)}>{t.addToday}</button></>}
    {activeTab==="report"&&<section className="card report"><h1>{monthName}</h1><div className="muted">{t.reportTemplate}</div><div className="stats"><div className="stat"><strong>{durationLabel(workedMinutes)}</strong><span>{t.work}</span></div><div className="stat"><strong>{durationLabel(travelledMinutes)}</strong><span>{t.travel}</span></div><div className="stat"><strong>{durationLabel(workedMinutes+travelledMinutes)}</strong><span>{t.total}</span></div></div><div className="actions"><button className="primary" onClick={downloadPdf}>{t.savePdf}</button><button className="secondary" onClick={sharePdf}>{t.share}</button></div><div className="list">{monthEntries.length===0?<div className="empty">{t.noDays}</div>:monthEntries.map(entry=><button className="row" key={entry.date} onClick={()=>openEntry(entry.date)}><div><strong>{new Intl.DateTimeFormat(locale,{weekday:"short",day:"numeric",month:"short"}).format(new Date(`${entry.date}T12:00:00`))}</strong><small>{[entry.in1&&`${entry.in1}–${entry.out1}`,entry.in2&&`${entry.in2}–${entry.out2}`].filter(Boolean).join(" · ")||t.otherData}</small></div><strong>{durationLabel(totalMinutes(entry))}</strong></button>)}</div></section>}
    {activeTab==="settings"&&<section className="card settings"><h1>{t.settingsTitle}</h1><p className="muted">{t.nameInPdf}</p><label><span>{t.employeeName}</span><input value={settings.employeeName} onChange={event=>setSettings(current=>({...current,employeeName:event.target.value}))} placeholder={t.employeePlaceholder}/></label><label><span>{t.language}</span><select value={language} onChange={event=>setSettings(current=>({...current,language:event.target.value as Language}))}><option value="ro">{t.romanian}</option><option value="it">{t.italian}</option></select></label><div className="backup"><button className="secondary" onClick={exportBackup}>{t.saveBackup}</button><label className="secondary fileButton">{t.restore}<input type="file" accept="application/json,.json" onChange={importBackup}/></label></div><p className="note">{t.storageNote}</p></section>}
    {draft&&selectedDate&&<div className="sheetBack" onMouseDown={event=>{if(event.target===event.currentTarget){setDraft(null);setSelectedDate(null)}}}><section className="sheet" role="dialog" aria-modal="true"><div className="sheetHead"><div><span>{t.dailyEntry}</span><h2>{selectedDateLabel}</h2></div><button className="close" onClick={()=>{setDraft(null);setSelectedDate(null)}}>×</button></div><div className="two"><label className="field"><span>{t.entry1}</span><input type="time" value={draft.in1} onChange={event=>setDraft({...draft,in1:event.target.value})}/></label><label className="field"><span>{t.exit1}</span><input type="time" value={draft.out1} onChange={event=>setDraft({...draft,out1:event.target.value})}/></label></div><div className="two"><label className="field"><span>{t.entry2}</span><input type="time" value={draft.in2} onChange={event=>setDraft({...draft,in2:event.target.value})}/></label><label className="field"><span>{t.exit2}</span><input type="time" value={draft.out2} onChange={event=>setDraft({...draft,out2:event.target.value})}/></label></div><div className="calc"><div><span>{t.totalWorkHours}</span><strong>{durationLabel(workMinutes(draft))}</strong></div><div><span>{t.workPlusTravel}</span><strong>{durationLabel(totalMinutes(draft))}</strong></div></div><div className="two"><label className="field"><span>{t.travelHours}</span><input type="number" inputMode="decimal" min="0" step="0.25" value={draft.travelHours} onChange={event=>setDraft({...draft,travelHours:event.target.value})} placeholder="0"/></label><label className="field"><span>{t.travelReimbursement}</span><input type="number" inputMode="decimal" min="0" step="0.01" value={draft.reimbursement} onChange={event=>setDraft({...draft,reimbursement:event.target.value})} placeholder="0,00"/></label></div><label className="field"><span>{t.fair}</span><input value={draft.fair} onChange={event=>setDraft({...draft,fair:event.target.value})} placeholder={t.fairPlaceholder}/></label><label className="field"><span>{t.standName}</span><input value={draft.stand} onChange={event=>setDraft({...draft,stand:event.target.value})} placeholder={t.standPlaceholder}/></label><div className="two"><label className="field"><span>{t.lunch}</span><input type="number" inputMode="decimal" min="0" step="0.01" value={draft.lunch} onChange={event=>setDraft({...draft,lunch:event.target.value})} placeholder="0,00"/></label><label className="field"><span>{t.dinner}</span><input type="number" inputMode="decimal" min="0" step="0.01" value={draft.dinner} onChange={event=>setDraft({...draft,dinner:event.target.value})} placeholder="0,00"/></label></div><label className="field"><span>{t.notes}</span><textarea rows={3} value={draft.notes} onChange={event=>setDraft({...draft,notes:event.target.value})} placeholder={t.optional}/></label><div className="sheetActions">{entries[selectedDate]?<button className="danger" onClick={removeEntry}>{t.delete}</button>:<span/>}<button className="primary" onClick={saveDraft}>{t.saveDay}</button></div></section></div>}
    {toast&&<div className="toast">{toast}</div>}
  </main>;
}
