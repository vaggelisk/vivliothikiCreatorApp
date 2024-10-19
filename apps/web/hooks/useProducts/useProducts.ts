import { useQuery } from '@tanstack/react-query';
import { GetProducts } from '@vue-storefront/storefront-boilerplate-sdk';
import { GetServerSideEnhancedContext } from '~/helpers/types';
import { useSdk } from '~/sdk';
import { getSdk } from "~/sdk.config";

export async function prefetchProducts(context: GetServerSideEnhancedContext, searchPhrase: string | string[]): Promise<GetProducts> {
  const { queryClient } = context;
  const sdk = getSdk();
  const products = searchPhrase===''
      ? await sdk.magento.products({})
      : await sdk.magento.products({
        pageSize: 20,
        currentPage: 1,
        search: searchPhrase
      })

  queryClient.setQueryData(['products'], products);

  return products.data;
}


/**
 * Hook for getting products catalog data
 */
export function useProducts(searchPhrase='') {
  const sdk = getSdk();
  // const sdk = useSdk  // profanws to use einai to default kai to getSdk einai to magentiko

  const mockUpProducts = {
    pagination: {
      currentPage: 1,
      pageSize: 24,
      totalResults: undefined,
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
  let vaggelis

  if (searchPhrase !== '') {
    vaggelis = useQuery(['products' ], () => sdk.magento.products({
          pageSize: 20,
          currentPage: 1,
          search: searchPhrase
        }),
        {
          refetchOnMount: false,
          refetchOnWindowFocus: false,
        });
  } else {
    vaggelis = useQuery(['products' ], () => sdk.magento.products(),
        {
          refetchOnMount: false,
          refetchOnWindowFocus: false,
        });
  }

  console.log('vag 2', vaggelis.data)

  mockUpProducts.products = vaggelis.data.data.products
  mockUpProducts.pagination = vaggelis.data.data.products.page_info
  mockUpProducts.pagination.totalResults = vaggelis.data.data.products.total_count
  return { data: mockUpProducts }   // edw eixa gamithei 10 wres, epeidh den evaza afto to data
}
// ftou xeleftheria mono avto tha pw
