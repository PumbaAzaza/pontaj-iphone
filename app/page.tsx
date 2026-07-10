"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type EntryType = "work" | "vacation" | "sick" | "off";

type WorkEntry = {
  date: string;
  start: string;
  end: string;
  breakMinutes: number;
  hours: number;
  note: string;
  type: EntryType;
};

type Settings = {
  employeeName: string;
  company: string;
  dailyTarget: number;
  defaultBreak: number;
};

type AppTab = "calendar" | "report" | "settings";

const STORAGE_KEY = "pontaj-iphone-v1";
const BACKUP_VERSION = 1;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const WEEKDAYS = ["L", "Ma", "Mi", "J", "V", "S", "D"];
const TYPE_LABELS: Record<EntryType, string> = {
  work: "Lucru",
  vacation: "Concediu",
  sick: "Medical",
  off: "Liber",
};

const DEFAULT_SETTINGS: Settings = {
  employeeName: "",
  company: "",
  dailyTarget: 8,
  defaultBreak: 30,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M16 3v4M8 3v4M3 10h18" />
        <path d="m8 15 2 2 4-4" />
      </>
    ),
    left: <path d="m15 18-6-6 6-6" />,
    right: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h6" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    download: (
      <>
        <path d="M12 3v12M7 10l5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    upload: (
      <>
        <path d="M12 21V9M7 14l5-5 5 5" />
        <path d="M5 3h14" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
      </>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m5 12 4 4L19 6" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7h.01" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function localMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthDate(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function moveMonth(key: string, offset: number) {
  const date = monthDate(key);
  date.setMonth(date.getMonth() + offset);
  return localMonthKey(date);
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function calculateHours(start: string, end: string, breakMinutes: number) {
  if (!start || !end) return 0;
  const startMinutes = timeToMinutes(start);
  let endMinutes = timeToMinutes(end);
  if (endMinutes < startMinutes) endMinutes += 24 * 60;
  return Math.max(0, (endMinutes - startMinutes - Math.max(0, breakMinutes)) / 60);
}

function hoursLabel(value: number) {
  return `${value.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} h`;
}

function normalizePdfText(value: string) {
  return value
    .replace(/[șş]/gi, (match) => (match === match.toUpperCase() ? "S" : "s"))
    .replace(/[țţ]/gi, (match) => (match === match.toUpperCase() ? "T" : "t"))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function pdfEscape(value: string) {
  return normalizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createSimplePdf(lines: string[]) {
  const content = [
    "BT",
    "/F1 10 Tf",
    ...lines.map((line, index) => `1 0 0 1 36 ${806 - index * 19} Tm (${pdfEscape(line)}) Tj`),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n%Pontaj\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function PontajApp() {
  const [entries, setEntries] = useState<Record<string, WorkEntry>>({});
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [viewMonth, setViewMonth] = useState(() => localMonthKey(new Date()));
  const [activeTab, setActiveTab] = useState<AppTab>("calendar");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [draft, setDraft] = useState<WorkEntry | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  const [showInstallTip, setShowInstallTip] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { entries?: Record<string, WorkEntry>; settings?: Settings };
        if (parsed.entries && typeof parsed.entries === "object") setEntries(parsed.entries);
        if (parsed.settings && typeof parsed.settings === "object") {
          setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        }
      }
    } catch {
      setToast("Datele locale nu au putut fi citite.");
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    setShowInstallTip(!standalone && window.localStorage.getItem("pontaj-install-tip-dismissed") !== "1");
    setHydrated(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` }).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries, settings }));
  }, [entries, settings, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const viewDate = useMemo(() => monthDate(viewMonth), [viewMonth]);
  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const monthName = new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric" }).format(viewDate);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

  const calendarDays = useMemo(() => {
    const cells: Array<string | null> = Array(firstDayOffset).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(dateKey(year, monthIndex, day));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [daysInMonth, firstDayOffset, monthIndex, year]);

  const monthEntries = useMemo(
    () =>
      Object.values(entries)
        .filter((entry) => entry.date.startsWith(`${viewMonth}-`))
        .sort((first, second) => first.date.localeCompare(second.date)),
    [entries, viewMonth],
  );

  const workEntries = monthEntries.filter((entry) => entry.type === "work");
  const workedHours = workEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const creditedHours = monthEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const leaveDays = monthEntries.filter((entry) => entry.type === "vacation" || entry.type === "sick").length;
  let weekdays = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const weekDay = new Date(year, monthIndex, day).getDay();
    if (weekDay !== 0 && weekDay !== 6) weekdays += 1;
  }
  const monthlyTarget = weekdays * settings.dailyTarget;
  const balance = creditedHours - monthlyTarget;
  const progress = monthlyTarget > 0 ? Math.min(100, (creditedHours / monthlyTarget) * 100) : 0;

  function openEntry(key: string) {
    const existing = entries[key];
    const nextDraft: WorkEntry = existing
      ? { ...existing }
      : {
          date: key,
          start: "08:00",
          end: "16:30",
          breakMinutes: settings.defaultBreak,
          hours: calculateHours("08:00", "16:30", settings.defaultBreak),
          note: "",
          type: "work",
        };
    setSelectedDate(key);
    setDraft(nextDraft);
  }

  function saveDraft() {
    if (!selectedDate || !draft) return;
    const hours =
      draft.type === "work"
        ? calculateHours(draft.start, draft.end, draft.breakMinutes)
        : draft.type === "off"
          ? 0
          : settings.dailyTarget;

    if (draft.type === "work" && hours <= 0) {
      setToast("Verifică orele de început, sfârșit și pauză.");
      return;
    }

    setEntries((current) => ({
      ...current,
      [selectedDate]: { ...draft, date: selectedDate, hours: Number(hours.toFixed(2)) },
    }));
    setDraft(null);
    setSelectedDate(null);
    setToast("Ziua a fost salvată.");
  }

  function removeEntry() {
    if (!selectedDate) return;
    setEntries((current) => {
      const next = { ...current };
      delete next[selectedDate];
      return next;
    });
    setDraft(null);
    setSelectedDate(null);
    setToast("Înregistrarea a fost ștearsă.");
  }

  function reportLines() {
    const person = settings.employeeName || "Nespecificat";
    const company = settings.company || "Nespecificata";
    const lines = [
      "PONTAJ LUNAR",
      `Luna: ${monthName}`,
      `Angajat: ${person}`,
      `Companie: ${company}`,
      "",
      "Data       Tip       Interval       Pauza    Ore    Observatii",
      "--------------------------------------------------------------------------",
    ];

    monthEntries.forEach((entry) => {
      const shortDate = entry.date.split("-").reverse().join(".");
      const interval = entry.type === "work" ? `${entry.start}-${entry.end}` : "-";
      const breakText = entry.type === "work" ? `${entry.breakMinutes} min` : "-";
      lines.push(
        `${shortDate.padEnd(11)}${TYPE_LABELS[entry.type].padEnd(10)}${interval.padEnd(15)}${breakText.padEnd(9)}${entry.hours
          .toFixed(2)
          .padEnd(7)}${entry.note.slice(0, 25)}`,
      );
    });

    if (monthEntries.length === 0) lines.push("Nu exista inregistrari pentru aceasta luna.");
    lines.push("", `Ore lucrate: ${workedHours.toFixed(2)}`);
    lines.push(`Ore pontate total: ${creditedHours.toFixed(2)}`);
    lines.push(`Norma lunara: ${monthlyTarget.toFixed(2)}`);
    lines.push(`Diferenta: ${balance >= 0 ? "+" : ""}${balance.toFixed(2)}`);
    return lines.slice(0, 41);
  }

  function downloadPdf() {
    triggerDownload(createSimplePdf(reportLines()), `pontaj-${viewMonth}.pdf`);
    setToast("Raportul PDF a fost generat.");
  }

  async function sharePdf() {
    const blob = createSimplePdf(reportLines());
    const filename = `pontaj-${viewMonth}.pdf`;
    const file = new File([blob], filename, { type: "application/pdf" });
    const summary = `Pontaj ${monthName}: ${hoursLabel(workedHours)} lucrate, ${hoursLabel(creditedHours)} pontate.`;

    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: `Pontaj ${monthName}`, text: summary, files: [file] });
        setToast("Raportul a fost trimis către meniul de partajare.");
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    triggerDownload(blob, filename);
    window.open(`https://wa.me/?text=${encodeURIComponent(`${summary} Raportul PDF a fost salvat pe telefon.`)}`, "_blank");
    setToast("PDF-ul a fost salvat. Atașează-l în WhatsApp.");
  }

  function exportBackup() {
    const blob = new Blob(
      [JSON.stringify({ version: BACKUP_VERSION, exportedAt: new Date().toISOString(), entries, settings }, null, 2)],
      { type: "application/json" },
    );
    triggerDownload(blob, `pontaj-backup-${new Date().toISOString().slice(0, 10)}.json`);
    setToast("Copia de siguranță a fost salvată.");
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { entries?: Record<string, WorkEntry>; settings?: Settings };
      if (!parsed.entries || !parsed.settings) throw new Error("Invalid backup");
      setEntries(parsed.entries);
      setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      setToast("Copia de siguranță a fost restaurată.");
    } catch {
      setToast("Fișierul ales nu este o copie de siguranță validă.");
    }
  }

  function resetData() {
    if (!window.confirm("Ștergi toate orele și setările salvate pe acest telefon?")) return;
    setEntries({});
    setSettings(DEFAULT_SETTINGS);
    setToast("Toate datele au fost șterse.");
  }

  function dismissInstallTip() {
    window.localStorage.setItem("pontaj-install-tip-dismissed", "1");
    setShowInstallTip(false);
  }

  function cellLabel(key: string) {
    const entry = entries[key];
    if (!entry) return "";
    if (entry.type === "vacation") return "CO";
    if (entry.type === "sick") return "CM";
    if (entry.type === "off") return "Liber";
    return `${entry.hours.toLocaleString("ro-RO", { maximumFractionDigits: 1 })}h`;
  }

  const todayKey = dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const selectedDateLabel = selectedDate
    ? new Intl.DateTimeFormat("ro-RO", { weekday: "long", day: "numeric", month: "long" }).format(
        new Date(`${selectedDate}T12:00:00`),
      )
    : "";

  if (!hydrated) {
    return (
      <main className="app-shell loading-shell">
        <div className="brand-mark"><Icon name="calendar" size={28} /></div>
        <p>Se încarcă pontajul…</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-mark"><Icon name="calendar" size={25} /></div>
        <div className="brand-copy">
          <strong>Pontaj</strong>
          <span>Datele rămân pe telefonul tău</span>
        </div>
      </header>

      {showInstallTip && (
        <section className="install-tip" aria-label="Instrucțiuni de instalare">
          <div className="install-icon"><Icon name="info" /></div>
          <div>
            <strong>Instalează pe iPhone</strong>
            <p>În Safari: Partajează → Adăugați pe ecranul principal.</p>
          </div>
          <button className="icon-button subtle" onClick={dismissInstallTip} aria-label="Închide instrucțiunile">
            <Icon name="x" size={18} />
          </button>
        </section>
      )}

      <nav className="main-tabs" aria-label="Secțiunile aplicației">
        <button className={activeTab === "calendar" ? "active" : ""} onClick={() => setActiveTab("calendar")}>
          <Icon name="calendar" size={18} /> Calendar
        </button>
        <button className={activeTab === "report" ? "active" : ""} onClick={() => setActiveTab("report")}>
          <Icon name="file" size={18} /> Raport
        </button>
        <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
          <Icon name="settings" size={18} /> Setări
        </button>
      </nav>

      {activeTab === "calendar" && (
        <>
          <section className="summary-card">
            <div className="month-switcher">
              <button className="icon-button" onClick={() => setViewMonth(moveMonth(viewMonth, -1))} aria-label="Luna anterioară">
                <Icon name="left" />
              </button>
              <div>
                <span>Luna selectată</span>
                <h1>{monthName}</h1>
              </div>
              <button className="icon-button" onClick={() => setViewMonth(moveMonth(viewMonth, 1))} aria-label="Luna următoare">
                <Icon name="right" />
              </button>
            </div>

            <div className="hours-hero">
              <span>Ore lucrate</span>
              <strong>{workedHours.toLocaleString("ro-RO", { maximumFractionDigits: 2 })}</strong>
              <small>din {monthlyTarget.toLocaleString("ro-RO", { maximumFractionDigits: 1 })} h normă</small>
            </div>
            <div className="progress-track" aria-label={`${Math.round(progress)}% din norma lunară`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="mini-stats">
              <div><strong>{workEntries.length}</strong><span>Zile lucrate</span></div>
              <div><strong>{leaveDays}</strong><span>Zile concediu</span></div>
              <div><strong className={balance < 0 ? "negative" : "positive"}>{balance > 0 ? "+" : ""}{hoursLabel(balance)}</strong><span>Diferență</span></div>
            </div>
          </section>

          <section className="calendar-card">
            <div className="calendar-heading">
              <div>
                <h2>Calendar</h2>
                <p>Apasă pe o zi pentru a adăuga orele.</p>
              </div>
              <button className="today-button" onClick={() => setViewMonth(localMonthKey(new Date()))}>Astăzi</button>
            </div>
            <div className="week-row" aria-hidden="true">
              {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="calendar-grid">
              {calendarDays.map((key, index) => {
                if (!key) return <span className="day-spacer" key={`empty-${index}`} />;
                const day = Number(key.slice(-2));
                const entry = entries[key];
                const isToday = key === todayKey;
                const weekDay = new Date(`${key}T12:00:00`).getDay();
                const isWeekend = weekDay === 0 || weekDay === 6;
                return (
                  <button
                    key={key}
                    className={`day-cell ${entry ? `has-entry ${entry.type}` : ""} ${isToday ? "today" : ""} ${isWeekend ? "weekend" : ""}`}
                    onClick={() => openEntry(key)}
                    aria-label={`${day} ${monthName}${entry ? `, ${TYPE_LABELS[entry.type]}, ${hoursLabel(entry.hours)}` : ", fără pontaj"}`}
                  >
                    <span>{day}</span>
                    <small>{cellLabel(key)}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <button className="primary-button add-day" onClick={() => openEntry(todayKey)}>
            <Icon name="plus" /> Adaugă ore pentru astăzi
          </button>
        </>
      )}

      {activeTab === "report" && (
        <section className="content-section">
          <div className="section-heading">
            <span>Raport lunar</span>
            <h1>{monthName}</h1>
            <p>Generează un PDF sau trimite-l prin meniul de partajare către WhatsApp.</p>
          </div>

          <div className="report-summary">
            <div><span>Lucrate</span><strong>{hoursLabel(workedHours)}</strong></div>
            <div><span>Pontate</span><strong>{hoursLabel(creditedHours)}</strong></div>
            <div><span>Normă</span><strong>{hoursLabel(monthlyTarget)}</strong></div>
          </div>

          <div className="action-grid">
            <button className="primary-button" onClick={downloadPdf}><Icon name="download" /> Salvează PDF</button>
            <button className="secondary-button" onClick={sharePdf}><Icon name="share" /> Trimite pe WhatsApp</button>
          </div>

          <div className="entries-list">
            <div className="list-title"><h2>Zile înregistrate</h2><span>{monthEntries.length}</span></div>
            {monthEntries.length === 0 ? (
              <div className="empty-state"><Icon name="clock" size={28} /><p>Nu ai adăugat încă ore pentru această lună.</p></div>
            ) : (
              monthEntries.map((entry) => (
                <button key={entry.date} className="entry-row" onClick={() => openEntry(entry.date)}>
                  <span className={`entry-dot ${entry.type}`} />
                  <div>
                    <strong>{new Intl.DateTimeFormat("ro-RO", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${entry.date}T12:00:00`))}</strong>
                    <small>{TYPE_LABELS[entry.type]}{entry.type === "work" ? ` · ${entry.start}–${entry.end}` : ""}</small>
                  </div>
                  <b>{hoursLabel(entry.hours)}</b>
                  <Icon name="right" size={17} />
                </button>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "settings" && (
        <section className="content-section">
          <div className="section-heading">
            <span>Preferințe</span>
            <h1>Setări</h1>
            <p>Aceste informații apar în raportul lunar.</p>
          </div>

          <div className="settings-group">
            <label>
              <span>Numele angajatului</span>
              <input value={settings.employeeName} onChange={(event) => setSettings({ ...settings, employeeName: event.target.value })} placeholder="Ex: Călin Borta" autoComplete="name" />
            </label>
            <label>
              <span>Compania</span>
              <input value={settings.company} onChange={(event) => setSettings({ ...settings, company: event.target.value })} placeholder="Numele companiei" />
            </label>
            <div className="two-fields">
              <label>
                <span>Normă zilnică</span>
                <div className="number-field"><input type="number" min="1" max="24" step="0.5" value={settings.dailyTarget} onChange={(event) => setSettings({ ...settings, dailyTarget: Number(event.target.value) || 8 })} /><em>ore</em></div>
              </label>
              <label>
                <span>Pauză implicită</span>
                <div className="number-field"><input type="number" min="0" max="240" step="5" value={settings.defaultBreak} onChange={(event) => setSettings({ ...settings, defaultBreak: Number(event.target.value) || 0 })} /><em>min</em></div>
              </label>
            </div>
          </div>

          <div className="settings-card install-card">
            <div className="settings-card-icon"><Icon name="download" /></div>
            <div><strong>Instalare pe iPhone</strong><p>Deschide aplicația în Safari, apasă Partajează și alege „Adăugați pe ecranul principal”.</p></div>
          </div>

          <div className="settings-card data-card">
            <div><strong>Copie de siguranță</strong><p>Salvează datele înainte să schimbi telefonul sau să ștergi datele Safari.</p></div>
            <div className="backup-actions">
              <button className="secondary-button small" onClick={exportBackup}><Icon name="download" size={17} /> Exportă</button>
              <label className="secondary-button small file-button"><Icon name="upload" size={17} /> Importă<input type="file" accept="application/json,.json" onChange={importBackup} /></label>
            </div>
          </div>

          <button className="danger-button" onClick={resetData}><Icon name="trash" size={18} /> Șterge toate datele</button>
          <p className="privacy-note">Pontajul este stocat local în browser. Aplicația nu trimite automat datele tale către un server.</p>
        </section>
      )}

      {draft && selectedDate && (
        <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setDraft(null); setSelectedDate(null); } }}>
          <section className="entry-sheet" role="dialog" aria-modal="true" aria-labelledby="entry-title">
            <div className="sheet-handle" />
            <div className="sheet-heading">
              <div><span>Adaugă pontaj</span><h2 id="entry-title">{selectedDateLabel}</h2></div>
              <button className="icon-button subtle" onClick={() => { setDraft(null); setSelectedDate(null); }} aria-label="Închide"><Icon name="x" /></button>
            </div>

            <label className="field-label">
              <span>Tipul zilei</span>
              <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as EntryType })}>
                <option value="work">Lucru</option>
                <option value="vacation">Concediu de odihnă</option>
                <option value="sick">Concediu medical</option>
                <option value="off">Zi liberă</option>
              </select>
            </label>

            {draft.type === "work" && (
              <>
                <div className="two-fields time-fields">
                  <label className="field-label"><span>Început</span><input type="time" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} /></label>
                  <label className="field-label"><span>Sfârșit</span><input type="time" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></label>
                </div>
                <label className="field-label"><span>Pauză neplătită</span><div className="number-field"><input type="number" inputMode="numeric" min="0" max="480" step="5" value={draft.breakMinutes} onChange={(event) => setDraft({ ...draft, breakMinutes: Math.max(0, Number(event.target.value) || 0) })} /><em>minute</em></div></label>
                <div className="calculated-hours"><Icon name="clock" /><span>Total calculat</span><strong>{hoursLabel(calculateHours(draft.start, draft.end, draft.breakMinutes))}</strong></div>
              </>
            )}

            {(draft.type === "vacation" || draft.type === "sick") && (
              <div className="calculated-hours"><Icon name="clock" /><span>Ore pontate conform normei</span><strong>{hoursLabel(settings.dailyTarget)}</strong></div>
            )}

            <label className="field-label"><span>Observații <small>(opțional)</small></span><textarea rows={3} maxLength={160} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Ex: lucru de acasă, tură de noapte…" /></label>

            <div className="sheet-actions">
              {entries[selectedDate] && <button className="danger-button compact" onClick={removeEntry}><Icon name="trash" size={18} /> Șterge</button>}
              <button className="primary-button" onClick={saveDraft}><Icon name="check" /> Salvează ziua</button>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
