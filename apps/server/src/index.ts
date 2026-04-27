/* eslint-disable max-statements, complexity, sonarjs/cognitive-complexity, unicorn/prevent-abbreviations, unicorn/prefer-set-has, no-secrets/no-secrets, prettier/prettier, unicorn/prefer-node-protocol, @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports */
import { createServer } from '@vue-storefront/middleware';
import consola from 'consola';
import config from '../middleware.config';
import https from "https";
import http from "http";
import cors from "cors";
import { runScraper, type ScraperMode, type SourceKey } from './scanner';
import { scrapeBiblionetSearch } from './biblionet';
import { scrapeMetabookSearch } from './metabook';
import { getPuppeteer } from './scanner';

const SCANNER_SOURCES = new Set<SourceKey>(['biblionet', 'politeia', 'amazon']);
const SCANNER_LABEL: Record<SourceKey, string> = {
  biblionet: 'στο Biblionet',
  politeia: 'στην Πολιτεία',
  amazon: 'στο Amazon',
};

const normalizeOrigin = (value: string): string => {
  try {
    return new URL(value).origin;
  } catch {
    return value.trim().replace(/\/+$/, '');
  }
};

const isTrustedDomainOrigin = (origin: string): boolean => {
  try {
    const parsed = new URL(origin);
    return parsed.hostname === 'notia-evia.gr' || parsed.hostname.endsWith('.notia-evia.gr');
  } catch {
    return false;
  }
};


(async () => {
  const app = await createServer({ integrations: config.integrations });
  const host = process.argv[2] ?? '::';
  const port = Number(process.argv[3]) || 4000;

  const allowedOrigins = new Set<string>([
    'https://librarian.notia-evia.gr',
    'https://www.librarian.notia-evia.gr',
    ...(process.env.MIDDLEWARE_ALLOWED_ORIGINS?.split(',')
      .map((entry) => normalizeOrigin(entry))
      .filter(Boolean) ?? []),
  ].map((origin) => normalizeOrigin(origin)));

  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.add('http://localhost:3000');
  }

  const isAllowedOrigin = (origin: string): boolean => {
    const normalized = normalizeOrigin(origin);
    return allowedOrigins.has(normalized) || isTrustedDomainOrigin(normalized);
  };

  // Add CORS headers early so even error responses keep ACAO for allowed origins.
  app.use((req, res, next) => {
    const originHeader = req.headers.origin;
    const origin = typeof originHeader === 'string' ? normalizeOrigin(originHeader) : undefined;

    if (origin && isAllowedOrigin(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.header('Vary', 'Origin');
    }

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const normalized = normalizeOrigin(origin);
        callback(null, isAllowedOrigin(normalized));
      },
      credentials: true,
    }),
  );

  // Dedicated CORS guard for metabook endpoint so browser can always read 4xx/5xx JSON.
  app.use('/metabook-search', (req, res, next) => {
    const originHeader = req.headers.origin;
    const origin = typeof originHeader === 'string' ? normalizeOrigin(originHeader) : '';

    if (origin && isAllowedOrigin(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  });

  app.listen(port, host, () => {
    consola.success(`API server listening on https://localhost:${port}`);
  });


  app.get('/scanner-health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/scanner-api-scrape', async (req, res) => {
    const mode: ScraperMode =
      req.body?.mode === 'title' ? 'title' : req.body?.mode === 'url' ? 'url' : 'isbn';

    const rawSource = `${req.body?.source ?? ''}`.trim().toLowerCase();
    const source: SourceKey = SCANNER_SOURCES.has(rawSource as SourceKey)
      ? (rawSource as SourceKey)
      : 'biblionet';

    const query = `${req.body?.query ?? ''}`.trim();
    const isbn = `${req.body?.isbn ?? ''}`.trim();

    if (mode === 'isbn' && !isbn) {
      res.status(400).json({ error: 'Απαιτείται ISBN για τη συγκεκριμένη αναζήτηση.' });
      return;
    }

    if (mode !== 'isbn' && !query) {
      res.status(400).json({ error: 'Απαιτείται όρος αναζήτησης.' });
      return;
    }

    const lookupValue = mode === 'isbn' ? isbn : query;

    try {
      const scraped = await runScraper(source, mode, lookupValue);
      
      if (!scraped) {
        res.status(404).json({
          error: `Δεν βρέθηκαν αποτελέσματα ${SCANNER_LABEL[source] ?? 'στην πηγή'}.`,
        });
        return;
      }

      res.json({
        success: true,
        source,
        mode,
        scraped,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Παρουσιάστηκε σφάλμα κατά την αναζήτηση.';
      res.status(500).json({ error: message });
    }
  });


  app.post('/biblionet-search', async (req, res) => {
    const query = `${req.body?.query ?? ''}`.trim();
    if (!query) {
      res.status(400).json({ error: 'Απαιτείται όρος αναζήτησης.' });
      return;
    }
    try {
      const { results, rawCount } = await scrapeBiblionetSearch(query);
      res.json({ success: true, total: results.length, rawCount, results });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Σφάλμα κατά την αναζήτηση.';
      res.status(500).json({ error: message });
    }
  });


  app.post('/metabook-search', async (req, res) => {
    const originHeader = req.headers.origin;
    const origin = typeof originHeader === 'string' ? normalizeOrigin(originHeader) : '';
    if (origin && isAllowedOrigin(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    const query = `${req.body?.query ?? ''}`.trim();
    if (!query) {
      res.status(400).json({ error: 'Απαιτείται όρος αναζήτησης.' });
      return;
    }
    try {
      const { results, rawCount } = await scrapeMetabookSearch(query);
      res.json({ success: true, total: results.length, rawCount, results });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Σφάλμα κατά την αναζήτηση.';
      res.status(500).json({ error: message });
    }
  });

  /**
   * Debug endpoint — runs the exact same Puppeteer flow as metabook-search
   * (navigate, wait for CF, then dumps title + first 30k chars of HTML) so
   * you can see what the VPS browser actually renders.
   *
   * GET /debug-metabook
   */
  app.get('/debug-metabook', async (_req, res) => {
    try {
      const { default: puppeteer } = await getPuppeteer();
      const browser = await puppeteer.launch({
        headless: 'new' as any,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
      });
      try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(45_000);
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        );
        await page.goto('https://metabook.gr', { waitUntil: 'domcontentloaded' });

        // Wait for CF challenge to clear (up to 25s)
        for (let i = 0; i < 25; i++) {
          const title = await page.title();
          if (!title.toLowerCase().includes('moment')) break;
          await new Promise(r => setTimeout(r, 1000));
        }

        // Extra wait for JS to render
        await new Promise(r => setTimeout(r, 3000));

        const info = await page.evaluate(() => {
          const allInputs = Array.from(document.querySelectorAll('input')).map((el) => ({
            id: el.id,
            name: el.name,
            type: el.type,
            className: el.className,
            placeholder: el.placeholder,
          }));
          const allForms = Array.from(document.querySelectorAll('form')).map((f) => ({
            id: f.id,
            className: f.className,
            inputCount: f.querySelectorAll('input').length,
          }));
          return {
            title: document.title,
            url: location.href,
            bodyLength: document.body.innerHTML.length,
            inputs: allInputs,
            forms: allForms,
            bodySnippet: document.body.innerHTML.slice(0, 30_000),
          };
        });

        res.json(info);
      } finally {
        await browser.close();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Debug failed.';
      res.status(500).json({ error: message });
    }
  });

  /**
   * Debug endpoint — use this to inspect the live DOM of any page so you can
   * find the correct CSS selectors for your scrapers.
   *
   * POST /debug-page
   * { "url": "https://metabook.gr/search/?query=test", "waitMs": 3000 }
   *
   * Returns: page title, unique class names, tag frequencies, and a snippet
   * of the body HTML so you can copy-paste the right selectors.
   */
  app.post('/debug-page', async (req, res) => {
    const url = `${req.body?.url ?? ''}`.trim();
    if (!url) {
      res.status(400).json({ error: 'Απαιτείται URL.' });
      return;
    }
    const extraWaitMs = Math.min(Number(req.body?.waitMs ?? 3000), 15_000);
    try {
      const { default: puppeteer } = await getPuppeteer();
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(30_000);
        await page.setRequestInterception(true);
        page.on('request', (r) => {
          if (r.resourceType() === 'image' || r.resourceType() === 'media') {
            r.abort();
          } else {
            r.continue();
          }
        });
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        );
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        // Wait extra ms for JS/SPA to render
        await new Promise((r) => setTimeout(r, extraWaitMs));

        const info = await page.evaluate(() => {
          const allEls = Array.from(document.querySelectorAll('*'));
          const classSet = new Set<string>();
          const tagCount: Record<string, number> = {};
          for (const el of allEls) {
            for (const c of Array.from(el.classList)) classSet.add(c);
            tagCount[el.tagName] = (tagCount[el.tagName] ?? 0) + 1;
          }
          return {
            title: document.title,
            url: location.href,
            bodyLength: document.body.innerHTML.length,
            // first 20 000 chars of body HTML — more context than 8000
            bodySnippet: document.body.innerHTML.slice(0, 20_000),
            allClasses: Array.from(classSet).sort(),
            tagFrequency: Object.entries(tagCount)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 30)
              .reduce<Record<string, number>>((acc, [k, v]) => { acc[k] = v; return acc; }, {}),
          };
        });

        // Optional: test CSS selectors and return outerHTML of first match
        const selectorsToTest: string[] = Array.isArray(req.body?.selectorDetails)
          ? (req.body.selectorDetails as string[]).slice(0, 5)
          : [];

        const selectorResults: Record<string, { count: number; firstHtml: string }> = {};
        for (const sel of selectorsToTest) {
          try {
            const detail = await page.evaluate((s: string) => {
              const els = Array.from(document.querySelectorAll(s));
              return { count: els.length, firstHtml: els[0]?.outerHTML?.slice(0, 3000) ?? '' };
            }, sel);
            selectorResults[sel] = detail;
          } catch {
            selectorResults[sel] = { count: -1, firstHtml: 'error evaluating selector' };
          }
        }

        res.json({ ...info, selectorResults });
      } finally {
        await browser.close();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Σφάλμα.';
      res.status(500).json({ error: message });
    }
  });


  app.post('/search-inside', (req, res) => {
    const data =  JSON.stringify(req.body)      //   {
                                                //     title: "Ένας τάφος για τη Νέα Υόρκη",
                                                //     publisher: "Πατάκης"
                                                //   }
    const options = {
      host: "api.notia-evia.gr",
      // host: "yourdomain.gr",
      path: "/rest/V1/custom/search-inside/title",
      method: "POST",
      headers: {
        "Content-Type": " application/json; charset=UTF-8",
      }
    };

    const httpreq = https.request(options, function (response) {
      let body="";
      response.on('data', function (chunk) {
        body += chunk
      });
      response.on('end', ()=> {
        res.send(body);
      })
    });

    httpreq.write(data)
    httpreq.end();


  })


  app.post('/create-book', (req, res) => {
    const dataPost = JSON.stringify( req.body )         // const dataPost = JSON.stringify( {
                                                        //   "customer_id": "5",
                                                        //   "title": "1985"
                                                        // } )
    const options = {
      host: "api.notia-evia.gr",
      // host: "yourdomain.gr",
      path: "/rest/V1/custom/create-book/new",
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        'Content-Length': Buffer.byteLength(dataPost),
      }
    };

    const request2 = https.request(options, function (response) {
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        res.send(chunk)
      });

    });
    request2.write(dataPost);
    request2.end();

  })





  app.post('/get-subject-book-from-biblionet', (req, res) => {
    const dataPost4 = JSON.stringify(req.body);                //  const dataPost4 = JSON.stringify( {
                                                               //       "username" : "evangelos.karakaxis@gmail.com",
                                                               //       "password" : "testing123",
    const options = {                                          //       "title": "195086"
      host: "biblionet.gr",                                    //   })
      path: "/webservice/get_title_subject",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      }
    };
    const request4 = https.request(options, function (response) {
      response.setEncoding('utf8');
      let body="";
      response.on('data', function (chunk) {
        body = body + chunk.toString();  // aggregate data
      })
      response.on('end', () => {
        res.send(body)
      })
    });
    request4.write( dataPost4);
    request4.end();


  })


  app.post('/get-book-from-biblionet', (req, res) => {
    const dataPost = JSON.stringify(req.body);                  // const dataPost = {
                                                                //   "username" : "evangelos.karakaxis@gmail.com",
    const options = {                                           //   "password" : "testing123",
      host: "biblionet.gr",                                     //   "isbn": "9789608104556"
      path: "/webservice/get_title",                            // };
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      }
    };

    // Create the HTTP request
    const request3 = https.request(options, function (response) {
      response.setEncoding('utf8');
      let body="";
      response.on('data', function (chunk) {
        body = body + chunk.toString();  // aggregate data
      })
      response.on('end', () => {
        res.send(body)
      })
    });
    request3.write(dataPost);
    request3.end();

  })

  app.post('/search-on-metabook', (req, res) => {
    const dataPost = JSON.stringify(req.body);

    // let params = {
    //   title: encodeURI('ευβοια'),
    // }

    const options = {
      host: "mfw8zwu0fg-3.algolianet.com",
      path: `/1/indexes/prod_books/query?x-algolia-application-id=MFW8ZWU0FG&x-algolia-api-key=3c7ba3072f502593366031d90398b9db`,                            // };
      method: "POST",
      headers: {
        'Accept': '*/*',
        'Content-Type': "application/json;charset=UTF-8"
      }
    };

    // Create the HTTP request
    const request = https.request(options, function (response) {
      let body="";
      response.on('data', function (chunk) {
        body = body + chunk;  // aggregate data
        // res.send(chunk)
      })
      response.on('end', () => {
        res.send(body)
      })
    });
    request.write(dataPost);
    request.end();

  })

})();
