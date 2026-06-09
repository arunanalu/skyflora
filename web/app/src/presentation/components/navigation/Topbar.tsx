'use client';
import { Leaf } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const nav = (idx: number) =>
  window.dispatchEvent(new CustomEvent('skyflora:navigate', { detail: idx }));

export function Topbar() {
  const { category } = useAppStore();

  const cls = (cat: string) =>
    `transition-colors cursor-pointer ${category === cat ? 'text-white font-bold' : 'text-slate-400 hover:text-white'}`;

  return (
    <header className="fixed top-0 left-0 w-full flex items-center justify-between px-4 md:px-8 py-3 md:py-5 border-b border-white/5 bg-[#0b1120]/80 backdrop-blur-md z-50 pointer-events-auto">
      <div className="flex items-center gap-2 md:gap-3 cursor-pointer shrink-0" onClick={() => nav(0)}>
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-400 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-900/50">
          <Leaf className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" strokeWidth={2.6} aria-hidden="true" />
        </div>
        <span className="text-base md:text-xl font-bold text-white tracking-wide">Skyflora</span>
      </div>

      {/* Desktop: centered nav */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium absolute left-1/2 -translate-x-1/2">
        <button onClick={() => nav(0)} className={cls('hero')}>Início</button>
        <button onClick={() => nav(1)} className={cls('climate')}>Clima</button>
        <button onClick={() => nav(2)} className={cls('politics')}>Política</button>
        <button onClick={() => nav(3)} className={cls('co2')}>CO₂</button>
      </nav>

      {/* Mobile: right-aligned nav */}
      <nav className="flex md:hidden items-center gap-4 text-xs font-semibold">
        <button onClick={() => nav(0)} className={cls('hero')}>Início</button>
        <button onClick={() => nav(1)} className={cls('climate')}>Clima</button>
        <button onClick={() => nav(2)} className={cls('politics')}>Política</button>
        <button onClick={() => nav(3)} className={cls('co2')}>CO₂</button>
      </nav>

      <div className="hidden md:block" />
    </header>
  );
}
