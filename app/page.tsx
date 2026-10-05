"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const pct = (n: any) => (n == null ? "—" : Number(n).toFixed(1) + "%");

const nav = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "revenue", label: "Revenue", icon: "◈" },
  { id: "apps", label: "Apps", icon: "▦" },
  { id: "adunits", label: "Ad Units", icon: "▤" },
  { id: "adjustments", label: "Adjustments", icon: "↗" },
  { id: "alerts", label: "Alerts", icon: "!" },
  { id: "health", label: "Data Health", icon: "✓" },
];

function KPI({ label, value, meta, tone = "" }: { label: string; value: string; meta: string; tone?: string }) {
  return (
    <div className="kpi">
      <div className="kpiTop">
        <span>{label}</span>
        <span className="kpiRule" />
      </div>
      <strong className={tone}>{value}</strong>
      <small>{meta}</small>
    </div>
  );
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="sectionTitle">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{sub}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="empty"><span>○</span><b>{text}</b><small>Try a different date range or app.</small></div>;
}

function ThemeToggle({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  return (
    <button
      className="themeToggle"
      onClick={() => setDark(!dark)}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light theme" : "Dark theme"}
    >
      <span className={dark ? "" : "selected"}>☼</span>
      <span className={dark ? "selected" : ""}>◐</span>
    </button>
  );
}

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [app, setApp] = useState("all");
  const [metric, setMetric] = useState("latest");
  const [section, setSection] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("invalid-revenue-theme");
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(saved ? saved === "dark" : system);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    window.localStorage.setItem("invalid-revenue-theme", dark ? "dark" : "light");
  }, [dark]);

  const load = async (overrideStart?: string, overrideEnd?: string, overrideApp?: string) => {
    try {
      setLoading(true);
      setErr("");
      const now = new Date();
      const e = overrideEnd || end || now.toISOString().slice(0, 10);
      const s = overrideStart || start || new Date(now.getTime() - 29 * 86400000).toISOString().slice(0, 10);
      const selectedApp = overrideApp ?? app;
      const q = new URLSearchParams({
        start: s,
        end: e,
        app: selectedApp,
        platform: "all",
        entityType: "all",
        adUnit: "all",
      });
      const r = await fetch("/api/dashboard?" + q);
      const j = await r.json();
      if (!r.ok) throw Error(j.error || "Unable to load dashboard");
      setD(j);
      setStart(s);
      setEnd(e);
    } catch (x: any) {
      setErr(x.message || "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chart = useMemo(
    () =>
      (d?.trend || []).map((r: any) => ({
        date: r.date,
        value: metric === "initial"
          ? Number(r.d0 || 0)
          : Math.max(Number(r.d0 || 0), Number(r.d1 || 0), Number(r.d2 || 0), Number(r.d3 || 0), Number(r.d4 || 0)),
      })),
    [d, metric]
  );

  if (err && !d) {
    return <main className="app"><div className="loading"><b>Unable to load workspace</b><span>{err}</span><button className="primary" onClick={() => load()}>Retry</button></div></main>;
  }
  if (!d) {
    return <main className="app"><div className="loading"><b>Loading Revenue Intelligence</b><span>Preparing your financial workspace…</span></div></main>;
  }

  const k = d.kpis;
  const title = nav.find((x) => x.id === section)?.label || "Overview";
  const go = (id: string) => {
    setSection(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const applyFilters = () => load(start, end, app);

  return (
    <main className="app">
      <aside className={"sidebar " + (mobileOpen ? "open" : "")}>
        <div className="brand">
          <div className="brandMark">IR</div>
          <div><b>Invalid Revenue</b><span>INTELLIGENCE</span></div>
        </div>
        <div className="workspace"><span className="liveDot" /> Executive Workspace</div>

        <nav aria-label="Primary navigation">
          <span className="navCaption">WORKSPACE</span>
          {nav.map((x) => (
            <button
              key={x.id}
              className={section === x.id ? "navItem active" : "navItem"}
              onClick={() => go(x.id)}
              aria-current={section === x.id ? "page" : undefined}
            >
              <i>{x.icon}</i><span>{x.label}</span>
              {x.id === "alerts" && d.attention?.length > 0 ? <em>{d.attention.length}</em> : null}
            </button>
          ))}
        </nav>

        <div className="sidebarBottom">
          <button className="sidebarUtility" onClick={() => go("health")}>⚙ Settings & workspace</button>
          <div className="profile">
            <div className="avatar">AI</div>
            <div><b>Analytics Workspace</b><span>Revenue Operations</span></div>
            <span className="dots">•••</span>
          </div>
        </div>
      </aside>

      <section className="main">
        <header className="topbar">
          <div className="topbarLeft">
            <button className="mobileMenu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open navigation">☰</button>
            <div className="crumb">Revenue Intelligence <span>/</span> <b>{title}</b></div>
          </div>
          <div className="topActions">
            <span className="statusPill"><i /> Data connected</span>
            <ThemeToggle dark={dark} setDark={setDark} />
            <button className="iconBtn" title="Refresh data" onClick={() => load()}>↻</button>
            <button className="avatarSmall" aria-label="Workspace profile">AI</button>
          </div>
        </header>

        <div className="page">
          <div className="pageHeader">
            <div>
              <span className="eyebrow">EXECUTIVE CONTROL CENTER</span>
              <h1>{title}</h1>
              <p>{section === "overview" ? "Monitor invalid revenue exposure, adjustments and recovery signals across your portfolio." : "Focused intelligence for " + title.toLowerCase() + "."}</p>
            </div>
            <button className="primary" onClick={() => load()} disabled={loading}>{loading ? "Refreshing…" : "↻ Refresh data"}</button>
          </div>

          <div className="filterBar">
            <div className="filterHeading"><span>ANALYSIS PERIOD</span><b>Filter the portfolio</b></div>
            <label><span>From</span><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
            <label><span>To</span><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
            <label className="appFilter"><span>Application</span><select value={app} onChange={(e) => setApp(e.target.value)}><option value="all">All applications</option>{d.filters.apps.map((x: any) => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label>
            <button className="filterApply" onClick={applyFilters}>Apply filters</button>
          </div>

          {section === "overview" && <>
            <div className="hero">
              <div className="heroCopy">
                <span className="heroEyebrow">PORTFOLIO SIGNAL</span>
                <h2>{k.revenueAtRisk > 0 ? "Revenue exposure requires attention" : "Portfolio is currently stable"}</h2>
                <p>{d.summary}</p>
              </div>
              <div className="heroMetric">
                <small>REVENUE AT RISK</small>
                <strong>{money(k.revenueAtRisk)}</strong>
                <span>{k.adjustmentRate == null ? "No adjustment signal" : pct(k.adjustmentRate) + " adjustment rate"}</span>
              </div>
            </div>

            <div className="kpis">
              <KPI label="Initial invalid revenue" value={money(k.initial)} meta="Baseline detected revenue" />
              <KPI label="Latest invalid revenue" value={money(k.latest)} meta="Latest available snapshot" />
              <KPI label="Revenue at risk" value={money(k.revenueAtRisk)} meta="Potential exposure" tone={k.revenueAtRisk > 0 ? "dangerText" : ""} />
              <KPI label="Total adjustment" value={money(k.adjustment)} meta="Recorded adjustments" tone={k.adjustment > 0 ? "dangerText" : ""} />
              <KPI label="Adjustment rate" value={k.adjustmentRate == null ? "—" : pct(k.adjustmentRate)} meta="Against initial revenue" />
              <KPI label="Affected entities" value={String((k.affectedApps || 0) + (k.affectedAdUnits || 0))} meta={(k.affectedApps || 0) + " apps · " + (k.affectedAdUnits || 0) + " ad units"} />
            </div>

            <div className="twoCol">
              <section className="panel chartPanel">
                <div className="panelHead">
                  <div><span className="eyebrow">EXPOSURE</span><h3>Invalid revenue trend</h3><p>Daily revenue snapshots across the selected period</p></div>
                  <select value={metric} onChange={(e) => setMetric(e.target.value)} aria-label="Revenue metric">
                    <option value="latest">Latest available</option><option value="initial">Initial (D0)</option>
                  </select>
                </div>
                <div className="chart"><ResponsiveContainer width="100%" height={310}><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(v: any) => money(Number(v))} /><Line type="monotone" dataKey="value" stroke="var(--chart)" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div>
              </section>

              <section className="panel">
                <div className="panelHead"><div><span className="eyebrow">RECOVERY</span><h3>Revenue retention</h3><p>Post-detection revenue by snapshot day</p></div></div>
                <div className="retention">{d.retention.map((x: any) => <div className="ret" key={x.snapshot_day}><div><b>D{x.snapshot_day}</b><span>Snapshot</span></div><strong>{pct(x.retention)}</strong><div className="retBar"><i style={{ width: (x.retention == null ? 0 : Math.min(100, x.retention)) + "%" }} /></div></div>)}</div>
                <div className="retHero"><span>D4 retention</span><b>{pct(d.retention.find((x: any) => x.snapshot_day === 4)?.retention)}</b></div>
              </section>
            </div>

            <div className="twoCol">
              <section className="panel"><SectionTitle eyebrow="EXCEPTIONS" title="CEO attention required" sub="Highest-severity financial signals" />{d.attention.length ? d.attention.map((x: any) => <div className="exception" key={x.type + x.id}><span className={"severity " + x.status.toLowerCase()} /><div><b>{x.name}</b><small>{x.type} · {money(x.adjustment)} adjustment · {pct(x.adjustment_pct)}</small></div><strong>{x.status}</strong></div>) : <Empty text="No high-priority exceptions found." />}</section>
              <section className="panel"><SectionTitle eyebrow="IMPACT" title="Top apps by adjustment" sub="Largest financial adjustments first" /><div className="chart mini"><ResponsiveContainer width="100%" height={280}><BarChart data={d.apps.slice(0, 8).map((x: any) => ({ name: x.name.length > 16 ? x.name.slice(0, 16) + "…" : x.name, value: Math.abs(Number(x.adjustment)) }))} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 10 }} /><Tooltip formatter={(v: any) => money(Number(v))} /><Bar dataKey="value" fill="var(--chart)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></section>
            </div>
          </>}

          {section === "revenue" && <>
            <SectionTitle eyebrow="REVENUE INTELLIGENCE" title="Revenue exposure & recovery" sub="Understand how invalid revenue changes from initial detection through later snapshots." />
            <div className="kpis"><KPI label="Initial revenue" value={money(k.initial)} meta="D0 baseline" /><KPI label="Latest revenue" value={money(k.latest)} meta="Latest snapshot" /><KPI label="At risk" value={money(k.revenueAtRisk)} meta="Initial less latest" tone="dangerText" /><KPI label="Adjustment rate" value={pct(k.adjustmentRate)} meta="Portfolio rate" /></div>
            <section className="panel chartPanel"><div className="panelHead"><div><h3>Revenue timeline</h3><p>Compare initial and latest available revenue.</p></div><select value={metric} onChange={(e) => setMetric(e.target.value)}><option value="latest">Latest available</option><option value="initial">Initial (D0)</option></select></div><div className="chart tall"><ResponsiveContainer width="100%" height={420}><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(v: any) => money(Number(v))} /><Line type="monotone" dataKey="value" stroke="var(--chart)" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer></div></section>
          </>}

          {section === "apps" && <><SectionTitle eyebrow="PORTFOLIO" title="Apps" sub="Financial impact across application entities." /><section className="panel"><div className="tableWrap"><table><thead><tr><th>Application</th><th>Initial revenue</th><th>Loss</th><th>Adjustment</th><th>Rate</th><th>Status</th></tr></thead><tbody>{d.apps.map((x: any) => <tr key={x.id}><td><b>{x.name}</b></td><td className="numeric">{money(x.initial)}</td><td className="numeric">{money(x.loss)}</td><td className="numeric">{money(x.adjustment)}</td><td className="numeric">{pct(x.adjustment_pct)}</td><td><span className={"badge " + x.status.toLowerCase()}>{x.status}</span></td></tr>)}</tbody></table></div></section></>}

          {section === "adunits" && <><SectionTitle eyebrow="MONETIZATION" title="Ad Units" sub="Identify ad units driving the highest invalid-revenue impact." /><section className="panel"><div className="tableWrap"><table><thead><tr><th>Ad Unit</th><th>Initial revenue</th><th>Loss</th><th>Adjustment</th><th>Rate</th><th>Status</th></tr></thead><tbody>{d.adUnits.map((x: any) => <tr key={x.id}><td><b>{x.name}</b></td><td className="numeric">{money(x.initial)}</td><td className="numeric">{money(x.loss)}</td><td className="numeric">{money(x.adjustment)}</td><td className="numeric">{pct(x.adjustment_pct)}</td><td><span className={"badge " + x.status.toLowerCase()}>{x.status}</span></td></tr>)}</tbody></table></div></section></>}

          {section === "adjustments" && <><SectionTitle eyebrow="FINANCIAL CONTROL" title="Adjustments" sub="Portfolio-level adjustment intelligence and exposure." /><div className="kpis"><KPI label="Total adjustments" value={money(Number(d.adjustmentIntelligence.total || 0))} meta="Selected period" /><KPI label="Average rate" value={pct(d.adjustmentIntelligence.avg)} meta="Mean adjustment %" /><KPI label="Median rate" value={pct(d.adjustmentIntelligence.median)} meta="Median adjustment %" /><KPI label="Largest adjustment" value={money(Number(d.adjustmentIntelligence.largest || 0))} meta="Single entity" /></div><section className="panel"><SectionTitle eyebrow="RANKING" title="Apps by financial impact" sub="Largest adjustments first" /><div className="tableWrap"><table><thead><tr><th>Application</th><th>Adjustment</th><th>Adjustment rate</th><th>Loss</th><th>Status</th></tr></thead><tbody>{d.apps.slice(0, 25).map((x: any) => <tr key={x.id}><td><b>{x.name}</b></td><td className="numeric">{money(x.adjustment)}</td><td className="numeric">{pct(x.adjustment_pct)}</td><td className="numeric">{money(x.loss)}</td><td><span className={"badge " + x.status.toLowerCase()}>{x.status}</span></td></tr>)}</tbody></table></div></section></>}

          {section === "alerts" && <><SectionTitle eyebrow="RISK MONITOR" title="Alerts" sub="Critical exceptions requiring executive attention." /><section className="panel alertPanel">{d.attention.length ? d.attention.map((x: any) => <div className="alertRow" key={x.type + x.id}><div className="alertIcon">!</div><div><b>{x.name}</b><p>{x.type} has a {pct(x.adjustment_pct)} adjustment impact.</p></div><strong>{money(x.adjustment)}</strong><span className="badge critical">{x.status}</span></div>) : <Empty text="All monitored entities are below the critical threshold." />}</section></>}

          {section === "health" && <><SectionTitle eyebrow="PIPELINE" title="Data Health" sub="Monitor ingestion freshness, processing quality and failures." /><section className="panel"><div className="healthSummary"><div><span>CONNECTION</span><b><i /> Operational</b></div><div><span>RECENT RUNS</span><b>{d.dataHealth.length}</b></div><div><span>FAILURES</span><b>{d.dataHealth.reduce((n: number, x: any) => n + Number(x.records_failed || 0), 0)}</b></div></div>{d.dataHealth.length ? d.dataHealth.map((x: any, i: number) => <div className="run" key={i}><span className={"healthDot " + String(x.status).toLowerCase()} /><div><b>{x.workflow_name || x.source || "Ingestion"}</b><small>{x.source || "Data pipeline"}</small></div><strong>{x.status}</strong><span>{x.records_received ?? 0} received · {x.records_processed ?? 0} processed · {x.records_failed ?? 0} failed</span><time>{x.completed_at ? new Date(x.completed_at).toLocaleString() : "Unavailable"}</time></div>) : <Empty text="No ingestion runs are available." />}</section></>}
        </div>
      </section>
    </main>
  );
}
