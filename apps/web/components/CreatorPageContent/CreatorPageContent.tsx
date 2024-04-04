import dynamic from "next/dynamic";
import {NarrowContainer} from "~/components";
import {useState} from "react";

// const CategoryEmptyState = dynamic(() => import('~/components/CategoryEmptyState'));


export function CreatorPageContent() {

    const [picture, setPicture] = useState("");
    const [source, setSource] = useState("");

    const onChangePicture = e => {
        console.log('picture: ', picture);
        setPicture([...picture, e.target.files[0]]);
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
          <div className="col-span-7 mb-10 md:mb-0">
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
      </NarrowContainer>
  )
}
