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
    <header className="fixed top-0 left-0 w-full flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0b1120]/80 backdrop-blur-md z-50 pointer-events-auto">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => nav(0)}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-900/50">
          <Leaf className="w-4 h-4 text-white" strokeWidth={2.6} aria-hidden="true" />
        </div>
        <span className="text-xl font-bold text-white tracking-wide">Skyflora</span>
      </div>

      <nav className="flex items-center gap-8 text-sm font-medium absolute left-1/2 -translate-x-1/2">
        <button onClick={() => nav(0)} className={cls('hero')}>Início</button>
        <button onClick={() => nav(1)} className={cls('climate')}>Clima</button>
        <button onClick={() => nav(2)} className={cls('politics')}>Política</button>
        <button onClick={() => nav(3)} className={cls('co2')}>CO₂</button>
      </nav>

      <div />
    </header>
  );
}
