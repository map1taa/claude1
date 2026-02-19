import { useState } from "react";
import type { Spot, User } from "@shared/schema";

// Grid positions to approximate Japan's shape (col, row) on a 13-col x 15-row grid
const PREFECTURES: { name: string; col: number; row: number }[] = [
  // 北海道
  { name: "北海道", col: 10, row: 0 },
  // 東北
  { name: "青森",   col: 10, row: 2 },
  { name: "秋田",   col: 9,  row: 3 },
  { name: "岩手",   col: 10, row: 3 },
  { name: "山形",   col: 9,  row: 4 },
  { name: "宮城",   col: 10, row: 4 },
  { name: "福島",   col: 9,  row: 5 },
  // 関東
  { name: "新潟",   col: 8,  row: 4 },
  { name: "群馬",   col: 8,  row: 5 },
  { name: "栃木",   col: 9,  row: 6 },
  { name: "茨城",   col: 10, row: 6 },
  { name: "埼玉",   col: 8,  row: 6 },
  { name: "東京",   col: 8,  row: 7 },
  { name: "千葉",   col: 9,  row: 7 },
  { name: "神奈川", col: 8,  row: 8 },
  { name: "山梨",   col: 7,  row: 7 },
  // 中部
  { name: "長野",   col: 7,  row: 6 },
  { name: "富山",   col: 7,  row: 5 },
  { name: "石川",   col: 6,  row: 5 },
  { name: "福井",   col: 6,  row: 6 },
  { name: "岐阜",   col: 6,  row: 7 },
  { name: "静岡",   col: 7,  row: 8 },
  { name: "愛知",   col: 6,  row: 8 },
  // 近畿
  { name: "三重",   col: 5,  row: 8 },
  { name: "滋賀",   col: 5,  row: 7 },
  { name: "京都",   col: 5,  row: 6 },
  { name: "奈良",   col: 4,  row: 8 },
  { name: "大阪",   col: 4,  row: 7 },
  { name: "兵庫",   col: 4,  row: 6 },
  { name: "和歌山", col: 4,  row: 9 },
  // 中国
  { name: "鳥取",   col: 3,  row: 6 },
  { name: "島根",   col: 2,  row: 6 },
  { name: "岡山",   col: 3,  row: 7 },
  { name: "広島",   col: 2,  row: 7 },
  { name: "山口",   col: 1,  row: 7 },
  // 四国
  { name: "香川",   col: 3,  row: 8 },
  { name: "徳島",   col: 3,  row: 9 },
  { name: "愛媛",   col: 2,  row: 8 },
  { name: "高知",   col: 2,  row: 9 },
  // 九州
  { name: "福岡",   col: 1,  row: 8 },
  { name: "大分",   col: 1,  row: 9 },
  { name: "佐賀",   col: 0,  row: 8 },
  { name: "長崎",   col: 0,  row: 9 },
  { name: "熊本",   col: 0,  row: 10 },
  { name: "宮崎",   col: 1,  row: 10 },
  { name: "鹿児島", col: 0,  row: 11 },
  // 沖縄
  { name: "沖縄",   col: 0,  row: 13 },
];

interface JapanMapProps {
  spots: (Spot & { user: User })[];
  onPrefectureClick: (prefecture: string) => void;
}

export default function JapanMap({ spots, onPrefectureClick }: JapanMapProps) {
  const [hoveredPref, setHoveredPref] = useState<string | null>(null);

  // Build grid lookup
  const gridMap = new Map<string, typeof PREFECTURES[0]>();
  let maxCol = 0;
  let maxRow = 0;
  PREFECTURES.forEach((p) => {
    gridMap.set(`${p.col}-${p.row}`, p);
    if (p.col > maxCol) maxCol = p.col;
    if (p.row > maxRow) maxRow = p.row;
  });

  const cols = maxCol + 1;
  const rows = maxRow + 1;

  return (
    <div className="w-full relative">
      {/* Tooltip */}
      {hoveredPref && (
        <div className="text-center mb-2">
          <span className="bg-foreground text-background text-xs px-3 py-1 rounded">
            {hoveredPref}
          </span>
        </div>
      )}
      {!hoveredPref && <div className="h-6 mb-2" />}
      <div className="flex justify-center">
        <div
          className="inline-grid gap-[2px]"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            width: "min(100%, 260px)",
          }}
        >
          {Array.from({ length: rows }, (_, row) =>
            Array.from({ length: cols }, (_, col) => {
              const key = `${col}-${row}`;
              const pref = gridMap.get(key);

              if (!pref) {
                return <div key={key} />;
              }

              const isHovered = hoveredPref === pref.name;

              return (
                <button
                  key={key}
                  onClick={() => onPrefectureClick(pref.name)}
                  onMouseEnter={() => setHoveredPref(pref.name)}
                  onMouseLeave={() => setHoveredPref(null)}
                  title={pref.name}
                  className="transition-colors duration-100"
                  style={{
                    aspectRatio: "1",
                    border: "1.5px solid #000",
                    borderRadius: "2px",
                    backgroundColor: isHovered ? "#f97316" : "transparent",
                    cursor: "pointer",
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
