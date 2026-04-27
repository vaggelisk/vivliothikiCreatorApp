import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { CategoryFilters, CategoryPageContent, CategorySorting } from '~/components';
import { createGetServerSideProps } from '~/helpers';
import { prefetchProducts, useProducts } from '~/hooks';
import { DefaultLayout } from '~/layouts';
import axios from "axios";
import {useEffect, useState} from "react";
import { SfLoaderCircular } from '@storefront-ui/react';
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
  const [loading, setLoading] = useState(true);
  // const { data: productsCatalog } = useProducts();
  const [productsKantro, setProductsKantro] = useState<ProductKantro[] | undefined>([])


  useEffect(() => {
    const searchTerm = query?.search;
    if (!searchTerm) return;

    setLoading(true);
    axiosInstance.post(
        '/biblionet-search',
        { query: searchTerm },
        {
          headers: {
            "Content-Type": 'application/json',
          }
        },
    ).then((response) => {
      if (response.status >= 400) {
        throw new Error("server error");
      }
      if (response.data?.results) {
        let responseProductKantro: ProductKantro[] = response.data.results.map((item: any) => {
          return {
            name: item.title,
            author: item.author,
            publisher: item.publisher,
            thumbnail: {
              url: item.photo,
              alt: item.title
            },
            review_count: 13,
            url_key: item.url,
            isbn: item.isbn,
            id: item.isbn
          }
        })
        if (responseProductKantro) {
          setProductsKantro( uniqWith(responseProductKantro, (a, b) => {
              return (a.name===b.name && a.isbn===b.isbn && a.author===b.author )
            })
          )
        }
      } else {
        setProductsKantro([])
      }
    }).catch((error) => setError(error))
      .finally(() => {
        setLoading(false);
        console.log(productsKantro?.length);
      });
  }, []);

  const categoryTitle = 'Αποτελέσματα στο biblionet για '+'"'+query?.search+'"';

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <SfLoaderCircular size="xl" />
          <p className="mt-4 typography-text-lg">Αναζήτηση στο biblionet...</p>
        </div>
      </DefaultLayout>
    );
  }

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
