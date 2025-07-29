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
  googlemaps: {
    pattern: /(maps\.app\.goo\.gl|maps\.google\.com|goo\.gl\/maps)/,
    storeName: (dom: Document) => {
      // Google Mapsから場所名を抽出
      const titleElement = dom.querySelector('title');
      const title = titleElement?.textContent || '';
      
      // "場所名 - Google マップ" の形式から場所名を抽出
      if (title.includes(' - Google マップ')) {
        return title.replace(' - Google マップ', '').trim();
      }
      if (title.includes(' - Google Maps')) {
        return title.replace(' - Google Maps', '').trim();
      }
      
      // h1要素から抽出を試行
      const h1Element = dom.querySelector('h1');
      if (h1Element?.textContent) {
        const h1Text = h1Element.textContent.trim();
        if (h1Text && h1Text !== 'Google Maps' && h1Text.length < 100) {
          return h1Text;
        }
      }
      
      // メタデータから抽出
      const metaTitle = dom.querySelector('meta[property="og:title"]');
      if (metaTitle?.getAttribute('content')) {
        const metaContent = metaTitle.getAttribute('content') || '';
        if (metaContent.includes(' - Google マップ')) {
          return metaContent.replace(' - Google マップ', '').trim();
        }
        if (metaContent.includes(' - Google Maps')) {
          return metaContent.replace(' - Google Maps', '').trim();
        }
      }
      
      return undefined;
    },
    prefecture: (dom: Document, url: string) => {
      return extractPrefectureFromText(dom.documentElement.textContent || '');
    }
  },
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

// Google Maps専用の抽出関数（正規表現ベース）
function extractGoogleMapsStoreName(html: string, url: string): string | undefined {
  console.log(`[URL Extractor] Attempting to extract store name from Google Maps`);
  
  // URLから場所の名前を抽出する試み（place/の後の部分）
  const placeMatch = url.match(/\/place\/([^\/]+)/);
  if (placeMatch) {
    const placeName = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
    if (placeName && placeName.length > 0) {
      console.log(`[URL Extractor] Found place name from URL: ${placeName}`);
      return placeName;
    }
  }
  
  // タイトルタグから抽出
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    console.log(`[URL Extractor] Found title tag: ${title}`);
    
    // 日本語版Google Maps
    if (title.includes(' - Google マップ')) {
      const storeName = title.replace(' - Google マップ', '').trim();
      if (storeName && storeName !== 'Google マップ' && storeName !== 'Google' && storeName.length > 0) {
        console.log(`[URL Extractor] Found store name from title (JP): ${storeName}`);
        return storeName;
      }
    }
    
    // 英語版Google Maps
    if (title.includes(' - Google Maps')) {
      const storeName = title.replace(' - Google Maps', '').trim();
      if (storeName && storeName !== 'Google Maps' && storeName !== 'Google' && storeName.length > 0) {
        console.log(`[URL Extractor] Found store name from title (EN): ${storeName}`);
        return storeName;
      }
    }
    
    // タイトルがGoogle Maps/マップでない場合は場所名として扱う
    if (!title.includes('Google Maps') && !title.includes('Google マップ') && title.length > 0 && title.length < 100) {
      console.log(`[URL Extractor] Using full title as store name: ${title}`);
      return title;
    }
  }
  
  // og:titleから抽出
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch) {
    const ogTitle = ogTitleMatch[1].trim();
    console.log(`[URL Extractor] Found og:title: ${ogTitle}`);
    
    if (ogTitle.includes(' - Google マップ')) {
      const storeName = ogTitle.replace(' - Google マップ', '').trim();
      if (storeName && storeName !== 'Google マップ' && storeName !== 'Google' && storeName.length > 0) {
        console.log(`[URL Extractor] Found store name from og:title (JP): ${storeName}`);
        return storeName;
      }
    }
    
    if (ogTitle.includes(' - Google Maps')) {
      const storeName = ogTitle.replace(' - Google Maps', '').trim();
      if (storeName && storeName !== 'Google Maps' && storeName !== 'Google' && storeName.length > 0) {
        console.log(`[URL Extractor] Found store name from og:title (EN): ${storeName}`);
        return storeName;
      }
    }
  }
  
  // JSON-LDデータから抽出
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      if (jsonData.name) {
        console.log(`[URL Extractor] Found store name from JSON-LD: ${jsonData.name}`);
        return jsonData.name;
      }
    } catch (e) {
      console.log(`[URL Extractor] Failed to parse JSON-LD data`);
    }
  }
  
  console.log(`[URL Extractor] Could not extract store name from Google Maps`);
  return undefined;
}

export async function extractInfoFromUrl(url: string): Promise<ExtractedInfo> {
  try {
    console.log(`[URL Extractor] Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow'
    });
    
    if (!response.ok) {
      console.log(`[URL Extractor] HTTP ${response.status} for ${url}`);
      return {};
    }
    
    // リダイレクト後の最終URLを取得
    const finalUrl = response.url;
    console.log(`[URL Extractor] Final URL after redirects: ${finalUrl}`);
    
    const html = await response.text();
    
    // Google Mapsの場合は正規表現ベースで抽出
    if (SITE_PATTERNS.googlemaps.pattern.test(url) || SITE_PATTERNS.googlemaps.pattern.test(finalUrl)) {
      console.log(`[URL Extractor] Using Google Maps regex handler for: ${finalUrl}`);
      const storeName = extractGoogleMapsStoreName(html, finalUrl);
      const prefecture = extractPrefectureFromText(html);
      
      console.log(`[URL Extractor] Google Maps extracted - Store: ${storeName}, Prefecture: ${prefecture}`);
      
      return {
        storeName: storeName || undefined,
        prefecture: prefecture || undefined
      };
    }
    
    // 他のサイトは正規表現ベースで抽出
    const handler = getSiteHandler(url);
    console.log(`[URL Extractor] Using regex handler for: ${url}`);
    
    // 正規表現ベースの抽出関数
    const extractWithRegex = (html: string, url: string) => {
      let storeName: string | undefined;
      let prefecture: string | undefined;
      
      // タイトルタグから抽出
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        const title = titleMatch[1].trim();
        
        // 食べログの場合
        if (url.includes('tabelog.com')) {
          const match = title.match(/^([^|]+)/);
          if (match) {
            storeName = match[1].trim();
          }
        }
        // ぐるなびの場合
        else if (url.includes('r.gnavi.co.jp')) {
          const match = title.match(/^([^|]+)/);
          if (match) {
            storeName = match[1].trim();
          }
        }
        // ホットペッパーの場合
        else if (url.includes('hotpepper.jp')) {
          const match = title.match(/^([^|]+)/);
          if (match) {
            storeName = match[1].trim();
          }
        }
      }
      
      // 都道府県抽出
      prefecture = extractPrefectureFromText(html);
      
      return { storeName, prefecture };
    };
    
    const { storeName, prefecture } = extractWithRegex(html, url);
    
    console.log(`[URL Extractor] Regex extracted - Store: ${storeName}, Prefecture: ${prefecture}`);
    
    return {
      storeName: storeName || undefined,
      prefecture: prefecture || undefined
    };
    
  } catch (error) {
    console.error(`[URL Extractor] Error extracting from ${url}:`, error);
    return {};
  }
}