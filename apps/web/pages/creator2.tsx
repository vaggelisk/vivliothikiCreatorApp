import { useTranslation } from 'next-i18next';
import {
  Breadcrumb,
  CategoryTreeItem,
} from '~/components';
import { DefaultLayout } from '~/layouts';
import {createGetServerSideProps} from "~/helpers";

export const getServerSideProps = createGetServerSideProps({ i18nNamespaces: ['cart', 'product'] }, (context) => {
  context.res.setHeader('Cache-Control', 'no-cache');
});

export function Creator2Page() {
  const { t } = useTranslation('category');
  const breadcrumbs: Breadcrumb[] = [
    { name: t('common:home'), link: '/' },
    { name: t('creator2'), link: '/creator2' },
  ];

  return (
    <DefaultLayout breadcrumbs={breadcrumbs}>
      <div></div>
      {/*<Creator2PageContent />*/}
    </DefaultLayout>
  );
}

export default Creator2Page;
