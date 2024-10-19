import { createServer } from '@vue-storefront/middleware';
import consola from 'consola';
import config from '../middleware.config';
import https from "https";
import http from "http";
import {response} from "express";

(async () => {
  const app = await createServer({ integrations: config.integrations });
  const host = process.argv[2] ?? '::';
  const port = Number(process.argv[3]) || 4000;

  app.listen(port, host, () => {
    consola.success(`API server listening on http://localhost:${port}`);
  });

  app.post('/hello', (req, res) => {
    const data = [{
      id: "2",
      title: "1984",
      description: "George Orwell",
      content: "Something good",
    }]

    console.log(req.body)

    const options = {
      host: "api.notia-evia.gr",
      // host: "evia.pyconero.gr",
      path: "/rest/V1/custom/search-inside/kati",
      method: "POST",
      headers: {
        "Content-Type": " application/json; charset=UTF-8",
      }
    };

    const httpreq = https.request(options, function (response) {
      response.on('data', function (chunk) {
        let str = JSON.stringify(chunk)
        console.log("body: " + chunk);
        res.send( chunk )
      });

    });
    res.end(JSON.stringify({
      data: 'Hello World!',
    }));

  })

  app.post('/create-book', (req, res) => {

    const dataPost = JSON.stringify( req.body )
    // const dataPost = JSON.stringify( {
    //   "customer_id": "5",
    //   "title": "1985"
    // } )
    const options = {
      host: "api.notia-evia.gr",
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
        console.log("body: " + chunk);
        res.send( chunk )
      });

    });
    request2.write(dataPost);
    request2.end();

  })

  app.post('/get-book-from-biblionet', (req, res) => {

    const dataPost = req.body;
    // const dataPost = {
    //   "username" : "evangelos.karakaxis@gmail.com",
    //   "password" : "testing123",
    //   "year" : "2023",
    //   "month" : "8",
    //   "titles_per_page" : "3"
    // };

    const options = {
      host: "biblionet.gr",
      path: "/webservice/get_month_titles",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 'Content-Length': Buffer.byteLength(dataPost)
      }
    };

    // Create the HTTP request
    const request = https.request(options, function (response) {
      response.setEncoding('utf8');
      response.on('data', function (chunk) {
        let str = JSON.stringify(chunk)
        // console.log("body: " + chunk);
        res.send( str )
      });

    });
    request.write( JSON.stringify(dataPost) );
    // request.end( );
    res.end(JSON.stringify({
      data: response.json,
    }));

  })

})();
