import { useState, useMemo } from "react";
import type { Spot, User } from "@shared/schema";
import { JAPAN_VIEWBOX, PREFECTURES, BOUNDARY_PATH } from "./japanPaths";

interface JapanMapProps {
  spots: (Spot & { user: User })[];
  onPrefectureClick: (prefecture: string) => void;
}

// Calculate center + font size of each prefecture's bounding box from its path
function getPathBBox(d: string): { cx: number; cy: number; w: number; h: number } {
  const nums = d.match(/-?[\d.]+/g)?.map(Number) || [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < nums.length - 1; i += 2) {
    const x = nums[i], y = nums[i + 1];
    if (x < 2000 && y < 2000) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    w: maxX - minX,
    h: maxY - minY,
  };
}

export default function JapanMap({ spots, onPrefectureClick }: JapanMapProps) {
  const [hoveredPref, setHoveredPref] = useState<string | null>(null);

  const prefBBoxes = useMemo(() => {
    const map = new Map<string, { cx: number; cy: number; w: number; h: number }>();
    PREFECTURES.forEach((p) => {
      map.set(p.name, getPathBBox(p.d));
    });
    return map;
  }, []);

  return (
    <div className="w-full relative">
      <div className="flex justify-center">
        <svg
          viewBox={JAPAN_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full max-w-[340px] block"
        >
          {/* Boundary line (Okinawa) */}
          <path
            d={BOUNDARY_PATH}
            fill="none"
            stroke="#ccc"
            strokeWidth="2"
          />

          {/* Prefectures */}
          {PREFECTURES.map((pref) => {
            const isHovered = hoveredPref === pref.name;
            const bbox = prefBBoxes.get(pref.name);
            const fontSize = bbox
              ? Math.min(bbox.w * 0.35, bbox.h * 0.3, 22)
              : 16;

            return (
              <g
                key={pref.code}
                onClick={() => onPrefectureClick(pref.name)}
                onMouseEnter={() => setHoveredPref(pref.name)}
                onMouseLeave={() => setHoveredPref(null)}
                style={{ cursor: "pointer" }}
              >
                <path
                  d={pref.d}
                  fill={isHovered ? "#f97316" : "#f5f5f5"}
                  stroke="#999"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  style={{ transition: "fill 100ms" }}
                />
                {bbox && (
                  <text
                    x={bbox.cx}
                    y={bbox.cy}
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
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
