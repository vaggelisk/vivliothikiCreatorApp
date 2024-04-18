import dynamic from "next/dynamic";
import {NarrowContainer} from "~/components";
import {useState} from "react";
import {SfButton, SfIconShoppingCart} from "@storefront-ui/react";
import {useTranslation} from "next-i18next";
import {useContent} from "~/hooks";

// const CategoryEmptyState = dynamic(() => import('~/components/CategoryEmptyState'));


export function CreatorPageContent() {

    const [picture, setPicture] = useState("");
    const [source, setSource] = useState("");
    const book = useContent("/custom/search-inside/αρβανήτικα παραμύθια 3")
    const { t } = useTranslation();

    const onChangePicture = e => {
        console.log('picture: ', picture);
        setPicture([...picture, e.target.files[0]]);
    };
    const getTheData = () => {
      console.log("ethniki ellados ante kai gamhsou")
      console.log("test")
    };
    const handleCapture = (target) => {
        if (target.files) {
            if (target.files.length !== 0) {
                const file = target.files[0];
                const newUrl = URL.createObjectURL(file);
                setSource(newUrl);
            }
        }
    };

    return (
      <NarrowContainer>
        <div className="md:grid md:grid-cols-12 md:gap-x-6">
          <div className="col-span-7 mb-10 mb-0">
              <h1>Geia Sas Paidia</h1>
              <input
              accept="image/*"
              type="file"
              capture="environment"
              //style={{ display: 'none' }}
              onChange={(e) => handleCapture(e.target)}
            />
          </div>
        </div>
          <SfButton className="mt-3 mb-3" type="button" onClick={getTheData}
                    size="sm" slotPrefix={<SfIconShoppingCart size="sm" />}>
              {t('addToCartShort')}
          </SfButton>
      </NarrowContainer>
  )
}
