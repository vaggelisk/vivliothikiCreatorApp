/* eslint-disable no-secrets/no-secrets, prettier/prettier, max-statements */
import { getPuppeteer } from './scanner';

export interface MetabookResult {
  title: string;
  isbn: string | null;
  author: string | null;
  publisher: string | null;
  photo: string | null;
  url: string | null;
  price: string | null;
}

export interface MetabookSearchPayload {
  results: MetabookResult[];
  rawCount: number;
}

const METABOOK_BASE_URL = 'https://metabook.gr';

interface TypesenseHit {
  document: {
    id?: string;
    title?: string;
    title_normalized?: string;
    authors?: string;
    publisher?: string;
    cover_url?: string;
    isbn_10?: string;
    isbn_13?: string;
    'ISBN-10'?: string;
    'ISBN-13'?: string;
    min_price?: number;
    best_price?: number;
    original_price?: number;
  };
}

interface TypesenseSearchResult {
  found: number;
  hits: TypesenseHit[];
}

interface TypesenseMultiSearchResponse {
  results: TypesenseSearchResult[];
}

/**
 * Opens metabook.gr in Puppeteer (passes Cloudflare), types the query in the
 * search box, and intercepts the Typesense JSON response from inside the
 * browser session. This avoids all Cloudflare/CORS issues because the
 * browser handles the challenge natively.
 */
export async function scrapeMetabookSearch(query: string): Promise<MetabookSearchPayload> {
  const searchTerm = `${query ?? ''}`.trim();
  if (!searchTerm) {
    throw new Error('Απαιτείται όρος αναζήτησης για το Metabook.');
  }

  const { default: puppeteer } = await getPuppeteer();
  const browser = await puppeteer.launch({
    headless: 'new' as any,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(45_000);
    page.setDefaultTimeout(20_000);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    );

    // Intercept requests only to bump Typesense per_page to 10
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('multi_search')) {
        const newUrl = url.includes('per_page=')
          ? url.replace(/per_page=\d+/, 'per_page=10')
          : url + (url.includes('?') ? '&' : '?') + 'per_page=10';
        req.continue({ url: newUrl });
      } else {
        req.continue();
      }
    });

    // 1. Navigate — Cloudflare challenge will resolve in the real browser
    await page.goto(METABOOK_BASE_URL, { waitUntil: 'domcontentloaded' });

    // Wait for CF challenge to clear (up to 20s)
    for (let i = 0; i < 20; i++) {
      const title = await page.title();
      if (!title.toLowerCase().includes('moment')) break;
      await new Promise(r => setTimeout(r, 1000));
    }

    // 2. Wait for the search input to appear
    const selectors = [
      'input.search-input',
      'input[placeholder*="search" i]',
      'input[id*="search" i]',
      'input[type="search"]',
      'input[class*="search" i]',
    ];
    let searchInput = null;
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5_000 }).catch(() => {});
        searchInput = await page.$(selector);
        if (searchInput) break;
      } catch {
        // Try next selector
      }
    }
    
    if (!searchInput) {
      throw new Error('Δεν βρέθηκε το πεδίο αναζήτησης στο metabook.gr.');
    }

    // 3. Focus and type the query — this triggers Typesense XHR requests
    await page.evaluate((el: Element) => (el as HTMLInputElement).focus(), searchInput);
    await page.keyboard.type(searchTerm, { delay: 10 });

    // 4. Wait directly for the first successful Typesense response
    const typesenseResponse = await page.waitForResponse(
      (res) => res.url().includes('multi_search') && res.status() === 200,
      { timeout: 8_000 },
    ).catch(() => null);

    if (!typesenseResponse) {
      return { results: [], rawCount: 0 };
    }

    // 5. Parse the intercepted JSON
    const parsed = await typesenseResponse.json() as TypesenseMultiSearchResponse;
    const booksResult = parsed.results?.[0];
    const rawCount = booksResult?.found ?? 0;

    const results: MetabookResult[] = (booksResult?.hits ?? []).map((hit: TypesenseHit) => {
      const doc = hit.document as Record<string, any>;
      const id = doc.id ?? '';
      const titleNorm = doc.title_normalized ?? '';
      const slug = titleNorm ? `${titleNorm}-${id}` : id;
      const price = doc.best_price ?? doc.min_price ?? null;

      return {
        title: doc.title ?? '',
        isbn: null,
        author: doc.authors ?? null,
        publisher: doc.publisher ?? null,
        photo: doc.cover_url ?? null,
        url: id ? `${METABOOK_BASE_URL}/books/${slug}` : null,
        price: price != null ? `${price.toFixed(2)} €` : null,
      };
    }).filter((r) => r.title.length > 0);

    return { results, rawCount };
  } finally {
    await browser.close();
  }
}
