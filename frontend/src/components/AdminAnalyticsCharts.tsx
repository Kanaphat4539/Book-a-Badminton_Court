'use client';

/**
 * Presentation-only analytics charts for the ADMIN view of /dashboard.
 *
 * Every visible string arrives through props (from the Thai/English dictionaries), so this
 * file holds no copy of its own and both languages are guaranteed to come from one source.
 * Coordinates are computed in real pixels from the measured container width instead of
 * stretching a fixed viewBox, which keeps circles round and label text crisp on mobile.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { niceTicks } from '@/lib/dashboard-analytics.cjs';

export type TrendPoint = { key: string; total: number; checkins: number; cancelled: number };

export type TrendChartProps = {
  points: TrendPoint[];
  axisLabels: string[];
  peakIndex: number | null;
  seriesNames: { total: string; checkins: string; cancelled: string };
  peakBadge: string;
  unitLabel: string;
  emptyText: string;
  ariaLabel: string;
  loading: boolean;
  loadingText: string;
};

const PAD = { top: 24, right: 22, bottom: 34, left: 48 };
const HEIGHT = 300;

function formatValue(value: number): string {
  return value.toLocaleString('en-US');
}

function createSmoothPath(points: { x: number; y: number }[]): string {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const controlOffset = (point.x - previous.x) * 0.45;
    return `${path} C ${previous.x + controlOffset} ${previous.y}, ${point.x - controlOffset} ${point.y}, ${point.x} ${point.y}`;
  }, '');
}

function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const apply = (next: number) => setWidth(Math.max(280, Math.round(next)));
    apply(element.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') {
      const onResize = () => apply(element.getBoundingClientRect().width);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) apply(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

export function AdminTrendChart(props: TrendChartProps) {
  const { points, axisLabels, peakIndex, seriesNames, peakBadge, unitLabel, emptyText, ariaLabel, loading, loadingText } = props;
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const innerWidth = Math.max(80, width - PAD.left - PAD.right);
    const innerHeight = HEIGHT - PAD.top - PAD.bottom;
    const peakTotal = points.reduce((max, point) => (point.total > max ? point.total : max), 0);
    const scale = niceTicks(peakTotal, 4);
    const axisMax = Math.max(scale.max, 1);
    const xOf = (index: number) => (points.length <= 1
      ? PAD.left + innerWidth / 2
      : PAD.left + (index / (points.length - 1)) * innerWidth);
    const yOf = (value: number) => PAD.top + innerHeight - (value / axisMax) * innerHeight;
    const toPoints = (pick: (point: TrendPoint) => number) => points.map((point, index) => ({ x: xOf(index), y: yOf(pick(point)) }));
    const totalPoints = toPoints((point) => point.total);
    const checkinPoints = toPoints((point) => point.checkins);
    const totalPath = createSmoothPath(totalPoints);
    const baseline = PAD.top + innerHeight;
    const areaPath = totalPoints.length ? `${totalPath} L ${totalPoints.at(-1)!.x} ${baseline} L ${totalPoints[0].x} ${baseline} Z` : '';
    const labelStep = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerWidth / 62))));
    return { innerWidth, innerHeight, axisMax, ticks: scale.ticks, xOf, yOf, totalPoints, checkinPoints, totalPath, areaPath, baseline, labelStep };
  }, [points, width]);

  const hasData = points.some((point) => point.total > 0);
  const active = hovered !== null && hovered >= 0 && hovered < points.length ? hovered : null;
  const activePoint = active === null ? null : points[active];
  const tooltipX = active === null ? 0 : Math.min(Math.max(geometry.xOf(active), 70), Math.max(70, width - 70));

  const trackHover = (clientX: number, target: HTMLDivElement) => {
    if (points.length === 0) return;
    const rect = target.getBoundingClientRect();
    const ratio = (clientX - rect.left - PAD.left) / Math.max(1, geometry.innerWidth);
    const index = Math.round(ratio * (points.length - 1));
    setHovered(Math.min(points.length - 1, Math.max(0, index)));
  };

  return (
    <div className="relative" data-purpose="trend-chart">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono">
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="w-3.5 h-1.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-400" aria-hidden="true" />
          {seriesNames.total}
        </span>
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="w-3.5 h-0 border-t-2 border-dashed border-emerald-500" aria-hidden="true" />
          {seriesNames.checkins}
        </span>
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" aria-hidden="true" />
          {seriesNames.cancelled}
        </span>
      </div>

      <div ref={ref} className="relative w-full">
        {!hasData ? (
          <div className="grid place-items-center h-[240px] sm:h-[300px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400" role="status">
            {loading ? loadingText : emptyText}
          </div>
        ) : (
          <>
            <svg
              width={width}
              height={HEIGHT}
              role="img"
              aria-label={ariaLabel}
              className="block w-full select-none touch-none"
              onMouseMove={(event) => trackHover(event.clientX, event.currentTarget.parentElement as HTMLDivElement)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={(event) => trackHover(event.touches[0].clientX, event.currentTarget.parentElement as HTMLDivElement)}
              onTouchMove={(event) => trackHover(event.touches[0].clientX, event.currentTarget.parentElement as HTMLDivElement)}
              onTouchEnd={() => setHovered(null)}
            >
              <defs>
                <linearGradient id="adminTrendArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.38" />
                  <stop offset="55%" stopColor="#fb923c" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="adminTrendLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#c2410c" />
                  <stop offset="60%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <filter id="adminTrendGlow" x="-20%" y="-40%" width="140%" height="180%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Horizontal guides with round-number ticks */}
              {geometry.ticks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={PAD.left}
                    x2={PAD.left + geometry.innerWidth}
                    y1={geometry.yOf(tick)}
                    y2={geometry.yOf(tick)}
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="1"
                    strokeDasharray={tick === 0 ? undefined : '4 6'}
                  />
                  <text
                    x={PAD.left - 10}
                    y={geometry.yOf(tick) + 4}
                    textAnchor="end"
                    className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
                  >
                    {formatValue(tick)}
                  </text>
                </g>
              ))}

              {/* Booked slots: gradient area under the smooth curve */}
              <path d={geometry.areaPath} fill="url(#adminTrendArea)" />
              <path
                d={geometry.totalPath}
                fill="none"
                stroke="url(#adminTrendLine)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#adminTrendGlow)"
              />

              {/* Verified check-ins: dashed comparison line */}
              <path
                d={createSmoothPath(geometry.checkinPoints)}
                fill="none"
                className="stroke-emerald-500"
                strokeWidth="2"
                strokeDasharray="6 5"
                strokeLinecap="round"
              />

              {/* Cancelled slots marked on the baseline */}
              {points.map((point, index) => (point.cancelled > 0 ? (
                <circle
                  key={`cancelled-${point.key}`}
                  cx={geometry.xOf(index)}
                  cy={geometry.baseline}
                  r="3.5"
                  className="fill-rose-500/80"
                />
              ) : null))}

              {/* Points */}
              {points.map((point, index) => {
                const isPeak = index === peakIndex && point.total > 0;
                const isActive = index === active;
                return (
                  <circle
                    key={`point-${point.key}`}
                    cx={geometry.xOf(index)}
                    cy={geometry.yOf(point.total)}
                    r={isPeak || isActive ? 6 : 3.5}
                    className={`${isPeak ? 'fill-orange-600 ' : 'fill-white dark:fill-slate-900 '}stroke-orange-500`}
                    strokeWidth={isPeak || isActive ? 3 : 2}
                  >
                    <title>{`${axisLabels[index] ?? point.key}: ${point.total} ${unitLabel}`}</title>
                  </circle>
                );
              })}

              {/* Hover guide */}
              {active !== null && (
                <g pointerEvents="none">
                  <line
                    x1={geometry.xOf(active)}
                    x2={geometry.xOf(active)}
                    y1={PAD.top}
                    y2={geometry.baseline}
                    className="stroke-orange-400/70"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                </g>
              )}

              {/* X axis labels */}
              {points.map((point, index) => {
                const show = index % geometry.labelStep === 0 || index === points.length - 1 || index === peakIndex;
                if (!show) return null;
                return (
                  <text
                    key={`label-${point.key}`}
                    x={geometry.xOf(index)}
                    y={geometry.baseline + 20}
                    textAnchor="middle"
                    className={index === peakIndex ? 'fill-orange-600 dark:fill-orange-400 text-[10px] font-mono font-bold' : 'fill-slate-500 dark:fill-slate-400 text-[10px] font-mono'}
                  >
                    {axisLabels[index] ?? point.key}
                  </text>
                );
              })}
            </svg>

            {activePoint && (
              <div
                className="pointer-events-none absolute top-1 z-20 -translate-x-1/2 rounded-xl border border-orange-300 dark:border-orange-500/40 bg-white/95 dark:bg-slate-900/95 p-2.5 shadow-lg backdrop-blur-md"
                style={{ left: tooltipX }}
                role="status"
              >
                <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-orange-600 dark:text-orange-400">
                  {axisLabels[active!] ?? activePoint.key}
                  {active !== null && active === peakIndex && (
                    <span className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-500/20 text-[10px]">{peakBadge}</span>
                  )}
                </div>
                <dl className="mt-1.5 space-y-0.5 text-[11px] font-mono">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-orange-500" aria-hidden="true" />
                      {seriesNames.total}
                    </dt>
                    <dd className="font-bold text-slate-900 dark:text-white">{formatValue(activePoint.total)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                      {seriesNames.checkins}
                    </dt>
                    <dd className="font-bold text-slate-900 dark:text-white">{formatValue(activePoint.checkins)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-rose-500" aria-hidden="true" />
                      {seriesNames.cancelled}
                    </dt>
                    <dd className="font-bold text-slate-900 dark:text-white">{formatValue(activePoint.cancelled)}</dd>
                  </div>
                </dl>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export type BreakdownRow = { key: string; label: string; count: number; share: number; color: string };

export type BreakdownPanelProps = {
  rows: BreakdownRow[];
  total: number;
  totalLabel: string;
  emptyText: string;
  unitLabel: string;
};

/** Arc lengths for the donut, computed outside the render body so nothing mutates during render. */
function donutSegments(rows: BreakdownRow[], total: number, circumference: number) {
  const segments: Array<BreakdownRow & { dash: string; offset: number }> = [];
  let consumed = 0;
  for (const row of rows) {
    if (row.count <= 0) continue;
    const length = total > 0 ? (row.count / total) * circumference : 0;
    segments.push({ ...row, dash: `${length} ${circumference - length}`, offset: -consumed });
    consumed += length;
  }
  return segments;
}

export function AdminUsageBars(props: BreakdownPanelProps) {
  const { rows, totalLabel, total, emptyText, unitLabel } = props;
  const max = rows.reduce((best, row) => (row.count > best ? row.count : best), 0);

  return (
    <div className="flex h-full flex-col gap-3" data-purpose="court-usage-bars">
      <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
        {totalLabel}: <span className="font-bold text-slate-800 dark:text-slate-200">{formatValue(total)}</span>
      </p>
      {max === 0 ? (
        <p className="grid flex-1 place-items-center text-sm text-slate-500 dark:text-slate-400" role="status">{emptyText}</p>
      ) : (
        <ul className="flex flex-1 flex-col justify-center gap-3">
          {rows.map((row) => (
            <li key={row.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{row.label}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {formatValue(row.count)} {unitLabel}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(row.count > 0 ? 4 : 0, Math.round((row.count / max) * 100))}%`, backgroundColor: row.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminStatusDonut(props: BreakdownPanelProps) {
  const { rows, total, totalLabel, emptyText, unitLabel } = props;
  const circumference = 100;
  const segments = donutSegments(rows, total, circumference);

  return (
    <div className="flex h-full flex-col items-center gap-3" data-purpose="status-donut">
      {total === 0 ? (
        <p className="grid flex-1 place-items-center text-sm text-slate-500 dark:text-slate-400" role="status">{emptyText}</p>
      ) : (
        <>
          <svg viewBox="0 0 42 42" className="h-36 w-36 -rotate-90" role="img" aria-label={`${totalLabel}: ${formatValue(total)}`}>
            <circle cx="21" cy="21" r="15.9155" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="4.5" />
            {segments.map((segment) => (
              <circle
                key={segment.key}
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                stroke={segment.color}
                strokeWidth="4.5"
                strokeDasharray={segment.dash}
                strokeDashoffset={segment.offset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <ul className="w-full space-y-1.5">
            {rows.map((row) => (
              <li key={row.key} className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} aria-hidden="true" />
                  {row.label}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatValue(row.count)}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {totalLabel}: <span className="font-bold text-slate-800 dark:text-slate-200">{formatValue(total)}</span> {unitLabel}
          </p>
        </>
      )}
    </div>
  );
}
