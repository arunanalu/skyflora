'use client';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';


type Coord = [number, number];
type Ring  = Coord[];
type GeoFeature = {
  properties: { sigla: string };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: Ring[] | Ring[][];
  };
};
type MapState = {
  uf: string;
  d: string;
  centroid: Coord;
};
export type StateAnchor = {
  x: number;
  y: number;
};

// Brazil bounding box — equirectangular projection
// Geographic span: lon 46° × lat 39.5°; corrected aspect ≈ 1.13 (wider than tall)
const LON_MIN = -74.0, LON_MAX = -28.0;
const LAT_MAX =   5.5, LAT_MIN = -34.0;
const VW = 540, VH = 480;

const COMPACT_LABEL_OFFSETS: Record<string, { dx: number; dy: number; fontSize?: number }> = {
  AL: { dx: 30, dy: 1 },
  DF: { dx: 24, dy: -18 },
  ES: { dx: 28, dy: 8 },
  PB: { dx: 31, dy: -8 },
  PE: { dx: 32, dy: 3 },
  RJ: { dx: 27, dy: 18 },
  RN: { dx: 31, dy: -16 },
  SE: { dx: 29, dy: 10 },
};

function project([lon, lat]: Coord): Coord {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * VW;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VH;
  return [x, y];
}

function ringToD(ring: Ring): string {
  const pts = ring.map(c => project(c).join(','));
  return `M ${pts.join(' L ')} Z`;
}

function featureToD(f: GeoFeature): string {
  if (f.geometry.type === 'Polygon') {
    return (f.geometry.coordinates as Ring[]).map(ringToD).join(' ');
  }
  return (f.geometry.coordinates as Ring[][])
    .flatMap(poly => (poly as Ring[]).map(ringToD))
    .join(' ');
}

function centroid(f: GeoFeature): Coord {
  let ring: Ring;
  if (f.geometry.type === 'Polygon') {
    ring = (f.geometry.coordinates as Ring[])[0];
  } else {
    const polys = f.geometry.coordinates as Ring[][];
    ring = polys.reduce((a, b) => (a[0].length > b[0].length ? a : b))[0];
  }
  const avg = ring.reduce(([ax, ay], [x, y]) => [ax + x, ay + y], [0, 0]);
  return project([avg[0] / ring.length, avg[1] / ring.length]);
}

export interface BrazilMapProps {
  getStateColor: (uf: string) => string;
  selectedStateId: string | null;
  onStateClick: (uf: string, anchor: StateAnchor) => void;
  onSelectedStateAnchorChange?: (anchor: StateAnchor) => void;
}

export const BrazilMap = memo(function BrazilMap({ getStateColor, selectedStateId, onStateClick, onSelectedStateAnchorChange }: BrazilMapProps) {
  const isMobile = useIsMobile();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [states, setStates] = useState<MapState[]>([]);
  const [loading, setLoading]   = useState(true);
  const [hovered, setHovered]   = useState<string | null>(null);

  useEffect(() => {
    fetch(
      '/brazil-states.geojson',
    )
      .then(r => r.json())
      .then(geo => {
        const nextStates = ((geo.features ?? []) as GeoFeature[])
          .map(feature => {
            const uf = feature.properties.sigla;
            if (!uf) return null;

            return {
              uf,
              d: featureToD(feature),
              centroid: centroid(feature),
            };
          })
          .filter((state): state is MapState => Boolean(state));

        setStates(nextStates);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getViewportPoint = useCallback((cx: number, cy: number): StateAnchor => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const screenMatrix = svg.getScreenCTM();
    if (!screenMatrix) return { x: 0, y: 0 };

    const point = svg.createSVGPoint();
    point.x = cx;
    point.y = cy;

    const screenPoint = point.matrixTransform(screenMatrix);
    return { x: screenPoint.x, y: screenPoint.y };
  }, []);

  useEffect(() => {
    if (!selectedStateId || !onSelectedStateAnchorChange) return;

    const selectedState = states.find(state => state.uf === selectedStateId);
    if (!selectedState) return;

    const timeoutId = window.setTimeout(() => {
      const [cx, cy] = selectedState.centroid;
      onSelectedStateAnchorChange(getViewportPoint(cx, cy));
    }, 420);

    return () => window.clearTimeout(timeoutId);
  }, [getViewportPoint, selectedStateId, states, onSelectedStateAnchorChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm gap-2">
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
        </svg>
        Carregando mapa...
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VW} ${VH}`}
      className="mx-auto h-full w-[92%] md:w-full"
      style={{ willChange: 'transform' }}
      aria-label="Mapa interativo do Brasil"
      data-skyflora-map="true"
    >
      <g transform={isMobile ? 'translate(26 0)' : undefined}>
        {states.map(({ uf, d, centroid: [cx, cy] }) => {
          const color    = getStateColor(uf);
          const isSel    = selectedStateId === uf;
          const isHov    = hovered === uf;
          const dimmed   = selectedStateId !== null && !isSel;
          const compactLabel = COMPACT_LABEL_OFFSETS[uf];
          const labelX = cx + (compactLabel?.dx ?? 0);
          const labelY = cy + (compactLabel?.dy ?? 0);
          const labelFontSize = compactLabel?.fontSize ?? (isSel ? 11 : 9);

          return (
            <g key={uf}>
              <path
                d={d}
                fill={color}
                fillOpacity={dimmed ? 0.35 : 1}
                stroke="#0f172a"
                strokeWidth={isSel ? 2 : 0.6}
                strokeLinejoin="round"
                style={{
                  cursor: 'pointer',
                  filter: isHov || isSel ? 'brightness(1.25)' : undefined,
                }}
                onClick={() => onStateClick(uf, getViewportPoint(cx, cy))}
                onMouseEnter={() => setHovered(uf)}
                onMouseLeave={() => setHovered(null)}
              />
              {(isSel || isHov) && (
                <>
                  {compactLabel && (
                    <line
                      x1={cx}
                      y1={cy}
                      x2={labelX - 7}
                      y2={labelY}
                      stroke="#e2e8f0"
                      strokeWidth={0.8}
                      strokeOpacity={0.85}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                  <text
                    x={labelX} y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={labelFontSize}
                    fontWeight={700}
                    fill="#f8fafc"
                    stroke="#0f172a"
                    strokeWidth={2.6}
                    paintOrder="stroke"
                    style={{ pointerEvents: 'none' }}
                  >
                    {uf}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
});
