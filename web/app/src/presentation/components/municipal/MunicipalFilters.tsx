'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

interface MunicipalFiltersProps {
  uf: string;
  date: string;
  search: string;
  onDateChange: (date: string) => void;
  onSearchChange: (search: string) => void;
  loading: boolean;
  resultCount: number;
}

export function MunicipalFilters({
  uf,
  date,
  search,
  onDateChange,
  onSearchChange,
  loading,
  resultCount,
}: MunicipalFiltersProps) {
  const [inputValue, setInputValue] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const handleInput = (value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(value), 300);
  };

  const handleClear = () => {
    setInputValue('');
    onSearchChange('');
  };

  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-800">
      {/* Busca */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={`Buscar município em ${uf}...`}
          className="w-full rounded-xl bg-slate-800/60 border border-slate-700/50 pl-9 pr-8 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Datepicker */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Data</label>
        <input
          type="date"
          value={date}
          min="2024-12-01"
          max="2024-12-31"
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 [color-scheme:dark]"
        />
      </div>

      {/* Contador */}
      <div className="ml-auto text-xs text-slate-500">
        {loading ? (
          <span className="animate-pulse">Buscando...</span>
        ) : (
          <span>
            {resultCount === 0
              ? 'Nenhum município encontrado'
              : `Exibindo ${resultCount} município${resultCount !== 1 ? 's' : ''}`}
          </span>
        )}
      </div>
    </div>
  );
}
