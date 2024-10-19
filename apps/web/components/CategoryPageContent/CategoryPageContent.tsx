import { useMedia } from 'react-use';
import dynamic from 'next/dynamic';
import { SfButton, SfIconTune, useDisclosure } from '@storefront-ui/react';
import { useTranslation } from 'next-i18next';
import {NarrowContainer, Pagination, ProductCard, CategorySidebar, Search, CreatorBookForm} from '~/components';
import type { CategoryPageContentProps } from '~/components';
import {useRouter} from "next/router";
import {BookForm} from "~/components/CreatorBookForm/BookForm";
import  useQueryPostList  from "~/hooks/useQueryPostList"


const CategoryEmptyState = dynamic(() => import('~/components/CategoryEmptyState'));

export function CategoryPageContent({
  title,
  comeFromCreator,
  currentScreen,
  bookTitle,
  isbn,
  book,
  sidebar,
  products,
  totalProducts,
  itemsPerPage = 24,
}: CategoryPageContentProps): JSX.Element {
  const showSidebar = !title.includes('Αποτελέσματα');
  const { route } = useRouter();
  const { t } = useTranslation('category');
  const isWideScreen = useMedia('(min-width: 1024px)', false);
  const isTabletScreen = useMedia('(min-width: 768px)', false);
  const { isOpen, open, close } = useDisclosure({ initialValue: false });
  const maxVisiblePages = isWideScreen ? 5 : 1;

  const save = () => {
    console.log('zhtw h cooooore')
    return 'core'
  }

  if (isTabletScreen && isOpen) {
    close();
  }

  return (
    <NarrowContainer>
      <div className="mb-20 px-4 md:px-0" data-testid="category-layout">
        <h1 className="my-10 font-bold typography-headline-3 md:typography-headline-2">{title}</h1>
        <div className="md:flex gap-6" data-testid="category-page-content">
          {showSidebar && (
              <CategorySidebar isOpen={isOpen} closeSidebar={close}>
                {sidebar}
              </CategorySidebar>
          )}
          <div className="flex-1">

            {(route!=='/search-on-editors') &&  (<div className="flex justify-between items-center mb-6">
              <span className="font-bold font-headings md:text-lg">
                {t('numberOfProducts', { count: totalProducts })}
              </span>
              {showSidebar && (<SfButton
                onClick={open}
                variant="tertiary"
                className="md:hidden whitespace-nowrap"
                slotPrefix={<SfIconTune />}
              >
                {t('listSettings')}
              </SfButton>)}
            </div>)}
            {products.length > 0 ? (
              <section
                className="grid grid-cols-1 2xs:grid-cols-2 gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 mb-10 md:mb-5"
                data-testid="category-grid"
              >
                <div className="font-bold typography-headline-2 md:typography-headline-2">
                  Το βιβλίο αυτό υπάρχει ήδη
                </div>
                {/*{products.map(({ id, name,  rating_summary, price_range, thumbnail, slug }, index) => (*/}
                {/*  <ProductCard*/}
                {/*    key={id}*/}
                {/*    name={name}*/}
                {/*    rating={rating_summary}*/}
                {/*    price={price_range.minimum_price.final_price.value}*/}
                {/*    imageUrl={thumbnail?.url}*/}
                {/*    imageAlt={thumbnail?.alt}*/}
                {/*    slug={slug}*/}
                {/*    priority={index === 0}*/}
                {/*  />*/}
                {/*))}*/}
              </section>
            ) :
                (route=='/search') ?
                    (
                      <div className="">
                        <div className="font-bold typography-headline-4 md:typography-headline-3">
                          Δεν υπάρχει βιβλίο που να ταιριάζει σε αυτόν τον τίτλο
                        </div>
                        <div>Θέλετε να ψάξουμε τον ίδιο τίτλο στην Εξωτερική Βάση των εκδοτών</div>
                        <Search bookDetails={book}
                                isbnOfBook={isbn}
                                className={{ tit: comeFromCreator, curScreen: currentScreen  }}
                        />
                      </div>
                ) :
                  (route=='/search-on-editors') ? (
                    <div>
                      <BookForm
                          titleOfBook={bookTitle}
                          isbnOfBook={isbn}
                          bookDetails={book}
                          onSave={save} />
                    </div>
                    ) : (
                    <div>
                      <CategoryEmptyState />
                    </div>
                  )
            }
            {totalProducts > itemsPerPage && (
              <Pagination
                currentPage={1}
                totalItems={totalProducts}
                pageSize={itemsPerPage}
                maxVisiblePages={maxVisiblePages}
              />
            )}
          </div>
        </div>
      </div>
    </NarrowContainer>
  );
}
