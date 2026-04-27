/* eslint-disable max-statements, complexity, sonarjs/cognitive-complexity, unicorn/prevent-abbreviations, prettier/prettier */

export interface BiblionetResult {
  title: string;
  isbn: string | null;
  author: string | null;
  publisher: string | null;
  photo: string | null;
  url: string | null;
}

export interface BiblionetSearchPayload {
  results: BiblionetResult[];
  /** Number of card elements found before title filtering — useful for debugging 0 results. */
  rawCount: number;
}

const BIBLIONET_ORIGIN = 'https://www.biblionet.gr';

/** Decode HTML entities for common cases we encounter in biblionet titles/authors. */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Strip HTML tags from a string. */
function stripTags(str: string): string {
  return str.replace(/<[^>]+>/g, '');
}

/**
 * biblionet.gr is a traditional server-side PHP/HTML site — results are fully
 * present in the initial HTML response with no JavaScript rendering required.
 * We fetch the search results page directly with a plain HTTP request, which
 * is an order of magnitude faster than launching a browser.
 *
 * Real DOM structure (confirmed from live page):
 *   div.row.book.product-thumb-info-list
 *     div.col-md-6.col-lg-4.col-sm-12
 *       div.product.book-card.mb-4
 *         div.product-thumb-info
 *           div.product-thumb-info-image
 *             a.image_cover_a[href="/book-slug-ID"]
 *             img.sb_img[src="/assets/images/books/..."]
 *           div.mt-4
 *             h3.book-title > a.book-title[href="/book-slug-ID"]  ← title & url
 *             a.text-color-secondary[href="/author-slug"]         ← author
 *             span.text-cod-block                                 ← "ISBN: 978-..."
 */
export async function scrapeBiblionetSearch(query: string): Promise<BiblionetSearchPayload> {
  const searchTerm = `${query ?? ''}`.trim();
  if (!searchTerm) {
    throw new Error('Απαιτείται όρος αναζήτησης για το Biblionet.');
  }

  const searchUrl = new URL('/συνθετη-αναζητηση', BIBLIONET_ORIGIN);
  searchUrl.searchParams.set('q', searchTerm);

  const response = await fetch(searchUrl.toString(), {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'el-GR,el;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Biblionet returned HTTP ${response.status}`);
  }

  const html = await response.text();

  // Split by book card divs. Each card starts with class containing "product book-card".
  const cardSections = html.split(/(?=<div[^>]*class="[^"]*\bbook-card\b[^"]*")/);
  // First section is the page header — skip it; remaining sections are one card each.
  const cardBlocks = cardSections.slice(1);
  const rawCount = cardBlocks.length;

  const items: BiblionetResult[] = cardBlocks.slice(0, 30).map((block) => {
    // Title & URL: <a ... class="book-title ..." href="/slug">Title</a>
    const titleMatch = block.match(/class="[^"]*\bbook-title\b[^"]*"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/);
    const altTitleMatch = block.match(/href="([^"]+)"\s+class="[^"]*\bbook-title\b[^"]*"[^>]*>([^<]+)<\/a>/);
    const titleHref = titleMatch?.[1] ?? altTitleMatch?.[1] ?? null;
    const titleText = decodeHtmlEntities(stripTags(titleMatch?.[2] ?? altTitleMatch?.[2] ?? '').trim());

    let url: string | null = null;
    if (titleHref) {
      try { url = new URL(titleHref, BIBLIONET_ORIGIN).href; } catch { url = BIBLIONET_ORIGIN + titleHref; }
    }

    // Author: first <a> with class "text-color-secondary" (author link, appears after title)
    const authorMatch = block.match(/class="[^"]*\btext-color-secondary\b[^"]*"[^>]*>([^<]+)<\/a>/);
    const author = authorMatch ? decodeHtmlEntities(authorMatch[1].trim()) : null;

    // Publisher (Εκδότης): <a>...</a> inside span containing "Εκδότης:"
    // Pattern: "Εκδότης:" followed by <a>PublisherName</a>
    const publisherMatch = block.match(/Εκδότης:\s*<a[^>]*>([^<]+)<\/a>/);
    const publisher = publisherMatch ? decodeHtmlEntities(publisherMatch[1].trim()) : null;

    // ISBN: span containing "ISBN: 978..."
    const isbnMatch = block.match(/ISBN:\s*(97[89][\d\-]+)/);
    const isbn = isbnMatch ? isbnMatch[1].replace(/-/g, '') : null;

    // Photo: img.sb_img src attribute
    const imgMatch = block.match(/class="[^"]*\bsb_img\b[^"]*"\s+src="([^"]+)"/);
    const altImgMatch = block.match(/src="([^"]+)"\s+[^>]*class="[^"]*\bsb_img\b[^"]*"/);
    const rawSrc = imgMatch?.[1] ?? altImgMatch?.[1] ?? null;
    let photo: string | null = null;
    if (rawSrc && !rawSrc.startsWith('data:')) {
      try { photo = new URL(rawSrc, BIBLIONET_ORIGIN).href; } catch { photo = rawSrc; }
    }

    return { title: titleText, isbn, author, publisher, photo, url };
  });

  const results = items.filter((r) => r.title.length > 0);
  return { results, rawCount };
}
