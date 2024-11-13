import {type ChangeEvent, type FormEvent, useState, useRef, FormEventHandler} from 'react';
import { useRouter } from 'next/router';
import { offset } from '@floating-ui/react-dom';
import {
  SfInput,
  SfIconSearch,
  SfIconCancel,
  useDisclosure,
  useTrapFocus,
  useDropdown,
  SfLoaderCircular, SfButton
} from '@storefront-ui/react';
import classNames from 'classnames';
import type { SearchProps } from '~/components';

export function Search({ className, outerComp, bookDetails, isbnOfBook, titleOfBook, curScreen }: SearchProps) {
  const inputReference = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState( titleOfBook ? titleOfBook : '');
  const [currentScreen] = useState(curScreen ? curScreen : '');
  const router = useRouter();
  const { isOpen, close, open } = useDisclosure({ initialValue: true });
  const { refs } = useDropdown({  onClose: close, });
  useTrapFocus(refs.floating, { arrowKeysOn: true, activeState: isOpen, initialFocus: false });

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    close();
    if (currentScreen==="/search") {
      // noinspection TypeScriptValidateTypes
      await router.push({
        pathname: '/search-on-editors',
        query: { search: searchValue, isbn: isbnOfBook, data: JSON.stringify(bookDetails)}
      })
    } else if (currentScreen==="/cart") {
      await router.push(`/search-on-meta?search=${searchValue}`)
    } else {
      await router.push(`/search?search=${searchValue}`);
    }
  };
  const handleReset = () => {
    setSearchValue('');
    // if (modalName!=='creator') close();
    inputReference.current?.focus();
  };
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const phrase = event.target.value;
    if (phrase) {
      setSearchValue(phrase);
    } else {
      handleReset();
    }
  };

  return (
    <form  onSubmit={handleSubmit}
          ref={refs.setReference}
           className={classNames('relative', className)}>
      <SfInput
        ref={inputReference}
        value={searchValue}
        onChange={handleChange}
        aria-label="Search"
        placeholder="Search"
        slotPrefix={<SfIconSearch />}
        slotSuffix={
          !!searchValue && (
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset search"
              className="flex rounded-md focus-visible:outline focus-visible:outline-offset"
            >
              <SfIconCancel />
            </button>
          )
        }
      />
      {outerComp!=='menu' && (
        <div>
          <SfButton type="submit" className="w-full md:w-1/6 mt-3 flex" >
            Αναζήτηση
          </SfButton>
        </div>
      )}
    </form>
  );
}
