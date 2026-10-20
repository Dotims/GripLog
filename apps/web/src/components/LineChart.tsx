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

  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} width="100%" role="img" aria-label="Progress chart">
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={WIDTH}
            y1={height * f}
            y2={height * f}
            stroke="#c9ccd1"
            strokeDasharray="4 4"
          />
        ))}
        <path
          d={toPath(points)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={3.5}
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 7 : 4}
            fill={i === points.length - 1 ? "var(--accent)" : "var(--surface)"}
            stroke="var(--border)"
            strokeWidth={2}
          >
            <title>{`${labels[i]}: ${format(values[i]!)}`}</title>
          </circle>
        ))}
        <text
          x={last.x}
          y={last.y - 14}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontWeight={700}
          fontSize={14}
        >
          {format(values.at(-1)!)}
        </text>
      </svg>
      <figcaption className="meta" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{labels[0]}</span>
        <span>{labels.at(-1)}</span>
      </figcaption>
    </figure>
  );
}
