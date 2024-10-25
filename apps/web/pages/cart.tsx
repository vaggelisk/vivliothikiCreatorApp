import { useTranslation } from 'next-i18next';
import {CartPageContent, Search} from '~/components';
import { createGetServerSideProps } from '~/helpers';
import { CheckoutLayout } from '~/layouts';

export const getServerSideProps = createGetServerSideProps({ i18nNamespaces: ['cart', 'product'] }, (context) => {
  context.res.setHeader('Cache-Control', 'no-cache');
});

export function CartPage() {
  const { t } = useTranslation('cart');

  return (
    <CheckoutLayout backLabel={t('back to the Base')} backHref="/" heading={'Ουπς'}>
      <div className="">
        <div className="font-bold typography-headline-4 md:typography-headline-3">
          Δεν υπάρχει βιβλίο που να ταιριάζει σε αυτό το isbn
        </div>
        <div>Τα παραπονά σας στο γαμω-κράτος και τους εκδότες, που μόνο για τα φράγκα νοιάζονται</div>

      </div>
    </CheckoutLayout>
  );
}

export default CartPage;
