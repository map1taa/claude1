import { useState } from "react";
import type { Spot, User } from "@shared/schema";
import { JAPAN_VIEWBOX, PREFECTURES, BOUNDARY_POINTS } from "./japanPaths";

interface JapanMapProps {
  spots: (Spot & { user: User })[];
  onPrefectureClick: (prefecture: string) => void;
}

export default function JapanMap({ spots, onPrefectureClick }: JapanMapProps) {
  const [hoveredPref, setHoveredPref] = useState<string | null>(null);

  return (
    <div className="w-full relative">
      <div className="flex justify-center">
        <svg
          viewBox={JAPAN_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full max-w-[520px] block"
        >
          {/* Boundary line (Okinawa → Kyushu) */}
          <polyline
            points={`${BOUNDARY_POINTS.x3},${BOUNDARY_POINTS.y3} ${BOUNDARY_POINTS.x2},${BOUNDARY_POINTS.y2} ${BOUNDARY_POINTS.x1},${BOUNDARY_POINTS.y1}`}
            fill="none"
            stroke="#ccc"
            strokeWidth="2"
          />

          {/* Prefectures */}
          {PREFECTURES.map((pref) => {
            const isHovered = hoveredPref === pref.name;
            const fontSize = Math.min(pref.w * 0.35, pref.h * 0.35, 24);

            return (
              <g
                key={pref.code}
                onClick={() => onPrefectureClick(pref.name)}
                onMouseEnter={() => setHoveredPref(pref.name)}
                onMouseLeave={() => setHoveredPref(null)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={pref.x}
                  y={pref.y}
                  width={pref.w}
                  height={pref.h}
                  fill={isHovered ? "#f97316" : "#f5f5f5"}
                  stroke="#222"
                  strokeWidth="2"
                  style={{ transition: "fill 100ms" }}
                />
                <text
                  x={pref.x + pref.w / 2}
                  y={pref.y + pref.h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fontSize}
                  fill={isHovered ? "#fff" : "#333"}
                  style={{
                    pointerEvents: "none",
                    fontWeight: 600,
                    transition: "fill 100ms",
                  }}
                >
                  {pref.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
