/* eslint-disable max-statements, complexity, sonarjs/cognitive-complexity, unicorn/prevent-abbreviations, prettier/prettier */
import { getPuppeteer } from './scanner';

export interface BiblionetResult {
  title: string;
  isbn: string | null;
  author: string | null;
  photo: string | null;
  url: string | null;
}

export interface BiblionetSearchPayload {
  results: BiblionetResult[];
  /** Number of card elements found before title filtering — useful for debugging 0 results. */
  rawCount: number;
}

const BIBLIONET_BASE_URL = 'https://www.biblionet.gr/';

/**
 * biblionet.gr search results use #result_books as the container.
 * Each card is a .product-thumb wrapper that contains:
 *   .image_cover (cover link) and .product-thumb-info (text info).
 */
const CARD_SELECTORS = [
  '#result_books .product-thumb',
  '.product-thumb',
  '#result_books li',
];

const RESULT_READY_SELECTORS = [
  '#result_books',
  '.product-thumb',
  '.no-results',
  '#noResultsMessage',
];

/**
 * biblionet.gr is a traditional server-side PHP site.
 * Only block images — leave stylesheets so that any JS that reads computed
 * styles doesn't break, and fonts/media for extra speed.
 */
const BLOCKED_TYPES = new Set(['image', 'font', 'media']);

export async function scrapeBiblionetSearch(query: string): Promise<BiblionetSearchPayload> {
  const searchTerm = `${query ?? ''}`.trim();
  if (!searchTerm) {
    throw new Error('Απαιτείται όρος αναζήτησης για το Biblionet.');
  }

  const { default: puppeteer } = await getPuppeteer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30_000);
    page.setDefaultTimeout(15_000);

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (BLOCKED_TYPES.has(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    );

    await page.goto(BIBLIONET_BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#headerSearch', { timeout: 12_000 });

    const searchTypeSelector = 'select[name="filter"]';
    if (await page.$(searchTypeSelector)) {
      await page.select(searchTypeSelector, 'books');
    }

    await page.type('#headerSearch', searchTerm, { delay: 20 });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30_000 }),
      page.keyboard.press('Enter'),
    ]);

    await page
      .waitForFunction(
        (selectors: string[]) => selectors.some((s) => !!document.querySelector(s)),
        { timeout: 10_000 },
        RESULT_READY_SELECTORS,
      )
      .catch(() => { /* proceed with whatever the page has */ });

    const { items, rawCount } = await page.evaluate(
      (cardSelectors: string[], baseUrl: string) => {
        const cards = Array.from(
          document.querySelectorAll<HTMLElement>(cardSelectors.join(',')),
        );
        const rawCount = cards.length;

        const items = cards.slice(0, 30).map((card) => {
          // Title: biblionet puts the title in the book-link anchor text
          // inside .product-thumb-info. The anchor href contains "-" (slug).
          const infoEl = card.querySelector<HTMLElement>('.product-thumb-info');
          const bookLinkEl =
            infoEl?.querySelector<HTMLAnchorElement>('a[href*="-"]') ??
            card.querySelector<HTMLAnchorElement>('a.product-thumb-info, a[href*="-"]');

          // Separate heading/title element may also exist
          const headingEl = infoEl?.querySelector<HTMLElement>('h2, h3, h4, .book-title, [itemprop="name"]');

          const title =
            headingEl?.textContent?.trim() ??
            bookLinkEl?.textContent?.trim().split('\n')[0]?.trim() ??
            '';

          const authorEl = infoEl?.querySelector<HTMLElement>(
            '[itemprop="author"], .author, .book-author, .contributors',
          );
          const author = authorEl?.textContent?.trim() || null;

          const isbn = (card.textContent ?? '').match(/\b97[89]\d{10}\b/)?.[0] ?? null;

          const href = bookLinkEl?.getAttribute('href') ?? null;
          let url: string | null = null;
          if (href) try { url = new URL(href, baseUrl).href; } catch { url = href; }

          const imgEl = card.querySelector<HTMLImageElement>('img');
          const rawSrc =
            imgEl?.getAttribute('data-src') ??
            imgEl?.getAttribute('data-lazy-src') ??
            imgEl?.getAttribute('src') ??
            null;
          let photo: string | null = null;
          if (rawSrc && !rawSrc.startsWith('data:'))
            try { photo = new URL(rawSrc, baseUrl).href; } catch { photo = rawSrc; }

          return { title, isbn, author, photo, url };
        });

        return { items, rawCount };
      },
      CARD_SELECTORS,
      BIBLIONET_BASE_URL,
    );

    const results = items.filter((r) => r.title.length > 0);
    return { results, rawCount };
  } finally {
    await browser.close();
  }
}
