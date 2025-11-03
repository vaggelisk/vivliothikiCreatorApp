/* eslint-disable max-statements, complexity, sonarjs/cognitive-complexity, unicorn/prevent-abbreviations, unicorn/prefer-set-has, no-secrets/no-secrets, prettier/prettier, unicorn/prefer-node-protocol, @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports */
import { createServer } from '@vue-storefront/middleware';
import consola from 'consola';
import config from '../middleware.config';
import https from "https";
import http from "http";
import cors from "cors";
import { runScraper, type ScraperMode, type SourceKey } from './scanner';

const SCANNER_SOURCES = new Set<SourceKey>(['biblionet', 'politeia', 'amazon']);
const SCANNER_LABEL: Record<SourceKey, string> = {
  biblionet: 'στο Biblionet',
  politeia: 'στην Πολιτεία',
  amazon: 'στο Amazon',
};


(async () => {
  const app = await createServer({ integrations: config.integrations });
  const host = process.argv[2] ?? '::';
  const port = Number(process.argv[3]) || 4000;

  const allowedOrigins = new Set<string>([
    'https://librarian.notia-evia.gr',
    ...(process.env.MIDDLEWARE_ALLOWED_ORIGINS?.split(',')
      .map((entry) => entry.trim())
      .filter(Boolean) ?? []),
  ]);

  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.add('http://localhost:3000');
  }

  app.use(
    cors({
      origin: [...allowedOrigins],
      credentials: true,
    }),
  );

  app.listen(port, host, () => {
    consola.success(`API server listening on https://localhost:${port}`);
  });

  app.get('/scanner/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/scanner/api/scrape', async (req, res) => {
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
