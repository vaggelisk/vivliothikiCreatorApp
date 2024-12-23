import { Maybe } from '@vue-storefront/unified-data-model';

export type ProductCardProps = {
  name: Maybe<string>;
  description?: Maybe<string>;
  imageUrl?: Maybe<string>;
  imageAlt?: Maybe<string>;
  rating?: number;
  ratingCount?: number;
  price?: number;
  slug?: string;
  isbn?: string;
  publisher?: string;
  author?: string;
  className?: string;
  priority?: boolean;
};
