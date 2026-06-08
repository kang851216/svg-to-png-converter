/**
 * Cloudflare Pages Middleware - Dynamic SEO with Search Query Injection
 *
 * 1. Detects language from Accept-Language header (ko, zh, en)
 * 2. Parses search keywords from the Referer header (Google, Naver, Bing, Daum, etc.)
 * 3. Dynamically rewrites <title> and <meta name="description"> to include
 *    the user's search terms, dramatically improving CTR and relevance signals.
 *
 * All three languages (English, Korean, Traditional Chinese) are supported.
 */

// =============================================================================
// Language detection from Accept-Language header
// =============================================================================
function detectLanguage(acceptLanguage) {
  if (!acceptLanguage) return 'en';
  const lang = acceptLanguage.toLowerCase();
  if (lang.includes('ko') || lang.includes('kr')) return 'ko';
  if (lang.includes('zh') || lang.includes('cn') || lang.includes('tw') || lang.includes('hk')) return 'zh';
  return 'en';
}

// =============================================================================
// Extract search keywords from Referer header
// =============================================================================
function extractSearchKeywords(referer) {
  if (!referer) return null;
  try {
    const url = new URL(referer.toLowerCase());
    const host = url.hostname;

    // Google (worldwide, including google.co.kr, google.com.tw, etc.)
    if (host.includes('google.')) {
      return url.searchParams.get('q');
    }

    // Naver (Korea)
    if (host.includes('search.naver.com')) {
      return url.searchParams.get('query');
    }

    // Bing
    if (host.includes('bing.com')) {
      return url.searchParams.get('q');
    }

    // Daum (Korea)
    if (host.includes('search.daum.net')) {
      return url.searchParams.get('q');
    }

    // Yahoo
    if (host.includes('search.yahoo.com')) {
      return url.searchParams.get('p');
    }

    // DuckDuckGo
    if (host.includes('duckduckgo.com')) {
      return url.searchParams.get('q');
    }

    // Yandex
    if (host.includes('yandex.')) {
      return url.searchParams.get('text');
    }

    // Baidu (China)
    if (host.includes('baidu.com')) {
      return url.searchParams.get('wd') || url.searchParams.get('word');
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Build a dynamic page title by injecting search keywords.
 *
 * Template format:
 *   "{keyword} - {title suffix}" or a fixed fallback when no keyword.
 */
function buildDynamicTitle(lang, keywords) {
  const clean = keywords ? decodeURIComponent(keywords).trim() : '';
  if (!clean) {
    // Fallback to default language title
    if (lang === 'ko') return 'SVG to PNG 변환기 - 무료 온라인 도구 | SVG를 PNG, JPEG, WebP로 변환';
    if (lang === 'zh') return 'SVG 轉 PNG 轉換器 - 免費線上工具 | 將 SVG 轉換為 PNG、JPEG、WebP';
    return 'SVG to PNG Converter - Free Online Tool | Convert SVG to PNG, JPEG, WebP';
  }

  if (lang === 'ko') {
    return `${clean} - SVG to PNG 변환기 | 무료 온라인 SVG 변환 도구`;
  }
  if (lang === 'zh') {
    return `${clean} - SVG 轉 PNG 轉換器 | 免費線上 SVG 轉換工具`;
  }
  return `${clean} - SVG to PNG Converter | Free Online SVG Conversion Tool`;
}

/**
 * Build a dynamic meta description by injecting search keywords.
 */
function buildDynamicDescription(lang, keywords) {
  const clean = keywords ? decodeURIComponent(keywords).trim() : '';
  if (!clean) {
    if (lang === 'ko') return '무료 온라인 SVG to PNG 변환기. 브라우저에서 직접 SVG 파일을 PNG, JPEG, WebP 이미지로 변환하세요. 서버 업로드 불필요, 100% 안전. 일괄 변환, 배율 조절, 투명 배경 지원.';
    if (lang === 'zh') return '免費線上 SVG 轉 PNG 轉換器。直接在瀏覽器中將 SVG 檔案轉換為 PNG、JPEG、WebP 圖片。無需上傳伺服器，100% 安全。支援批次轉換、縮放調整、透明背景。';
    return 'Free online SVG to PNG converter. Convert SVG files to PNG, JPEG, or WebP images directly in your browser. No upload required, 100% private and secure. Supports batch conversion, adjustable scale, and transparent backgrounds.';
  }

  if (lang === 'ko') {
    return `${clean} 관련 무료 SVG to PNG 변환기입니다. 브라우저에서 SVG를 PNG, JPEG, WebP로 즉시 변환하세요. 업로드 없이 100% 안전하게 변환할 수 있습니다.`;
  }
  if (lang === 'zh') {
    return `尋找 ${clean}？免費 SVG 轉 PNG 轉換器，在瀏覽器中直接將 SVG 轉換為 PNG、JPEG、WebP。無需上傳，100% 安全。`;
  }
  return `Looking for ${clean}? Free SVG to PNG converter - convert SVG to PNG, JPEG, WebP instantly in your browser. No upload needed, 100% private and secure.`;
}

// =============================================================================
// OG / Twitter fallback data (static per language)
// =============================================================================
const OG_TW_DATA = {
  en: {
    ogTitle: 'SVG to PNG Converter - Free Online Tool',
    ogDescription: 'Convert SVG files to PNG, JPEG, or WebP images directly in your browser. 100% private, no server upload required.',
    twitterTitle: 'SVG to PNG Converter - Free Online Tool',
    twitterDescription: 'Convert SVG files to PNG, JPEG, or WebP images directly in your browser. 100% private, no server upload required.',
    htmlLang: 'en',
  },
  ko: {
    ogTitle: 'SVG to PNG 변환기 - 무료 온라인 도구',
    ogDescription: '브라우저에서 직접 SVG 파일을 PNG, JPEG, WebP 이미지로 변환하세요. 100% 안전, 서버 업로드 불필요.',
    twitterTitle: 'SVG to PNG 변환기 - 무료 온라인 도구',
    twitterDescription: '브라우저에서 직접 SVG 파일을 PNG, JPEG, WebP 이미지로 변환하세요. 100% 안전, 서버 업로드 불필요.',
    htmlLang: 'ko',
  },
  zh: {
    ogTitle: 'SVG 轉 PNG 轉換器 - 免費線上工具',
    ogDescription: '直接在瀏覽器中將 SVG 檔案轉換為 PNG、JPEG、WebP 圖片。100% 安全，無需上傳伺服器。',
    twitterTitle: 'SVG 轉 PNG 轉換器 - 免費線上工具',
    twitterDescription: '直接在瀏覽器中將 SVG 檔案轉換為 PNG、JPEG、WebP 圖片。100% 安全，無需上傳伺服器。',
    htmlLang: 'zh',
  },
};

// =============================================================================
// Cloudflare Pages onRequest handler
// =============================================================================
export async function onRequest(context) {
  const { request, next } = context;

  // --- Step 1: Determine the target language ---
  const acceptLanguage = request.headers.get('Accept-Language') || '';
  const lang = detectLanguage(acceptLanguage);

  // --- Step 2: Extract search keywords from the Referer ---
  const referer = request.headers.get('Referer') || '';
  const keywords = extractSearchKeywords(referer);

  // --- Step 3: Build the dynamic title and description ---
  const dynamicTitle = buildDynamicTitle(lang, keywords);
  const dynamicDescription = buildDynamicDescription(lang, keywords);

  // If no keywords and language is English, the default index.html is already correct
  if (!keywords && lang === 'en') return next();

  // --- Step 4: Fetch the original response ---
  const response = await next();

  // Only rewrite HTML responses
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) return response;

  // --- Step 5: Rewrite SEO tags using HTMLRewriter ---
  const ogData = OG_TW_DATA[lang] || OG_TW_DATA['en'];

  return new HTMLRewriter()
    // <title>...</title>
    .on('title', {
      text(text) {
        text.replace(dynamicTitle);
      },
    })
    // <meta name="description" content="...">
    .on('meta[name="description"]', {
      element(element) {
        element.setAttribute('content', dynamicDescription);
      },
    })
    // <meta property="og:title" content="...">
    .on('meta[property="og:title"]', {
      element(element) {
        element.setAttribute('content', ogData.ogTitle);
      },
    })
    // <meta property="og:description" content="...">
    .on('meta[property="og:description"]', {
      element(element) {
        element.setAttribute('content', ogData.ogDescription);
      },
    })
    // <meta property="twitter:title" content="...">
    .on('meta[property="twitter:title"]', {
      element(element) {
        element.setAttribute('content', ogData.twitterTitle);
      },
    })
    // <meta property="twitter:description" content="...">
    .on('meta[property="twitter:description"]', {
      element(element) {
        element.setAttribute('content', ogData.twitterDescription);
      },
    })
    // <html lang="...">
    .on('html', {
      element(element) {
        element.setAttribute('lang', ogData.htmlLang);
      },
    })
    .transform(response);
}