import { useTranslation } from 'next-i18next';
import {
  CategoryPageContent,
  CategoryTree,
  CategorySorting,
  CategoryFilters,
  Breadcrumb,
  CategoryTreeItem,
} from '~/components';
import { createGetServerSideProps } from '~/helpers';
import { prefetchProducts, useProducts } from '~/hooks';
import { DefaultLayout } from '~/layouts';

export const getServerSideProps = createGetServerSideProps({ i18nNamespaces: ['category'] }, async (context) => {
  context.res.setHeader('Cache-Control', 'no-cache');
  const products = await prefetchProducts(context, '');

  console.log('vag', products)

  if (!products) {
    return {
      notFound: true,
    };
  }

  return { props: {} };
});

export default function CategoryPage() {
  const { t } = useTranslation('category');
  const breadcrumbs: Breadcrumb[] = [
    { name: t('common:home'), link: '/' },
    { name: t('allProducts'), link: '/category' },
  ];
  const { data: productsCatalog } = useProducts();


  if (!productsCatalog) {
    console.log("vag mpainei edw mesa")
    return null;
  }

  const { products, pagination, subCategories, facets } = productsCatalog;
  const categories: CategoryTreeItem[] = subCategories.map(({ name, productCount }) => ({
    name,
    count: productCount || 0,
    href: '/category',
  }));



  return (
    <DefaultLayout breadcrumbs={breadcrumbs}>
      <CategoryPageContent
        title={t('allProducts')}
        products={Array()}
        totalProducts={Number(20)}
        sidebar={
          <>
            <CategoryTree parent={{ name: t('allProducts'), href: '/category' }} categories={categories} />
            <CategorySorting />
            <CategoryFilters facets={facets} />
          </>
        }
      />
    </DefaultLayout>
  );
}
