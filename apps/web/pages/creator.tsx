import { useTranslation } from 'next-i18next';
import {
  CreatorPageContent,
  Breadcrumb,
  CategoryTreeItem,
} from '~/components';
import { DefaultLayout } from '~/layouts';
import {createGetServerSideProps} from "~/helpers";
import CartPage from "~/pages/cart";

export const getServerSideProps = createGetServerSideProps({ i18nNamespaces: ['cart', 'product'] }, (context) => {
  context.res.setHeader('Cache-Control', 'no-cache');
});

export function CreatorPage() {
  const { t } = useTranslation('category');
  const breadcrumbs: Breadcrumb[] = [
    { name: t('common:home'), link: '/' },
    { name: t('creator'), link: '/category' },
  ];

  return (
    <DefaultLayout breadcrumbs={breadcrumbs}>
      <CreatorPageContent />
    </DefaultLayout>
  );
}

export default CreatorPage;
