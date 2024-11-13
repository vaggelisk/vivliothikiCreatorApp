import type { PropsWithChildren } from 'react';
import Link from 'next/link';
import { SfButton, SfIconExpandMore, SfIconShoppingCart } from '@storefront-ui/react';
import { useTranslation } from 'next-i18next';
import {
  Badge,
  Footer,
  BottomNav,
  ScrollToTopButton,
  NavbarTop,
  Search,
  Breadcrumb,
  NarrowContainer,
  Breadcrumbs,
} from '~/components';
import { useCart } from '~/hooks';

type LayoutPropsType = PropsWithChildren & {
  breadcrumbs?: Breadcrumb[];
};

export function DefaultLayout({ children, breadcrumbs = [] }: LayoutPropsType): JSX.Element {
  const { t } = useTranslation();
  const { data: cart } = useCart();
  const outerCompon = "menu";
  const cartLineItemsCount = cart?.lineItems.reduce((total, { quantity }) => total + quantity, 0) ?? 0;

  return (
    <>
        <div className="flex flex-col h-screen justify-between">
          <NavbarTop filled>
              <div className="flex text-white ">αυτοοργανωμένη βιβλιοθήκη</div>
              <Search outerComp={outerCompon} className="hidden md:block flex-1" />
          </NavbarTop>
          {breadcrumbs?.length > 0 && (
            <NarrowContainer>
              <div className="p-4 md:px-0">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
              </div>
            </NarrowContainer>
          )}
          <main>{children}</main>
          <BottomNav />
          <ScrollToTopButton />
          <Footer className="mb-[58px] md:mb-0" />
        </div>
    </>
  );
}

DefaultLayout.defaultProps = {
  breadcrumbs: [],
};
