import dotenv from 'dotenv';
dotenv.config();

function resolveMagentoGraphqlUrl(
  graphQlUrl: string | undefined,
  baseUrl: string | undefined,
): string | undefined {
  const rawGraphQl = graphQlUrl?.trim();
  const rawBase = baseUrl?.trim().replace(/\/+$/, '');

  if (!rawGraphQl) {
    return rawBase ? `${rawBase}/graphql` : undefined;
  }

  // Already absolute URL
  if (/^https?:\/\//i.test(rawGraphQl)) {
    return rawGraphQl;
  }

  // Relative URL from env (e.g. /graphql or graphql) must be resolved for Node runtime
  if (!rawBase) {
    return rawGraphQl;
  }

  const normalizedPath = rawGraphQl.startsWith('/') ? rawGraphQl : `/${rawGraphQl}`;
  return `${rawBase}${normalizedPath}`;
}

const magentoBaseUrl = process.env.VSF_MAGENTO_BASE_URL;
const magentoGraphqlUrl = resolveMagentoGraphqlUrl(
  process.env.VSF_MAGENTO_GRAPHQL_URL,
  magentoBaseUrl,
);

const cookieNames = {
  currencyCookieName: 'vsf-currency',
  countryCookieName: 'vsf-country',
  localeCookieName: 'vsf-locale',
  cartCookieName: 'vsf-cart',
  customerCookieName: 'vsf-customer',
  storeCookieName: 'vsf-store',
  messageCookieName: 'vsf-message'
};

const config = {
  integrations: {
    /* VSF integration config */
    magento: {
      location: '@vue-storefront/magento-api/server',
      configuration: {
        api: magentoGraphqlUrl,
        cookies: {
          ...cookieNames,
        },
        cookiesDefaultOpts: {
          httpOnly: process.env.VSF_COOKIE_HTTP_ONLY || false,
          secure: process.env.VSF_COOKIE_SECURE || false,
          sameSite: process.env.VSF_COOKIE_SAME_SITE || 'lax',
          path: process.env.VSF_COOKIE_PATH || '/',
        },
        defaultStore: 'default',
        customApolloHttpLinkOptions: {
          useGETForQueries: true,
        },
        magentoBaseUrl,
        magentoApiEndpoint: magentoGraphqlUrl,
        imageProvider: process.env.NUXT_IMAGE_PROVIDER,
        recaptcha: {
          isEnabled: process.env.VSF_RECAPTCHA_ENABLED === 'true',
          sitekey: process.env.VSF_RECAPTCHA_SITE_KEY,
          secretkey: process.env.VSF_RECAPTCHA_SECRET_KEY,
          version: process.env.VSF_RECAPTCHA_VERSION,
          score: process.env.VSF_RECAPTCHA_MIN_SCORE,
        },
        customer: {
          customer_create_account_confirm: true,
        },
      },
      // extensions: (extensions)=>[
      //   ...extensions,
      //   {
      //     name: "extension-name",
      //     extendApiMethods: {
      //       baseSites: async (context) => {
      //         // Using integration's HTTP client to make a request to SAP Commerce Cloud backend
      //         // SAPCC integration is using `axios` as an HTTP client, so we want to retreive only the `data` property from the response.
      //         const { data } = await context.client.get("/basesites");
      //         return data;
      //       },
      //     },
      //   }
      // ],
    }
  },
};

export default config;
