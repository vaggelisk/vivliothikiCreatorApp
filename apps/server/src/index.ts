import { createServer } from '@vue-storefront/middleware';
import consola from 'consola';
import config from '../middleware.config';
import https from "https";
import http from "http";
import cors from "cors";


(async () => {
  const app = await createServer({ integrations: config.integrations });
  const host = process.argv[2] ?? '::';
  const port = Number(process.argv[3]) || 4000;

  app.use(cors({
        origin: [
            "https://librarian.notia-evia.gr",
            // ...(process.env.MIDDLEWARE_ALLOWED_ORIGINS?.split(",") ?? []),
        ],
        credentials: true,
      }

  ));

  app.listen(port, host, () => {
    consola.success(`API server listening on https://localhost:${port}`);
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
        let str = JSON.stringify(chunk)
        res.send( chunk )
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
