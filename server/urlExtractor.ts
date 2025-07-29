import { JSDOM } from 'jsdom';

export interface ExtractedInfo {
  storeName?: string;
  prefecture?: string;
}

const PREFECTURE_NAMES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

// 主要グルメサイトのパターン
const SITE_PATTERNS = {
  tabelog: {
    pattern: /tabelog\.com/,
    storeName: (dom: Document) => {
      // ぐるなびから店舗名を抽出
      const titleElement = dom.querySelector('h1.display-name, .rdheader-subname, h1');
      return titleElement?.textContent?.trim();
    },
    prefecture: (dom: Document, url: string) => {
      // URLから都道府県を抽出
      const match = url.match(/\/(\w+)\/\w+/);
      if (match) {
        const area = match[1];
        return convertAreaToPrefecture(area);
      }
      return extractPrefectureFromText(dom.documentElement.textContent || '');
    }
  },
  gurunavi: {
    pattern: /r\.gnavi\.co\.jp/,
    storeName: (dom: Document) => {
      const titleElement = dom.querySelector('.shop-name, h1, .store-name');
      return titleElement?.textContent?.trim();
    },
    prefecture: (dom: Document, url: string) => {
      return extractPrefectureFromText(dom.documentElement.textContent || '');
    }
  },
  hotpepper: {
    pattern: /hotpepper\.jp/,
    storeName: (dom: Document) => {
      const titleElement = dom.querySelector('.shopDetailName, h1, .shop-name');
      return titleElement?.textContent?.trim();
    },
    prefecture: (dom: Document, url: string) => {
      return extractPrefectureFromText(dom.documentElement.textContent || '');
    }
  },
  generic: {
    pattern: /.*/,
    storeName: (dom: Document) => {
      // 一般的なタイトルから店舗名を推測
      const title = dom.querySelector('title')?.textContent || '';
      const h1 = dom.querySelector('h1')?.textContent || '';
      
      // より具体的なものを優先
      if (h1.length > 0 && h1.length < 100) return h1.trim();
      if (title.length > 0 && title.length < 100) return title.split('|')[0].split('-')[0].trim();
      
      return undefined;
    },
    prefecture: (dom: Document, url: string) => {
      return extractPrefectureFromText(dom.documentElement.textContent || '');
    }
  }
};

function convertAreaToPrefecture(area: string): string | undefined {
  const areaMap: { [key: string]: string } = {
    'tokyo': '東京都',
    'osaka': '大阪府',
    'kyoto': '京都府',
    'kanagawa': '神奈川県',
    'saitama': '埼玉県',
    'chiba': '千葉県',
    'aichi': '愛知県',
    'hyogo': '兵庫県',
    'hokkaido': '北海道',
    'fukuoka': '福岡県'
  };
  return areaMap[area.toLowerCase()];
}

function extractPrefectureFromText(text: string): string | undefined {
  for (const prefecture of PREFECTURE_NAMES) {
    if (text.includes(prefecture)) {
      return prefecture;
    }
  }
  return undefined;
}

function getSiteHandler(url: string) {
  for (const [key, handler] of Object.entries(SITE_PATTERNS)) {
    if (handler.pattern.test(url)) {
      return handler;
    }
  }
  return SITE_PATTERNS.generic;
}

export async function extractInfoFromUrl(url: string): Promise<ExtractedInfo> {
  try {
    console.log(`[URL Extractor] Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`[URL Extractor] HTTP ${response.status} for ${url}`);
      return {};
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const handler = getSiteHandler(url);
    console.log(`[URL Extractor] Using handler for: ${url}`);
    
    const storeName = handler.storeName(document);
    const prefecture = handler.prefecture(document, url);
    
    console.log(`[URL Extractor] Extracted - Store: ${storeName}, Prefecture: ${prefecture}`);
    
    return {
      storeName: storeName || undefined,
      prefecture: prefecture || undefined
    };
    
  } catch (error) {
    console.error(`[URL Extractor] Error extracting from ${url}:`, error);
    return {};
  }
}