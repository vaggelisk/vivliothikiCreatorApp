import { PropsWithChildren, ReactNode } from 'react';
import { SfProductCatalogItem } from '@vue-storefront/unified-data-model';

type SfProductCatalogItemNew = SfProductCatalogItem & {
  review_count: number,
  rating_summary: number,
  price_range: object,
  isbn: string,
  publisher: string,
  author: string,
  thumbnail: {
    alt: string,
    url: string
  },
}

export interface CategoryPageContentProps extends PropsWithChildren {
  title: string;
  comeFromCreator?: string;
  comeFromMeta?: boolean;
  currentScreen?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookPublisher?: string;
  isbn?: string;
  book?: [];
  products: SfProductCatalogItemNew[];
  totalProducts: number;
  sidebar?: ReactNode;
  itemsPerPage?: number;
}

export interface CategorySidebarProps extends PropsWithChildren {
  isOpen: boolean;
  closeSidebar: () => void;
}
