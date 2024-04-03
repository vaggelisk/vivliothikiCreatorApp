import { magentoModule } from "@vue-storefront/magento-sdk";
import { buildModule, initSDK } from "@vue-storefront/sdk";
import { CreateSdkOptions, createSdk } from "@vue-storefront/next";


const options: CreateSdkOptions = {
  middleware: {
    apiUrl: "http://localhost:4000",
  }
};


export const { getSdk, createSdkContext } = createSdk(
    options,
    ({ buildModule, middlewareUrl, getRequestHeaders }) => ({
      magento: buildModule(magentoModule, {
        apiUrl: middlewareUrl + "/magento",
      })
    }),
);
