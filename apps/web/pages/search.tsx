import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { CategoryFilters, CategoryPageContent, CategorySorting } from '~/components';
import { createGetServerSideProps } from '~/helpers';
import { prefetchProducts, useProducts } from '~/hooks';
import { DefaultLayout } from '~/layouts';

export const getServerSideProps = createGetServerSideProps({ i18nNamespaces: ['category'] }, async (context) => {

  context.res.setHeader('Cache-Control', 'no-cache');
  let search = context.query.search;
  const products = await prefetchProducts(context, search);


  if (!products) {
    return {
      notFound: true,
    };
  }

  return { props: {} };
});

export default function SearchPage() {
  const { t } = useTranslation('category');
  const { query, route } = useRouter();
  const { data: productsCatalog } = useProducts();

  if (!productsCatalog) {
    return null;
  }

  const { products, pagination, facets } = productsCatalog;
  const categoryTitle = t('resultsFor', { phrase: query?.search });



  return (
    <DefaultLayout >
      <CategoryPageContent
        title={categoryTitle}
        comeFromCreator={query?.search}
        currentScreen={route}
        book={query?.data}
        isbn={query?.isbn}
        products={products.items}
        totalProducts={pagination.totalResults}
        sidebar={
          <>
            <CategorySorting />
            <CategoryFilters facets={facets} />
          </>
        }
      />
    </DefaultLayout>
  );
}
