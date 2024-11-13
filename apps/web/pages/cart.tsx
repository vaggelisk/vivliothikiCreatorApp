import { useTranslation } from 'next-i18next';
import {CartPageContent, Divider, Search} from '~/components';
import { createGetServerSideProps } from '~/helpers';
import { CheckoutLayout } from '~/layouts';
import {useRouter} from "next/router";

export const getServerSideProps = createGetServerSideProps({ i18nNamespaces: ['cart', 'product'] }, (context) => {
  context.res.setHeader('Cache-Control', 'no-cache');
});

export function CartPage() {
  const { t } = useTranslation('cart');
  const { query, route } = useRouter();
  let isbn = query.isbn;
  let uri = "/search-on-editors?isbn="+isbn
  const currentScreen = '/cart'

  return (
    <CheckoutLayout backLabel="Αρχική"
                    forwardLabel="Άδεια Φόρμα"
                    backHref="/"
                    forwardHref={uri}
                    heading={'Ουπς'} >
      <div className="">
        <div className="font-bold typography-headline-4 md:typography-headline-3">
          Δεν υπάρχει βιβλίο που να ταιριάζει σε αυτό το isbn
        </div>
        <div>Τα παράπονά σας στο γαμω-κράτος και τους εκδότες, που μόνο για τα φράγκα νοιάζονται</div>
        <Divider className="mt-5 mb-5" />

        <div className="font-bold typography-headline-4 md:typography-headline-3 mb-2">
          Προσθέστε τον τίτλο
        </div>
        <div className="mb-2">Αν θέλετε να ψάξουμε το βιβλίο στη βάση του metabook</div>
        <Search curScreen={currentScreen} />

      </div>
    </CheckoutLayout>
  );
}

export default CartPage;
