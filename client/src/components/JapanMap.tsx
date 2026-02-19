import { useMemo } from "react";
import type { Spot, User } from "@shared/schema";

const PREFECTURES = [
  // 北海道・東北
  { name: "北海道", region: "北海道" },
  { name: "青森", region: "東北" },
  { name: "岩手", region: "東北" },
  { name: "宮城", region: "東北" },
  { name: "秋田", region: "東北" },
  { name: "山形", region: "東北" },
  { name: "福島", region: "東北" },
  // 関東
  { name: "茨城", region: "関東" },
  { name: "栃木", region: "関東" },
  { name: "群馬", region: "関東" },
  { name: "埼玉", region: "関東" },
  { name: "千葉", region: "関東" },
  { name: "東京", region: "関東" },
  { name: "神奈川", region: "関東" },
  // 中部
  { name: "新潟", region: "中部" },
  { name: "富山", region: "中部" },
  { name: "石川", region: "中部" },
  { name: "福井", region: "中部" },
  { name: "山梨", region: "中部" },
  { name: "長野", region: "中部" },
  { name: "岐阜", region: "中部" },
  { name: "静岡", region: "中部" },
  { name: "愛知", region: "中部" },
  // 近畿
  { name: "三重", region: "近畿" },
  { name: "滋賀", region: "近畿" },
  { name: "京都", region: "近畿" },
  { name: "大阪", region: "近畿" },
  { name: "兵庫", region: "近畿" },
  { name: "奈良", region: "近畿" },
  { name: "和歌山", region: "近畿" },
  // 中国
  { name: "鳥取", region: "中国" },
  { name: "島根", region: "中国" },
  { name: "岡山", region: "中国" },
  { name: "広島", region: "中国" },
  { name: "山口", region: "中国" },
  // 四国
  { name: "徳島", region: "四国" },
  { name: "香川", region: "四国" },
  { name: "愛媛", region: "四国" },
  { name: "高知", region: "四国" },
  // 九州・沖縄
  { name: "福岡", region: "九州" },
  { name: "佐賀", region: "九州" },
  { name: "長崎", region: "九州" },
  { name: "熊本", region: "九州" },
  { name: "大分", region: "九州" },
  { name: "宮崎", region: "九州" },
  { name: "鹿児島", region: "九州" },
  { name: "沖縄", region: "九州" },
];

const REGION_COLORS: Record<string, { bg: string; active: string }> = {
  "北海道": { bg: "bg-sky-100", active: "bg-sky-400" },
  "東北":   { bg: "bg-emerald-100", active: "bg-emerald-400" },
  "関東":   { bg: "bg-orange-100", active: "bg-orange-400" },
  "中部":   { bg: "bg-yellow-100", active: "bg-yellow-400" },
  "近畿":   { bg: "bg-rose-100", active: "bg-rose-400" },
  "中国":   { bg: "bg-purple-100", active: "bg-purple-400" },
  "四国":   { bg: "bg-teal-100", active: "bg-teal-400" },
  "九州":   { bg: "bg-pink-100", active: "bg-pink-400" },
};

interface JapanMapProps {
  spots: (Spot & { user: User })[];
  onPrefectureClick: (prefecture: string) => void;
}

export default function JapanMap({ spots, onPrefectureClick }: JapanMapProps) {
  // Count spots per prefecture (using region field which stores prefecture/area)
  const spotCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    spots.forEach((spot) => {
      const region = spot.region || "";
      counts[region] = (counts[region] || 0) + 1;
    });
    return counts;
  }, [spots]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1.5">
        {PREFECTURES.map((pref) => {
          const count = spotCounts[pref.name] || 0;
          const hasSpots = count > 0;
          const colors = REGION_COLORS[pref.region];

          return (
            <button
              key={pref.name}
              onClick={() => onPrefectureClick(pref.name)}
              className={`
                relative rounded-md p-1 text-center transition-all duration-150
                hover:scale-110 hover:shadow-md active:scale-95
                border border-foreground/20
                ${hasSpots ? colors.active + " text-white font-bold" : colors.bg + " text-foreground/70"}
              `}
              style={{ aspectRatio: "1" }}
            >
              <span className="text-[10px] leading-tight block">
                {pref.name}
              </span>
              {hasSpots && (
                <span className="text-[8px] leading-none block mt-0.5">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
