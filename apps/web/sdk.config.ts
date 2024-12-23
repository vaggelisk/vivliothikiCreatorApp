import { magentoModule } from "@vue-storefront/magento-sdk";
import { buildModule, initSDK } from "@vue-storefront/sdk";
import { CreateSdkOptions, createSdk } from "@vue-storefront/next";


const options: CreateSdkOptions = {
  middleware: {
    apiUrl: "http://127.0.0.1:4000",
  }
};


export const { getSdk,  } = createSdk(
    options,
    ({ buildModule, middlewareUrl, getRequestHeaders }) => ({
      magento: buildModule(magentoModule, {
        apiUrl: middlewareUrl + "/magento",
      })
    }),
);
