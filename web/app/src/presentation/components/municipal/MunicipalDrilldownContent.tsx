'use client';

import { useEffect, useRef, useState } from 'react';
import { MunicipalClimateData } from '../../../domain/entities/MunicipalClimateData';
import { MunicipalFilters } from './MunicipalFilters';
import { MunicipalTable } from './MunicipalTable';

const LIMIT = 20;

interface MunicipalDrilldownContentProps {
  uf: string;
}

export function MunicipalDrilldownContent({ uf }: MunicipalDrilldownContentProps) {
  const [date, setDate] = useState('2024-12-31');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<MunicipalClimateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = async (currentOffset: number, append: boolean) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        uf,
        date,
        search,
        limit: String(LIMIT),
        offset: String(currentOffset),
      });
      const res = await fetch(`/api/climate/municipal?${params}`, { signal: controller.signal });
      if (!res.ok) return;
      const data: MunicipalClimateData[] = await res.json();
      setRows((prev) => append ? [...prev, ...data] : data);
      setHasMore(data.length === LIMIT);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
    } finally {
      setLoading(false);
    }
  };

  // Reset and fetch when uf/date/search changes
  useEffect(() => {
    setOffset(0);
    setRows([]);
    fetchData(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uf, date, search]);

  const handleLoadMore = () => {
    const next = offset + LIMIT;
    setOffset(next);
    fetchData(next, true);
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <MunicipalFilters
        uf={uf}
        date={date}
        search={search}
        onDateChange={(d) => { setDate(d); }}
        onSearchChange={(s) => { setSearch(s); }}
        loading={loading && rows.length === 0}
        resultCount={rows.length}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-4">
        <MunicipalTable data={rows} loading={loading && rows.length === 0} />

        {hasMore && rows.length > 0 && (
          <div className="flex justify-center pt-4 pb-2">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loading}
              className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-6 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Carregando...' : 'Carregar mais'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
