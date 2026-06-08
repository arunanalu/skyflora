import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown, Leaf, Thermometer, Wind, Mountain, Flame, Droplets, Cloud,
  Scale, CheckCircle2, XCircle, Factory, ChevronDown, Table as TableIcon,
  MapIcon, X, ArrowRight, Calendar, ChevronRight
} from "lucide-react";
import { STATES, MUNICIPALITIES, DEPUTIES, type StateRow } from "@/lib/skyflora-data";
import { BrazilTileMap } from "@/components/skyflora/BrazilTileMap";
import { useActiveSection } from "@/hooks/use-active-section";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skyflora — Ciência climática e impacto político" },
      { name: "description", content: "Skyflora funde dados climáticos, legislativos e emissões de CO2 num único ecossistema visual interativo do Brasil." },
      { property: "og:title", content: "Skyflora — Ciência climática e impacto político" },
      { property: "og:description", content: "A ciência do clima e o impacto político num só ecossistema." },
    ],
  }),
  component: Skyflora,
});

const SECTIONS = [
  { id: "hero", label: "Início" },
  { id: "clima", label: "Clima" },
  { id: "politica", label: "Política" },
  { id: "co2", label: "CO₂" },
  { id: "tabela", label: "Tabela" },
  { id: "estado", label: "Estado" },
  { id: "municipios", label: "Municípios" },
];

type ClimaMetric = "tempMax" | "tempAvg" | "pm25" | "co2" | "vegetation" | "fires";

function Skyflora() {
  const active = useActiveSection(SECTIONS.map(s => s.id));
  const [timeScale, setTimeScale] = useState<"month" | "year">("month");
  const [period, setPeriod] = useState(8); // 0-11 month index OR 0-N year
  const [climaMetric, setClimaMetric] = useState<ClimaMetric>("tempMax");
  const [polMetric, setPolMetric] = useState<"propsBenefit" | "approved" | "politicsScore">("politicsScore");
  const [co2Metric, setCo2Metric] = useState<"co2" | "fires">("co2");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [drillState, setDrillState] = useState<string | null>(null);

  // CO2 forces year-only
  const co2Active = active === "co2";
  const effectiveScale = co2Active ? "year" : timeScale;

  const sidebarConfig = useMemo(() => {
    if (active === "politica") return "politica";
    if (active === "co2") return "co2";
    if (active === "tabela" || active === "estado" || active === "municipios") return "clima";
    return "clima";
  }, [active]);

  const handleSelectState = (uf: string) => {
    setSelectedState(uf);
    requestAnimationFrame(() => {
      document.getElementById("estado")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const ranking = useMemo(
    () => [...STATES].sort((a, b) => b.insalubrity - a.insalubrity).slice(0, 5),
    []
  );

  return (
    <div className="min-h-screen text-foreground">
      {/* Top minimal nav */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between px-6 py-3">
          <a href="#hero" className="flex items-center gap-2">
            <div className="relative h-7 w-7 rounded-full bg-gradient-to-br from-[color:var(--sky)] to-[color:var(--flora)]">
              <Leaf className="absolute inset-0 m-auto h-4 w-4 text-background" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">Skyflora</span>
          </a>
          <nav className="hidden md:flex items-center gap-1 text-xs">
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`}
                className={`px-3 py-1.5 rounded-full transition-all ${active === s.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                {s.label}
              </a>
            ))}
          </nav>
          <div className="text-xs text-muted-foreground hidden sm:block">v1.0 · dados de demonstração</div>
        </div>
      </header>

      {/* Sticky sidebar (filters) — only visible after hero */}
      <AnimatePresence>
        {active !== "hero" && (
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block"
          >
            <Sidebar config={sidebarConfig} climaMetric={climaMetric} setClimaMetric={setClimaMetric}
              polMetric={polMetric} setPolMetric={setPolMetric} co2Metric={co2Metric} setCo2Metric={setCo2Metric} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Bottom temporal controller */}
      <AnimatePresence>
        {active !== "hero" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40"
          >
            <TimeBar scale={effectiveScale} setScale={(s: "month" | "year") => !co2Active && setTimeScale(s)} period={period} setPeriod={setPeriod} locked={co2Active} />
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <Hero />
        <ClimaSection metric={climaMetric} onSelectState={handleSelectState} ranking={ranking} />
        <PoliticaSection metric={polMetric} />
        <Co2Section metric={co2Metric} />
        <TabelaSection metric={climaMetric} />
        <EstadoSection uf={selectedState} onClose={() => setSelectedState(null)} onDrill={(uf) => {
          setDrillState(uf);
          requestAnimationFrame(() => document.getElementById("municipios")?.scrollIntoView({ behavior: "smooth" }));
        }} />
        <MunicipiosSection uf={drillState ?? selectedState ?? "AM"} />
        <Footer />
      </main>
    </div>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Abstract animated currents */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-[40rem] w-[40rem] rounded-full bg-[color:var(--flora)]/15 blur-3xl animate-drift" />
        <div className="absolute bottom-1/4 right-1/4 h-[36rem] w-[36rem] rounded-full bg-[color:var(--sky)]/20 blur-3xl animate-drift" style={{ animationDelay: "-6s" }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 1200 800" preserveAspectRatio="none">
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={i} d={`M-100 ${100 + i * 60} Q 300 ${50 + i * 60} 600 ${120 + i * 60} T 1300 ${100 + i * 60}`}
              fill="none" stroke="currentColor" strokeWidth="1" />
          ))}
        </svg>
      </div>

      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--flora)] animate-pulse-soft" />
          Observatório climático-político · Brasil
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-5xl sm:text-6xl md:text-7xl font-medium leading-[1.05] text-balance">
          A ciência do <span className="italic text-[color:var(--flora-deep)]">clima</span> e o impacto <span className="italic text-[color:var(--sky)]">político</span><br />num só ecossistema.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground text-balance">
          Skyflora funde dados climáticos, legislativos e emissões de CO₂ em uma única visualização interativa — para que cada decisão seja informada pelo solo, pelo ar e pela urna.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-12 flex justify-center">
          <a href="#clima" className="group inline-flex flex-col items-center gap-3">
            <div className="relative inline-flex items-center gap-3 rounded-full bg-foreground text-background px-7 py-4 text-sm font-medium shadow-xl transition-transform group-hover:scale-[1.02]">
              Explorar os dados
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground animate-float-slow">scroll</span>
          </a>
        </motion.div>

        <div className="mt-20 grid grid-cols-3 max-w-2xl mx-auto gap-6 text-center">
          {[
            { n: "27", l: "Estados monitorados" },
            { n: "5,5k+", l: "Municípios indexados" },
            { n: "12", l: "Indicadores climáticos" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-3xl">{s.n}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- SIDEBAR ---------- */
function Sidebar({ config, climaMetric, setClimaMetric, polMetric, setPolMetric, co2Metric, setCo2Metric }: any) {
  return (
    <motion.div layout className="glass-strong rounded-2xl p-4 w-64 shadow-2xl">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3 px-1">Filtros dinâmicos</div>
      <AnimatePresence mode="wait">
        <motion.div key={config} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {config === "clima" && (
            <div className="space-y-1">
              <FilterGroup icon={<Thermometer className="h-3.5 w-3.5" />} label="Temperatura" defaultOpen
                items={[
                  { id: "tempMax", label: "Máxima" },
                  { id: "tempAvg", label: "Média" },
                  { id: "tempAvg", label: "Mínima" },
                ]} value={climaMetric} onChange={setClimaMetric} />
              <FilterGroup icon={<Wind className="h-3.5 w-3.5" />} label="Atmosfera"
                items={[
                  { id: "pm25", label: "Part. Inaláveis" },
                  { id: "pm25", label: "Part. Finas" },
                  { id: "co2", label: "CO₂" },
                  { id: "tempAvg", label: "Cob. de Nuvens" },
                ]} value={climaMetric} onChange={setClimaMetric} />
              <FilterGroup icon={<Mountain className="h-3.5 w-3.5" />} label="Solo"
                items={[
                  { id: "vegetation", label: "Cob. Vegetal" },
                  { id: "fires", label: "Focos de Queimadas" },
                  { id: "vegetation", label: "Stresse Hídrico" },
                  { id: "vegetation", label: "Perda de Água" },
                ]} value={climaMetric} onChange={setClimaMetric} />
            </div>
          )}
          {config === "politica" && (
            <div className="space-y-1">
              <FilterGroup icon={<Scale className="h-3.5 w-3.5" />} label="Propostas" defaultOpen
                items={[
                  { id: "politicsScore", label: "Benéficas vs. Maléficas" },
                  { id: "propsBenefit", label: "Apenas benéficas" },
                ]} value={polMetric} onChange={setPolMetric} />
              <FilterGroup icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Aprovadas"
                items={[
                  { id: "approved", label: "Aprovadas" },
                  { id: "approved", label: "Rejeitadas" },
                ]} value={polMetric} onChange={setPolMetric} />
            </div>
          )}
          {config === "co2" && (
            <div className="space-y-1">
              <FilterGroup icon={<Cloud className="h-3.5 w-3.5" />} label="Emissão" defaultOpen
                items={[
                  { id: "co2", label: "Média por Estado" },
                  { id: "fires", label: "Principais Poluidores" },
                ]} value={co2Metric} onChange={setCo2Metric} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function FilterGroup({ icon, label, items, value, onChange, defaultOpen = false }: any) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg overflow-hidden">
      <button onClick={() => setOpen((o: boolean) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted/60 transition">
        <span className="flex items-center gap-2">{icon} {label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <ul className="pb-2 pl-9 pr-2 space-y-0.5">
              {items.map((it: any, i: number) => (
                <li key={i}>
                  <button onClick={() => onChange(it.id)}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded-md transition flex items-center gap-2 ${value === it.id ? "bg-foreground text-background" : "hover:bg-muted/60 text-muted-foreground"}`}>
                    <span className={`h-1 w-1 rounded-full ${value === it.id ? "bg-background" : "bg-muted-foreground/50"}`} />
                    {it.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- TIME BAR ---------- */
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const YEARS = ["2019", "2020", "2021", "2022", "2023", "2024", "2025"];
function TimeBar({ scale, setScale, period, setPeriod, locked }: any) {
  const items = scale === "month" ? MONTHS : YEARS;
  return (
    <div className="glass-strong rounded-full pl-2 pr-3 py-2 flex items-center gap-2 shadow-2xl">
      <div className="flex items-center gap-1 bg-muted/60 rounded-full p-0.5">
        <button onClick={() => setScale("month")} disabled={locked}
          className={`px-3 py-1 text-xs rounded-full transition ${scale === "month" ? "bg-background shadow" : "text-muted-foreground"} ${locked ? "opacity-40 cursor-not-allowed" : ""}`}>
          Meses
        </button>
        <button onClick={() => setScale("year")}
          className={`px-3 py-1 text-xs rounded-full transition ${scale === "year" ? "bg-background shadow" : "text-muted-foreground"}`}>
          Anos
        </button>
      </div>
      <Calendar className="h-3.5 w-3.5 text-muted-foreground ml-1" />
      <div className="flex items-center gap-0.5 max-w-[420px] overflow-x-auto scrollbar-hide">
        {items.map((m, i) => (
          <button key={m + i} onClick={() => setPeriod(i)}
            className={`px-2.5 py-1 text-[11px] rounded-full whitespace-nowrap transition ${i === period ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
            {m}
          </button>
        ))}
      </div>
      {locked && <span className="text-[10px] text-muted-foreground italic ml-1">escala anual</span>}
    </div>
  );
}

/* ---------- SECTION SHELL ---------- */
function SectionShell({ id, eyebrow, title, subtitle, children }: any) {
  return (
    <section id={id} className="relative min-h-screen py-28 lg:pl-72 lg:pr-12 px-6 flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--flora-deep)] mb-3">{eyebrow}</div>
          <h2 className="font-display text-4xl md:text-5xl font-medium text-balance">{title}</h2>
          {subtitle && <p className="mt-3 text-muted-foreground max-w-2xl">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

/* ---------- CLIMA ---------- */
function ClimaSection({ metric, onSelectState, ranking }: { metric: ClimaMetric; onSelectState: (uf: string) => void; ranking: StateRow[] }) {
  return (
    <SectionShell id="clima" eyebrow="01 · Dados climáticos"
      title="O pulso térmico e atmosférico do território"
      subtitle="Heatmap nacional por estado. Selecione um indicador no painel à esquerda e ajuste o tempo no controlador inferior.">
      <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
        <div className="glass rounded-3xl p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapIcon className="h-3.5 w-3.5" /> Mapa interativo · {metricLabel(metric)}
            </div>
            <a href="#tabela" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-foreground hover:text-background transition">
              <TableIcon className="h-3 w-3" /> Alternar para tabela
            </a>
          </div>
          <BrazilTileMap metric={metric} colorMode="thermal" onSelect={onSelectState} />
          <Legend mode="thermal" leftLabel="baixo" rightLabel="alto" />
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Ranking de Insalubridade</div>
          <ol className="space-y-2">
            {ranking.map((s, i) => (
              <li key={s.uf} className="flex items-center gap-3 group cursor-pointer" onClick={() => onSelectState(s.uf)}>
                <div className="font-display text-2xl text-muted-foreground w-6">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="h-1.5 mt-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.insalubrity}%`, background: "linear-gradient(90deg, var(--sky), var(--alert))" }} />
                  </div>
                </div>
                <div className="text-sm tabular-nums">{s.insalubrity}</div>
              </li>
            ))}
          </ol>
          <div className="mt-5 pt-5 border-t flex items-center gap-2 text-[11px] text-muted-foreground">
            <Droplets className="h-3 w-3" /> índice composto · 0–100
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function metricLabel(m: ClimaMetric) {
  return ({ tempMax: "Temperatura Máxima (°C)", tempAvg: "Temperatura Média (°C)", pm25: "Partículas Finas (µg/m³)", co2: "CO₂ (Mt/ano)", vegetation: "Cobertura Vegetal (%)", fires: "Focos de Queimadas" } as const)[m];
}

function Legend({ mode, leftLabel, rightLabel }: { mode: "thermal" | "politics" | "co2"; leftLabel: string; rightLabel: string }) {
  const gradient = mode === "thermal"
    ? "linear-gradient(90deg, var(--sky), var(--alert))"
    : mode === "politics"
    ? "linear-gradient(90deg, var(--destructive), var(--flora))"
    : "linear-gradient(90deg, var(--muted), var(--slate-deep))";
  return (
    <div className="mt-5 flex items-center gap-3 text-[11px] text-muted-foreground">
      <span>{leftLabel}</span>
      <div className="h-1.5 flex-1 rounded-full" style={{ background: gradient }} />
      <span>{rightLabel}</span>
    </div>
  );
}

/* ---------- POLITICA ---------- */
function PoliticaSection({ metric }: { metric: "propsBenefit" | "approved" | "politicsScore" }) {
  const totals = useMemo(() => {
    const benefit = STATES.reduce((a, s) => a + s.propsBenefit, 0);
    const harm = STATES.reduce((a, s) => a + s.propsHarm, 0);
    const approved = STATES.reduce((a, s) => a + s.approved, 0);
    const rejected = STATES.reduce((a, s) => a + s.rejected, 0);
    return { benefit, harm, approved, rejected };
  }, []);
  return (
    <SectionShell id="politica" eyebrow="02 · Política ambiental"
      title="O mapa político do verde e da pressão"
      subtitle="Cada estado é colorido pela balança entre propostas benéficas e maléficas ao ambiente.">
      <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Scale className="h-3.5 w-3.5" /> Saldo de propostas · benéficas − maléficas
          </div>
          <BrazilTileMap metric={metric} colorMode="politics" showCounters />
          <Legend mode="politics" leftLabel="maléficas" rightLabel="benéficas" />
        </div>
        <div className="space-y-4">
          <StatCard icon={<Leaf className="h-4 w-4 text-[color:var(--flora-deep)]" />} label="Propostas benéficas" value={totals.benefit} accent="flora" />
          <StatCard icon={<Flame className="h-4 w-4 text-[color:var(--alert)]" />} label="Propostas maléficas" value={totals.harm} accent="alert" />
          <div className="glass rounded-2xl p-4">
            <div className="text-xs text-muted-foreground mb-3 uppercase tracking-[0.18em]">Aprovação</div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs"><CheckCircle2 className="h-3 w-3 text-[color:var(--flora)]" /> Aprovadas</div>
                <div className="font-display text-3xl mt-1">{totals.approved}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs"><XCircle className="h-3 w-3 text-destructive" /> Rejeitadas</div>
                <div className="font-display text-3xl mt-1">{totals.rejected}</div>
              </div>
            </div>
            <div className="h-1.5 mt-4 rounded-full bg-muted overflow-hidden flex">
              <div className="h-full bg-[color:var(--flora)]" style={{ width: `${(totals.approved / (totals.approved + totals.rejected)) * 100}%` }} />
              <div className="h-full bg-destructive/70 flex-1" />
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function StatCard({ icon, label, value, accent }: any) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon} {label}</div>
      <div className="font-display text-3xl mt-2 tabular-nums">{value}</div>
    </div>
  );
}

/* ---------- CO2 ---------- */
function Co2Section({ metric }: { metric: "co2" | "fires" }) {
  const top = useMemo(() => [...STATES].sort((a, b) => b.co2 - a.co2).slice(0, 6), []);
  return (
    <SectionShell id="co2" eyebrow="03 · Emissão de CO₂"
      title="A pegada anual, estado por estado"
      subtitle="Visão consolidada em escala anual. O controlador temporal alterna para a granularidade de Anos automaticamente.">
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Factory className="h-3.5 w-3.5" /> {metric === "co2" ? "Emissão média anual (Mt CO₂)" : "Concentração de focos industriais"}
          </div>
          <BrazilTileMap metric={metric} colorMode="co2" showCounters />
          <Legend mode="co2" leftLabel="menor" rightLabel="maior" />
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Principais poluidores</div>
          <ul className="space-y-3">
            {top.map((s, i) => (
              <li key={s.uf} className="flex items-center gap-3">
                <div className="text-xs tabular-nums w-5 text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{s.name}</span>
                    <span className="tabular-nums text-muted-foreground">{s.co2} Mt</span>
                  </div>
                  <div className="h-1.5 mt-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-[color:var(--slate-deep)]" style={{ width: `${(s.co2 / top[0].co2) * 100}%` }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}

/* ---------- TABELA ---------- */
function TabelaSection({ metric }: { metric: ClimaMetric }) {
  const rows = useMemo(() => [...STATES].sort((a, b) => (b[metric] as number) - (a[metric] as number)), [metric]);
  const max = Math.max(...rows.map(r => r[metric] as number));
  return (
    <SectionShell id="tabela" eyebrow="04 · Tabela nacional"
      title="Os 27 estados, listados e comparáveis"
      subtitle="Visão tabular completa, ordenada e rolável. Mesmo conjunto de filtros, leitura linear.">
      <div className="glass rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="text-sm">Indicador: <span className="font-medium">{metricLabel(metric)}</span></div>
          <a href="#clima" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-foreground hover:text-background transition">
            <MapIcon className="h-3 w-3" /> Voltar ao mapa
          </a>
        </div>
        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background/95 backdrop-blur z-10">
              <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-6 py-3 w-12">#</th>
                <th className="px-2 py-3">Estado</th>
                <th className="px-2 py-3 w-24">UF</th>
                <th className="px-2 py-3 w-32 text-right">Valor</th>
                <th className="px-6 py-3 w-[40%]">Comparação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => {
                const v = s[metric] as number;
                return (
                  <tr key={s.uf} className="border-t hover:bg-muted/30 transition">
                    <td className="px-6 py-3 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-2 py-3 font-medium">{s.name}</td>
                    <td className="px-2 py-3 text-muted-foreground">{s.uf}</td>
                    <td className="px-2 py-3 text-right tabular-nums font-medium">{v}</td>
                    <td className="px-6 py-3">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: "linear-gradient(90deg, var(--sky), var(--flora))" }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </SectionShell>
  );
}

/* ---------- ESTADO (selected modal) ---------- */
function EstadoSection({ uf, onClose, onDrill }: { uf: string | null; onClose: () => void; onDrill: (uf: string) => void }) {
  const state = uf ? STATES.find(s => s.uf === uf) : null;
  return (
    <SectionShell id="estado" eyebrow="05 · Estado selecionado"
      title={state ? `Foco em ${state.name}` : "Selecione um estado no mapa climático"}
      subtitle="O mapa esmaece, o estado se aproxima. Indicadores rápidos para uma leitura instantânea do contexto.">
      <div className="relative glass rounded-3xl p-6 min-h-[480px]">
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-center">
          <div className="opacity-40">
            <BrazilTileMap metric="tempMax" colorMode="thermal" selected={uf} showLabels={false} />
          </div>
          <AnimatePresence mode="wait">
            {state ? (
              <motion.div key={state.uf} initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20 }}
                className="glass-strong rounded-2xl p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-3 right-3 h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center">
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[color:var(--flora)] to-[color:var(--sky)] grid place-items-center text-background font-display text-sm">
                    {state.uf}
                  </div>
                  <div>
                    <div className="font-display text-2xl">{state.name}</div>
                    <div className="text-xs text-muted-foreground">Atualizado · Set 2025</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <Mini label="Temp. máx." value={`${state.tempMax}°C`} />
                  <Mini label="PM 2.5" value={`${state.pm25} µg/m³`} />
                  <Mini label="Vegetação" value={`${state.vegetation}%`} />
                  <Mini label="Focos de fogo" value={state.fires.toLocaleString()} />
                </div>
                <div className="mt-5 p-3 rounded-xl bg-muted/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Índice de insalubridade</span>
                    <span className="font-medium tabular-nums">{state.insalubrity}/100</span>
                  </div>
                  <div className="h-1.5 mt-2 rounded-full bg-background overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${state.insalubrity}%`, background: "linear-gradient(90deg, var(--sky), var(--alert))" }} />
                  </div>
                </div>
                <button onClick={() => onDrill(state.uf)}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-4 py-3 text-sm font-medium hover:opacity-90 transition">
                  Ver detalhes dos municípios <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            ) : (
              <div className="glass-strong rounded-2xl p-8 text-center text-muted-foreground text-sm">
                Volte à secção <a href="#clima" className="underline">Clima</a> e clique em qualquer estado do mapa para ver o detalhe aqui.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SectionShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="font-display text-xl mt-1">{value}</div>
    </div>
  );
}

/* ---------- MUNICÍPIOS ---------- */
function MunicipiosSection({ uf }: { uf: string }) {
  const state = STATES.find(s => s.uf === uf) ?? STATES[0];
  const munis = MUNICIPALITIES[uf] ?? MUNICIPALITIES.AM;
  const dep = DEPUTIES[uf] ?? DEPUTIES.AM;
  return (
    <SectionShell id="municipios" eyebrow="06 · Drill-down municipal"
      title={`Dentro de ${state.name}`}
      subtitle="Granularidade municipal: cada cidade, sua temperatura, seu ar, seu risco — e os deputados que decidem por ela.">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Municípios · clima local</div>
            <span className="text-[11px] text-muted-foreground">{munis.length} listados</span>
          </div>
          <div className="space-y-2">
            {munis.map((m) => (
              <motion.div key={m.name} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/40 transition group">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{m.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition" />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-3 text-[11px]">
                    <Bar label="Temp" value={m.temp} max={40} accent="alert" suffix="°" />
                    <Bar label="PM2.5" value={m.pm25} max={70} accent="sky" />
                    <Bar label="Veget." value={m.vegetation} max={100} accent="flora" suffix="%" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-4">Deputados · propostas ambientais</div>
          <ul className="space-y-3">
            {dep.map((d) => (
              <li key={d.name} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                <div className="h-10 w-10 rounded-full bg-muted grid place-items-center text-xs font-medium">
                  {d.name.split(" ").map(p => p[0]).join("")}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground">{d.party} · {d.proposals} propostas votadas</div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full ${d.impact === "benéfico" ? "bg-[color:var(--flora)]/15 text-[color:var(--flora-deep)]" : "bg-destructive/15 text-destructive"}`}>
                  {d.impact}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-[color:var(--flora)]/10 to-[color:var(--sky)]/10 text-xs text-muted-foreground">
            Cada tag colorida traduz o impacto agregado das propostas — verde para benéfico ao ambiente, vermelho para maléfico.
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function Bar({ label, value, max, accent, suffix = "" }: { label: string; value: number; max: number; accent: "alert" | "sky" | "flora"; suffix?: string }) {
  const color = accent === "alert" ? "var(--alert)" : accent === "sky" ? "var(--sky)" : "var(--flora)";
  return (
    <div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums text-foreground">{value}{suffix}</span>
      </div>
      <div className="h-1 mt-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

/* ---------- FOOTER ---------- */
function Footer() {
  return (
    <footer className="border-t mt-12">
      <div className="mx-auto max-w-6xl px-6 py-12 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2 font-display text-lg">
            <Leaf className="h-4 w-4 text-[color:var(--flora-deep)]" /> Skyflora
          </div>
          <p className="mt-3 text-muted-foreground text-xs leading-relaxed">
            Um observatório aberto que cruza ciência climática, política ambiental e emissões — para informar decisões com dados, não com ruído.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          <div className="uppercase tracking-[0.18em] mb-3">Fontes</div>
          INMET · INPE · MapBiomas · Câmara dos Deputados · SEEG
        </div>
        <div className="text-xs text-muted-foreground">
          <div className="uppercase tracking-[0.18em] mb-3">Aviso</div>
          Os números nesta página são uma amostra de demonstração para fins de design.
        </div>
      </div>
      <div className="text-center text-[11px] text-muted-foreground pb-8">© 2026 Skyflora · ecossistema de dados</div>
    </footer>
  );
}
