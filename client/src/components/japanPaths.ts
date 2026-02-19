// Geolonia Japanese Prefectures Cartogram - Rectangle data
// Source: https://github.com/geolonia/japanese-prefectures

export const JAPAN_VIEWBOX = "0 0 1000 1000";

export interface PrefectureRect {
  code: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PREFECTURES: PrefectureRect[] = [
  { code: 1,  name: "北海道",  x: 775.9, y: 0,     w: 224.1, h: 201.3 },
  { code: 2,  name: "青森",    x: 775.9, y: 228.2, w: 224.1, h: 64.4 },
  { code: 3,  name: "岩手",    x: 890,   y: 296.6, w: 110,   h: 87.2 },
  { code: 4,  name: "宮城",    x: 890,   y: 387.9, w: 110,   h: 64.4 },
  { code: 5,  name: "秋田",    x: 775.9, y: 296.6, w: 110,   h: 87.2 },
  { code: 6,  name: "山形",    x: 775.9, y: 387.9, w: 110,   h: 64.4 },
  { code: 7,  name: "福島",    x: 821.5, y: 456.4, w: 178.5, h: 132.8 },
  { code: 8,  name: "茨城",    x: 935.6, y: 593.3, w: 64.4,  h: 132.8 },
  { code: 9,  name: "栃木",    x: 855.7, y: 593.3, w: 75.8,  h: 87.2 },
  { code: 10, name: "群馬",    x: 775.9, y: 593.3, w: 75.8,  h: 87.2 },
  { code: 11, name: "埼玉",    x: 775.9, y: 684.6, w: 155.6, h: 87.2 },
  { code: 12, name: "千葉",    x: 935.6, y: 730.2, w: 64.4,  h: 224.1 },
  { code: 13, name: "東京",    x: 821.5, y: 775.8, w: 110,   h: 87.2 },
  { code: 14, name: "神奈川",  x: 821.5, y: 867.1, w: 64.4,  h: 64.4 },
  { code: 15, name: "新潟",    x: 730.2, y: 456.4, w: 87.2,  h: 132.8 },
  { code: 16, name: "富山",    x: 639,   y: 502,   w: 87.2,  h: 87.2 },
  { code: 17, name: "石川",    x: 593.3, y: 433.6, w: 41.6,  h: 155.6 },
  { code: 18, name: "福井",    x: 547.7, y: 593.3, w: 87.2,  h: 87.2 },
  { code: 19, name: "山梨",    x: 753,   y: 775.8, w: 64.4,  h: 87.2 },
  { code: 20, name: "長野",    x: 707.4, y: 593.3, w: 64.3,  h: 269.7 },
  { code: 21, name: "岐阜",    x: 639,   y: 593.3, w: 64.4,  h: 269.7 },
  { code: 22, name: "静岡",    x: 730.2, y: 867.1, w: 87.2,  h: 87.2 },
  { code: 23, name: "愛知",    x: 639,   y: 867.1, w: 87.2,  h: 87.2 },
  { code: 24, name: "三重",    x: 593.3, y: 775.8, w: 41.6,  h: 224.2 },
  { code: 25, name: "滋賀",    x: 593.3, y: 684.6, w: 41.6,  h: 87.2 },
  { code: 26, name: "京都",    x: 502,   y: 638.9, w: 87.2,  h: 132.8 },
  { code: 27, name: "大阪",    x: 502,   y: 775.8, w: 41.6,  h: 178.5 },
  { code: 28, name: "兵庫",    x: 433.6, y: 638.9, w: 64.4,  h: 178.5 },
  { code: 29, name: "奈良",    x: 547.7, y: 775.8, w: 41.6,  h: 178.5 },
  { code: 30, name: "和歌山",  x: 502,   y: 958.4, w: 87.2,  h: 41.6 },
  { code: 31, name: "鳥取",    x: 387.9, y: 638.9, w: 41.6,  h: 87.2 },
  { code: 32, name: "島根",    x: 319.5, y: 638.9, w: 64.4,  h: 87.2 },
  { code: 33, name: "岡山",    x: 387.9, y: 730.2, w: 41.6,  h: 87.2 },
  { code: 34, name: "広島",    x: 319.5, y: 730.2, w: 64.4,  h: 87.2 },
  { code: 35, name: "山口",    x: 273.9, y: 638.9, w: 41.6,  h: 178.5 },
  { code: 36, name: "徳島",    x: 365.1, y: 935.6, w: 87.2,  h: 64.4 },
  { code: 37, name: "香川",    x: 365.1, y: 867.1, w: 87.2,  h: 64.4 },
  { code: 38, name: "愛媛",    x: 273.9, y: 867.1, w: 87.1,  h: 64.4 },
  { code: 39, name: "高知",    x: 273.9, y: 935.6, w: 87.1,  h: 64.4 },
  { code: 40, name: "福岡",    x: 91.3,  y: 638.9, w: 132.8, h: 87.2 },
  { code: 41, name: "佐賀",    x: 45.7,  y: 638.9, w: 41.6,  h: 110 },
  { code: 42, name: "長崎",    x: 0,     y: 638.9, w: 41.6,  h: 110 },
  { code: 43, name: "熊本",    x: 91.3,  y: 730.2, w: 64.4,  h: 178.5 },
  { code: 44, name: "大分",    x: 159.8, y: 730.2, w: 64.4,  h: 87.2 },
  { code: 45, name: "宮崎",    x: 159.8, y: 821.5, w: 64.4,  h: 87.2 },
  { code: 46, name: "鹿児島",  x: 91.3,  y: 912.7, w: 132.8, h: 87.3 },
  { code: 47, name: "沖縄",    x: 136.9, y: 456.4, w: 41.6,  h: 87.2 },
];

// Boundary line between Okinawa and Kyushu
export const BOUNDARY_POINTS = {
  x1: 87.3, y1: 593.3,
  x2: 228.2, y2: 593.3,
  x3: 228.2, y3: 454.4,
};
