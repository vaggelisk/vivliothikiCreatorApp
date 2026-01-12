import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { CategoryFilters, CategoryPageContent, CategorySorting } from '~/components';
import { createGetServerSideProps } from '~/helpers';
import { prefetchProducts, useProducts } from '~/hooks';
import { DefaultLayout } from '~/layouts';
import axios from "axios";
import {useEffect, useState} from "react";
import { sum, uniqWith } from "lodash";
import { getLibrarianApiBaseUrl } from '~/helpers/api';


type ProductKantro = {
  store_id: string;
  sku: string;
  status: Number;
  status_value: string;
  visibility: Number;
  is_visible_in_front: Number;
  review_count: Number;
  name: string;
  url_key: string;
  isbn: string;
  publisher: string;
  author: string;
}

const axiosInstance = axios.create({
  baseURL: getLibrarianApiBaseUrl(),
});



export const getServerSideProps = createGetServerSideProps({ i18nNamespaces: ['category'] }, async (context) => {

  context.res.setHeader('Cache-Control', 'no-cache');
  let search = context.query.search;
  // const products = await prefetchProducts(context, search);
  // const products = await prefetchProducts(context, search);
  // const products = []
  return { props: {} };
});

export default function SearchOnMetaPage() {
  const { t } = useTranslation('category');
  const { query, route } = useRouter();
  const [error, setError] = useState(null);
  // const { data: productsCatalog } = useProducts();
  const [productsKantro, setProductsKantro] = useState<ProductKantro[] | undefined>([])


  const dataPost3 = {
    "params": 'query='+query?.search+'&hitsPerPage=10'
  }

  useEffect(() => {
    axiosInstance.post(
        '/search-on-metabook',
        dataPost3,
        {
          headers: {
            "Content-Type": 'application/json',
          }
        },
    ).then((response) => {
      if (response.status >= 400) {
        throw new Error("server error");
      }
      if (response.data) {
        let responseProductKantro: ProductKantro[] = response.data?.hits.map((responseProductKantro: any) => {
          return {
            name: responseProductKantro.title,
            author: responseProductKantro?.authors[0],
            publisher: responseProductKantro?.publisher,
            thumbnail: {
              url: responseProductKantro.cover_url,
              alt: responseProductKantro.title
            },
            review_count: 13,
            url_key: responseProductKantro.url_key,
            isbn: responseProductKantro?.isbn_13,
            id: responseProductKantro?.objectID
          }
        })
        if (responseProductKantro) {
          setProductsKantro( uniqWith(responseProductKantro, (a, b) => {
              return (a.name===b.name && a.isbn===b.isbn && a.author===b.author )
            })
          )
        }
      } else {
        setProductsKantro(response.data)
      }
    }).catch((error) => setError(error))
      .finally(() =>console.log(productsKantro?.length));
  }, []);

  const categoryTitle = 'Αποτελέσματα στο metabook για '+'"'+query?.search+'"';

  return (
    <DefaultLayout >
      <CategoryPageContent
        title={categoryTitle}
        comeFromCreator={''}
        comeFromMeta={false}
        currentScreen={route}
        book={query.data ? JSON.parse(query?.data.toString()) : {}}
        isbn={query.isbn ? query.isbn.toString() : ''}
        products={productsKantro || Array()}
        totalProducts={productsKantro ? productsKantro.length : 0}
        sidebar={
          <>
            <CategorySorting />
          </>
        }
      />
    </DefaultLayout>
  );
}
