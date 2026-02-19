import { useState } from "react";
import type { Spot, User } from "@shared/schema";
import { JAPAN_VIEWBOX, PREFECTURE_PATHS } from "./japanPaths";

interface JapanMapProps {
  spots: (Spot & { user: User })[];
  onPrefectureClick: (prefecture: string) => void;
}

export default function JapanMap({ spots, onPrefectureClick }: JapanMapProps) {
  const [hoveredPref, setHoveredPref] = useState<string | null>(null);

  return (
    <div className="w-full relative">
      {/* Tooltip */}
      {hoveredPref ? (
        <div className="text-center mb-2">
          <span className="bg-foreground text-background text-xs px-3 py-1 rounded">
            {hoveredPref}
          </span>
        </div>
      ) : (
        <div className="h-6 mb-2" />
      )}
      <div className="flex justify-center">
        <svg
          viewBox={JAPAN_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full max-w-[320px] block"
        >
          {Object.entries(PREFECTURE_PATHS).map(([name, paths]) => {
            const isHovered = hoveredPref === name;

            return (
              <g
                key={name}
                onClick={() => onPrefectureClick(name)}
                onMouseEnter={() => setHoveredPref(name)}
                onMouseLeave={() => setHoveredPref(null)}
                style={{ cursor: "pointer" }}
              >
                {paths.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill={isHovered ? "#f97316" : "transparent"}
                    stroke="#000"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    style={{ transition: "fill 100ms" }}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
