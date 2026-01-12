/* eslint-disable max-lines, max-lines-per-function, max-statements, complexity, sonarjs/cognitive-complexity, unicorn/no-array-callback-reference, no-secrets/no-secrets, prettier/prettier, unicorn/prefer-spread, unicorn/prevent-abbreviations, unicorn/numeric-separators-style, unicorn/better-regex, no-useless-escape */
import type { Browser } from 'puppeteer';

export interface ScrapePayload {
  title?: string | null;
  author?: string | null;
  publisher?: string | null;
  isbn?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  subtitle?: string | null;
  translator?: string | null;
  publicationDate?: string | null;
  language?: string | null;
}

export type ScraperMode = 'isbn' | 'title' | 'url';
export type SourceKey = 'biblionet' | 'politeia' | 'amazon';

type PuppeteerModule = typeof import('puppeteer');
type PuppeteerLaunchOptions = NonNullable<Parameters<PuppeteerModule['launch']>[0]>;

let puppeteerModule: PuppeteerModule | null = null;
let puppeteerModulePromise: Promise<PuppeteerModule> | null = null;

async function getPuppeteer(): Promise<PuppeteerModule> {
  if (!puppeteerModulePromise) {
    puppeteerModulePromise = import('puppeteer') as Promise<PuppeteerModule>;
  }
  return puppeteerModulePromise;
}

async function launchBrowser(
  options?: Partial<PuppeteerLaunchOptions>,
): Promise<Browser> {
  const {
    args: providedArgs,
    headless: providedHeadless,
    ...launchOverrides
  } = options ?? {};
  const { default: puppeteer } = await getPuppeteer();
  const headless: PuppeteerLaunchOptions['headless'] = providedHeadless ?? true;
  const args = Array.isArray(providedArgs)
    ? Array.from(
        new Set([...providedArgs, '--no-sandbox', '--disable-setuid-sandbox']),
      )
    : ['--no-sandbox', '--disable-setuid-sandbox'];

  return puppeteer.launch({
    ...launchOverrides,
    headless,
    args,
  } as PuppeteerLaunchOptions);
}

const BIBLIONET_BASE_URL = 'https://www.biblionet.gr/';

function ensureAbsoluteUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url, BIBLIONET_BASE_URL).href;
  } catch {
    return url;
  }
}

interface BiblionetParams {
  query?: string;
  directUrl?: string;
  launchOptions?: Partial<PuppeteerLaunchOptions>;
}

async function scrapeBiblionet({
  query,
  directUrl,
  launchOptions,
}: BiblionetParams): Promise<ScrapePayload | null> {
  const searchTerm = `${query ?? ''}`.trim();
  const targetUrl = ensureAbsoluteUrl(directUrl);

  if (!searchTerm && !targetUrl) {
    throw new Error('Δεν δόθηκε όρος αναζήτησης για το biblionet');
  }

  const browser = await launchBrowser(launchOptions);

  try {
    const page = await browser.newPage();
    if (targetUrl) {
      await page.goto(targetUrl, { waitUntil: 'networkidle2' });
    } else {
      await page.goto(BIBLIONET_BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#headerSearch', { timeout: 15000 });

      const searchTypeSelector = 'select[name="filter"]';
      const hasSelector = await page.$(searchTypeSelector);
      if (hasSelector) {
        await page.select(searchTypeSelector, 'books');
      }

      await page.type('#headerSearch', searchTerm, { delay: 35 });
      await page.keyboard.press('Enter');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      const detailLink = await page.evaluate(() => {
        const resultCandidates = [
          '#result_books .product-thumb-info a[href*="-"]',
          '.product-thumb-info a[href*="-"]',
          'a.image_cover_a[href*="-"]',
        ];
        for (const selector of resultCandidates) {
          const anchor = document.querySelector<HTMLAnchorElement>(selector);
          if (anchor?.href) {
            return anchor.href;
          }
        }
        return null;
      });

      if (!detailLink) {
        return null;
      }

      await page.goto(detailLink, { waitUntil: 'networkidle2' });
    }

    const payload = (await page.evaluate(() => {
      const getStrongText = (label: string) => {
        const entry = Array.from(
          document.querySelectorAll<HTMLLIElement>('.book_attr_list li'),
        ).find((li) => li.textContent?.toLowerCase().includes(label.toLowerCase()));
        return entry?.querySelector('strong')?.textContent?.trim() ?? null;
      };

      const getContributor = (label: string) => {
        const entry = Array.from(
          document.querySelectorAll<HTMLLIElement>('.contributors-list li'),
        ).find((li) => li.textContent?.toLowerCase().includes(label.toLowerCase()));
        return entry?.querySelector('strong')?.textContent?.trim() ?? null;
      };

      const coverElement = document.querySelector<HTMLImageElement>('#book_info img');
      const descriptionElement = document.querySelector<HTMLElement>('#bookDescription');

      return {
        title: document.querySelector('h1')?.textContent?.trim() ?? null,
        subtitle: document.querySelector('h3')?.textContent?.trim() ?? null,
        author: getContributor('Συγγραφέας') ?? null,
        translator: getContributor('Μετάφραση') ?? null,
        isbn: getStrongText('ISBN'),
        publisher: getStrongText('Εκδότης') ?? getStrongText('Εκδοτης'),
        publicationDate:
          getStrongText('Ημ. Έκδοσης') ??
          getStrongText('Ημ. Εκδοσης') ??
          getStrongText('ΗΜ. ΕΚΔΟΣΗΣ') ??
          null,
        description:
          descriptionElement?.innerText.trim().replace(/\s+\n/g, '\n') ?? null,
        coverUrl: coverElement?.getAttribute('src') ?? null,
      };
    })) as ScrapePayload | null;

    if (!payload || !payload.isbn) {
      return null;
    }

    return {
      ...payload,
      isbn: payload.isbn.trim(),
      coverUrl: ensureAbsoluteUrl(payload.coverUrl),
    };
  } finally {
    await browser.close();
  }
}

export async function scrapeBiblionetByIsbn(
  isbn: string,
): Promise<ScrapePayload | null> {
  return scrapeBiblionet({ query: isbn, launchOptions: { headless: true } });
}

export async function scrapeBiblionetByTitle(
  title: string,
): Promise<ScrapePayload | null> {
  return scrapeBiblionet({ query: title, launchOptions: { headless: true } });
}

export async function scrapeBiblionetByUrl(
  url: string,
): Promise<ScrapePayload | null> {
  return scrapeBiblionet({ directUrl: url, launchOptions: { headless: true } });
}

const POLITEIA_SEARCH_URL = 'https://api.politeianet.gr/v1/Products/Search';
const POLITEIA_DEFAULT_API_KEY = 'BizWebApiKey320FF10594BE4C729890133E4D05DA21';

function normaliseString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function formatPoliteianetDate(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

interface PoliteianetContributor {
  contributorCategoryCode?: string;
  contributorCategoryName?: string;
  comb_name?: string;
  contributorName?: string;
  contributorSurname?: string;
}

interface PoliteianetProduct {
  nm?: string;
  btrl?: { nm?: string; dsm?: string } | null;
  bc?: string;
  barcodes?: string;
  dsm?: string;
  release?: string;
  publish_date?: string;
  contributors?: PoliteianetContributor[];
  img1?: string;
  cd?: string;
}

interface PoliteianetEntity {
  entityToken?: PoliteianetProduct;
}

function extractContributor(
  product: PoliteianetProduct | undefined,
  predicate: (entry: PoliteianetContributor) => boolean,
): string | undefined {
  if (!product || !Array.isArray(product.contributors)) {
    return undefined;
  }
  const entry = product.contributors.find(predicate);
  if (!entry) {
    return undefined;
  }
  return (
    normaliseString(entry.comb_name) ??
    normaliseString(entry.contributorName) ??
    normaliseString(entry.contributorSurname)
  );
}

function mapPoliteianetProduct(product: PoliteianetProduct | null): ScrapePayload | null {
  if (!product) {
    return null;
  }

  const title = normaliseString(product.nm) ?? normaliseString(product.btrl?.nm);
  let isbn = normaliseString(product.bc) ?? normaliseString(product.barcodes);
  const description = normaliseString(product.dsm) ?? normaliseString(product.btrl?.dsm);
  const publicationDate = formatPoliteianetDate(product.release ?? product.publish_date);
  const author = extractContributor(
    product,
    (entry) =>
      entry.contributorCategoryCode === 'author' ||
      Boolean(entry.contributorCategoryName?.toLowerCase().includes('συγγραφ')),
  );
  const publisher = extractContributor(
    product,
    (entry) =>
      entry.contributorCategoryCode === 'publisher' ||
      Boolean(entry.contributorCategoryName?.toLowerCase().includes('εκδότη')),
  );
  const coverUrl = normaliseString(product.img1);

  if (!isbn) {
    const code = normaliseString(product.cd);
    if (code) {
      isbn = code;
    }
  }

  return {
    title,
    isbn,
    description,
    publicationDate,
    author,
    publisher,
    coverUrl,
  };
}

async function searchPoliteianet(query: string): Promise<ScrapePayload | null> {
  const searchTerm = normaliseString(query);
  if (!searchTerm) {
    throw new Error('Δεν δόθηκε όρος αναζήτησης για την Πολιτεία.');
  }

  const apiKey =
    normaliseString(process.env.POLITEIA_API_KEY) ?? POLITEIA_DEFAULT_API_KEY;
  const url = new URL(POLITEIA_SEARCH_URL);
  url.searchParams.set('q', searchTerm);
  url.searchParams.set('enrich', 'true');
  url.searchParams.set('psize', '1');

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-bizweb-apikey': apiKey,
        Accept: 'application/json',
        'Accept-Language': 'el-GR,el;q=0.9,en;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        Referer: 'https://www.politeianet.gr/',
      },
    });
  } catch {
    throw new Error('Αποτυχία επικοινωνίας με την Πολιτεία.');
  }

  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ error: 'Αποτυχία επικοινωνίας με την Πολιτεία.' }));
    const errorMessage =
      (payload as { detail?: string; error?: string })?.detail ??
      (payload as { detail?: string; error?: string })?.error ??
      `Η Πολιτεία επέστρεψε σφάλμα (${response.status}).`;
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as { prds?: PoliteianetProduct[] } | null;
  const product = Array.isArray(data?.prds) ? data?.prds[0] ?? null : null;
  if (!product) {
    return null;
  }

  return mapPoliteianetProduct(product);
}

export async function scrapePoliteianetByIsbn(isbn: string): Promise<ScrapePayload | null> {
  return searchPoliteianet(isbn);
}

export async function scrapePoliteianetByTitle(title: string): Promise<ScrapePayload | null> {
  return searchPoliteianet(title);
}

function extractBarcodeFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const match = `${url}`.match(/(\d{13})/);
  return match ? match[1] : null;
}

function extractPreloadedEntity(html: string): PoliteianetEntity | null {
  const match = html.match(
    /__BW_PRELOADED_DATA__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/i,
  );
  if (!match) {
    return null;
  }
  try {
    const data = JSON.parse(match[1]) as PoliteianetEntity;
    if (data && typeof data === 'object' && data.entityToken) {
      return data;
    }
  } catch (error) {
    console.error('Failed to parse Politeianet preloaded data', error);
  }
  return null;
}

export async function scrapePoliteianetByUrl(url: string): Promise<ScrapePayload | null> {
  const barcode = extractBarcodeFromUrl(url);
  const response = await fetch(url, {
    headers:
      {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept-Language': 'el-GR,el;q=0.9,en;q=0.8',
      },
  });

  if (!response.ok) {
    if (barcode) {
      return searchPoliteianet(barcode);
    }
    throw new Error(`Η Πολιτεία επέστρεψε σφάλμα (${response.status}).`);
  }

  const html = await response.text();
  const entity = extractPreloadedEntity(html);

  if (entity?.entityToken) {
    const mapped = mapPoliteianetProduct(entity.entityToken);
    if (mapped) {
      if (!mapped.isbn && barcode) {
        mapped.isbn = barcode;
      }
      return mapped;
    }
  }

  if (barcode) {
    return searchPoliteianet(barcode);
  }

  throw new Error('Δεν βρέθηκαν στοιχεία στο link της Πολιτείας.');
}

function cleanText(value?: string | null): string | undefined {
  if (!value) return undefined;
  return decodeHtml(value).replace(/\s+/g, ' ').trim();
}

function stripHtml(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
}

function decodeHtml(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#xA0;/gi, ' ')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function matchOne(html: string, pattern: string, flags = 'i'): string | undefined {
  const regex = new RegExp(pattern, flags);
  const match = html.match(regex);
  return match ? cleanText(match[1]) : undefined;
}

function extractDynamicImage(html: string): string | undefined {
  const match = html.match(/data-a-dynamic-image="({[^\"]+})"/);
  if (!match) {
    const fallback = html.match(/src="(https:[^"]+\.jpg)"[^>]*id="landingImage"/);
    return fallback ? cleanText(fallback[1]) : undefined;
  }
  try {
    const json = match[1].replace(/&quot;/g, '"');
    const images = JSON.parse(json) as Record<string, unknown>;
    const [first] = Object.keys(images);
    return first ?? undefined;
  } catch {
    return undefined;
  }
}

function extractDetail(html: string, label: string): string | undefined {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = `${escapedLabel}[^<]*<\\/span>\\s*<span[^>]*>\\s*([^<]+)`;
  return matchOne(html, pattern, 'i');
}

function parseAmazonProductDetails(html: string): {
  publisher?: string;
  publicationDate?: string;
  isbn13?: string;
  language?: string;
} {
  const publisherRaw =
    extractDetail(html, 'Publisher') ?? extractDetail(html, 'Publisher ‎') ?? undefined;
  let publisher: string | undefined;
  let publicationDate: string | undefined;
  if (publisherRaw) {
    const parts = publisherRaw.split(';');
    publisher = cleanText(parts[0]);
    const dateMatch = publisherRaw.match(/\(([^)]+)\)/);
    if (dateMatch) {
      publicationDate = cleanText(dateMatch[1]);
    }
  }

  const explicitPublicationDate =
    extractDetail(html, 'Publication date') ?? extractDetail(html, 'Publication date ‎');
  if (explicitPublicationDate) {
    publicationDate = cleanText(explicitPublicationDate);
  }

  const isbnRaw =
    extractDetail(html, 'ISBN-13') ?? extractDetail(html, 'ISBN-13 ‎') ?? undefined;

  const language =
    extractDetail(html, 'Language') ?? extractDetail(html, 'Language ‎') ?? undefined;

  return {
    publisher,
    publicationDate,
    isbn13: isbnRaw ? isbnRaw.replace(/[^0-9xX]/g, '') : undefined,
    language,
  };
}

function extractAmazonDescription(html: string): string | undefined {
  const descriptionMatch = html.match(
    /<div id="bookDescription_feature_div"[\s\S]*?(?:<span[^>]*>([\s\S]*?)<\/span>|<noscript>\s*<div[^>]*>([\s\S]*?)<\/div>\s*<\/noscript>)/i,
  );
  if (descriptionMatch) {
    const raw = descriptionMatch[1] ?? descriptionMatch[2];
    const stripped = stripHtml(raw);
    const text = cleanText(stripped);
    if (text) {
      return text;
    }
  }

  const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if (metaMatch) {
    const text = cleanText(metaMatch[1]);
    if (text) {
      return text;
    }
  }

  return undefined;
}

const AMAZON_BASE_URL = 'https://www.amazon.com';

export async function scrapeAmazonByUrl(url: string): Promise<ScrapePayload | null> {
  const trimmedUrl = `${url ?? ''}`.trim();
  if (!trimmedUrl) {
    throw new Error('Δεν δόθηκε link για το Amazon.');
  }

  const response = await fetch(trimmedUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,el;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Το Amazon επέστρεψε σφάλμα (${response.status}).`);
  }

  const html = await response.text();

  const title = matchOne(html, '<span[^>]*id="productTitle"[^>]*>([\\s\\S]*?)<\\/span>');
  const author =
    matchOne(html, '<span[^>]*class="author[^>]*>\\s*<a[^>]*>([\\s\\S]*?)<\\/a>') ??
    matchOne(html, '<span[^>]*class="contributorNameID"[^>]*>([\\s\\S]*?)<\\/span>');

  const imageUrl = extractDynamicImage(html);
  const { publisher, publicationDate, isbn13, language } = parseAmazonProductDetails(html);
  const description = extractAmazonDescription(html);

  return {
    title,
    author,
    publisher,
    publicationDate,
    isbn: isbn13,
    language,
    coverUrl: imageUrl,
    description,
  };
}

async function scrapeAmazonByIsbn(isbn: string): Promise<ScrapePayload | null> {
  const trimmed = `${isbn ?? ''}`.trim();
  if (!trimmed) {
    throw new Error('Απαιτείται ISBN για αναζήτηση στο Amazon.');
  }

  const searchUrl = `${AMAZON_BASE_URL}/s?k=${encodeURIComponent(trimmed)}&i=stripbooks-intl-ship`;
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,el;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Το Amazon επέστρεψε σφάλμα (${response.status}).`);
  }

  const html = await response.text();
  const asinMatch = [...html.matchAll(/data-asin="([A-Z0-9]{10})"/g)].find(
    ([, asin]) => asin && asin !== '0000000000',
  );

  if (!asinMatch) {
    throw new Error('Δεν βρέθηκε προϊόν στο Amazon για αυτό το ISBN.');
  }

  const asin = asinMatch[1];
  const productUrl = new URL(`/dp/${asin}`, AMAZON_BASE_URL).href;
  return scrapeAmazonByUrl(productUrl);
}

type ScraperResolver = (
  value: string,
) => Promise<ScrapePayload | null>;

type ScraperRegistry = Partial<Record<ScraperMode, ScraperResolver>>;

const SCRAPERS: Record<SourceKey, ScraperRegistry> = {
  biblionet: {
    isbn: scrapeBiblionetByIsbn,
    title: scrapeBiblionetByTitle,
    url: scrapeBiblionetByUrl,
  },
  politeia: {
    isbn: scrapePoliteianetByIsbn,
    title: scrapePoliteianetByTitle,
    url: scrapePoliteianetByUrl,
  },
  amazon: {
    isbn: scrapeAmazonByIsbn,
    url: scrapeAmazonByUrl,
  },
};

export async function runScraper(
  source: SourceKey,
  mode: ScraperMode,
  value: string,
): Promise<ScrapePayload | null> {
  const resolver = SCRAPERS[source]?.[mode];
  if (!resolver) {
    throw new Error('Η συγκεκριμένη αναζήτηση δεν υποστηρίζεται.');
  }

  return resolver(value);
}
