import { useQuery } from '@tanstack/react-query';
import { GetProducts } from '@vue-storefront/storefront-boilerplate-sdk';
import { GetServerSideEnhancedContext } from '~/helpers/types';
import { useSdk } from '~/sdk';
import { getSdk } from "~/sdk.config";

export async function prefetchProducts(context: GetServerSideEnhancedContext): Promise<GetProducts> {
  const { queryClient } = context;
  const sdk = getSdk();
  const products = await sdk.magento.products({});


  console.log(products.data.products.total_count)
  // console.log(products.products.length)
  queryClient.setQueryData(['products'], products);

  return products.data.products.items;
}


/**
 * Hook for getting products catalog data
 */
export function useProducts() {
  const sdk = getSdk();
  // const sdk = useSdk  // profanws to use einai to default kai to getSdk einai to magentiko

  const mockUpProducts = {
    pagination: {
      currentPage: 1,
      pageSize: 24,
      totalResults: 398,
      totalPages: 17,
    },
    facets: [
      {
        label: 'Color',
        name: 'color',
        values: [
          {
            label: 'White',
            value: 'white',
            productCount: 22,
          },
        ],
      },
      {
        label: 'Size',
        name: 'size',
        values: [
          {
            label: '36',
            value: '36',
            productCount: 78,
          },
        ],
      },
    ],
    subCategories: [
      {
        id: '1',
        name: 'New',
        slug: 'new',
        subcategories: [],
        productCount: 29,
      },
    ],
    products: undefined

  }

  const vaggelis = useQuery(['products'], () => sdk.magento.products({}), {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  console.log('vag 2', vaggelis.data.data.products.items[0].price_range.minimum_price.final_price)

  mockUpProducts.products = vaggelis.data.data.products.items

  return { data: mockUpProducts }   // edw eixa gamithei 10 wres, epeidh den evaza afto to data
}
// φτοθ κσελεφτερια μονο αφτο τηα πς
