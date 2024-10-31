import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { CategoryFilters, CategoryPageContent, CategorySorting } from '~/components';
import { createGetServerSideProps } from '~/helpers';
import { prefetchProducts, useProducts } from '~/hooks';
import { DefaultLayout } from '~/layouts';
import axios from "axios";
import {useEffect, useState} from "react";


type ProductKantro = {
  store_id: string;
  sku: string;
  status: Number;
  status_value: string;
  visibility: Number;
  is_visible_in_front: Number;
  name: string;
  url_key: string;
  isbn: string;
}

const axiosInstance = axios.create({
  baseURL: 'https://librarian-api.notia-evia.gr',
});



export const getServerSideProps = createGetServerSideProps({ i18nNamespaces: ['category'] }, async (context) => {

  context.res.setHeader('Cache-Control', 'no-cache');
  let search = context.query.search;
  // const products = await prefetchProducts(context, search);


  // const products = await prefetchProducts(context, search);
  // const products = []

  // if (!products) {
  //   return {
  //     notFound: true,
  //   };
  // }

  return { props: {} };
});

export default function SearchPage() {
  const { t } = useTranslation('category');
  const { query, route } = useRouter();
  const [error, setError] = useState(null);

  // const { data: productsCatalog } = useProducts();
  const [productsKantro, setProductsKantro] = useState<ProductKantro[] | undefined>([])


  const dataPost2 = {
    "title": query?.search,
    "publisher": query?.publisher
  }

  useEffect(() => {
    axiosInstance.post(
        '/search-inside',
        dataPost2,
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
        let responseProductKantro: ProductKantro[] = response.data?.map((responseProductKantro: any) => {
          return {
            store_id: responseProductKantro.store_id,
            sku: responseProductKantro.sku,
            status: responseProductKantro.status,
            status_value: responseProductKantro.status_value,
            visibility: responseProductKantro.visibility,
            is_visible_in_front: responseProductKantro.is_visible_in_front,
            name: responseProductKantro.name,
            url_key: responseProductKantro.url_key,
            isbn: responseProductKantro.isbn,
          }
        })
        if (responseProductKantro) setProductsKantro(responseProductKantro)
      } else {
        setProductsKantro(response.data)
      }
    }).catch((error) => setError(error))
      .finally(() =>console.log(productsKantro?.length));
  }, []);

  // if (!productsCatalog) {
  //   return null;
  // }

  // const { products, pagination, facets } = productsCatalog;
  const categoryTitle = t('resultsFor', { phrase: query?.search });



  return (
    <DefaultLayout >
      <CategoryPageContent
        title={categoryTitle}
        comeFromCreator={query.search ?  query.search.toString() : ''}
        currentScreen={route}
        book={query.data ? JSON.parse(query?.data.toString()) : {}}
        isbn={query.isbn ? query.isbn.toString() : ''}
        products={productsKantro || Array()}
        totalProducts={productsKantro ? productsKantro.length : 0}
        sidebar={
          <>
            <CategorySorting />
            {/*<CategoryFilters facets={facets} />*/}
          </>
        }
      />
    </DefaultLayout>
  );
}
