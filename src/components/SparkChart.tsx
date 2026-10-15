function domain(values: number[]): { lo: number; hi: number } {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo === hi) {
    return { lo: lo - 1, hi: hi + 1 };
  }
  const pad = (hi - lo) * 0.12;
  return { lo: lo - pad, hi: hi + pad };
}

function formatReading(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function SparkChart({
  label,
  unit,
  values,
  rangeLabel,
  tone,
}: {
  label: string;
  unit: string;
  values: number[];
  rangeLabel: string;
  tone: 'speed' | 'battery' | 'altitude';
}) {
  const width = 320;
  const height = 120;
  const padX = 36;
  const padTop = 12;
  const padBottom = 18;

  if (values.length < 2) {
    return (
      <figure className={`chart chart--${tone}`}>
        <figcaption>
          <span>
            {label} ({unit})
          </span>
          <strong>—</strong>
        </figcaption>
        <p className="chart__empty">No samples</p>
      </figure>
    );
  }

  const { lo, hi } = domain(values);
  const span = hi - lo || 1;
  const latest = values[values.length - 1] ?? 0;
  const dataLo = Math.min(...values);
  const dataHi = Math.max(...values);
  const coords = values.map((value, index) => {
    const x = padX + (index / (values.length - 1)) * (width - padX - 8);
    const y = padTop + (1 - (value - lo) / span) * (height - padTop - padBottom);
    return [x, y] as const;
  });
  const line = coords
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const last = coords[coords.length - 1] ?? [padX, height];
  const first = coords[0] ?? [padX, height];
  const baseline = height - padBottom;
  const area = `${line} L${last[0].toFixed(1)} ${baseline} L${first[0].toFixed(1)} ${baseline} Z`;

  return (
    <figure className={`chart chart--${tone}`}>
      <figcaption>
        <span>
          {label} ({unit})
        </span>
        <strong>
          {formatReading(latest)} {unit}
        </strong>
      </figcaption>
      <svg
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        aria-label={`${label} in ${unit}, ${rangeLabel}, latest ${formatReading(latest)}`}
      >
        <text className="chart__scale" x="4" y="14">
          {Math.round(dataHi)}
        </text>
        <text className="chart__scale" x="4" y={height - 6}>
          {Math.round(dataLo)}
        </text>
        <path className="chart__area" d={area} />
        <path className="chart__line" d={line} />
      </svg>
      <p className="chart__range">{rangeLabel}</p>
    </figure>
  );
}
