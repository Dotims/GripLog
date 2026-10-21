import { scalePoints, toPath } from "../lib/chart";

type LineChartProps = {
  values: number[];
  labels: string[];
  format: (value: number) => string;
  height?: number;
};

const WIDTH = 640;

export function LineChart({ values, labels, format, height = 220 }: LineChartProps) {
  if (values.length === 0) return <p className="meta">Nothing logged yet.</p>;
  const points = scalePoints(values, WIDTH, height);
  const last = points.at(-1)!;
  const first = points[0]!;

  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} width="100%" role="img" aria-label="Progress chart">
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff4757" stopOpacity={0.28} />
            <stop offset="1" stopColor="#ff4757" stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={WIDTH}
            y1={height * f}
            y2={height * f}
            stroke="rgba(255,255,255,0.07)"
          />
        ))}
        <path
          d={`${toPath(points)} L${last.x},${height} L${first.x},${height} Z`}
          fill="url(#area)"
        />
        <path
          d={toPath(points)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={10} fill="transparent">
            <title>{`${labels[i]}: ${format(values[i]!)}`}</title>
          </circle>
        ))}
        <circle cx={last.x} cy={last.y} r={11} fill="var(--accent-soft)" />
        <circle cx={last.x} cy={last.y} r={5.5} fill="var(--accent)" />
        <text
          x={last.x - 16}
          y={last.y - 16}
          textAnchor="end"
          fill="var(--ink)"
          fontWeight={700}
          fontSize={15}
        >
          {format(values.at(-1)!)}
        </text>
      </svg>
      <figcaption
        className="meta"
        style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}
      >
        <span>{labels[0]}</span>
        <span>{labels.at(-1)}</span>
      </figcaption>
    </figure>
  );
}
