import Image from 'next/image';
import {SfButton, SfIconShoppingCart} from '@storefront-ui/react';
import classNames from 'classnames';
import {useTranslation} from 'next-i18next';
import type {ProductCardProps} from '~/components';
import {useRouter} from 'next/router';
import axios from "axios";
import type {Book} from "~/components/CreatorBookForm/types";
import {useMemo, useState} from "react";
import { getLibrarianApiBaseUrl } from '~/helpers/api';


export function ProductCard({
  name,
  description,
  imageUrl,
  imageAlt,
  price,
  rating,
  isbn,
  publisher,
  author,
  ratingCount,
  slug,
  className,
  priority,
  ...attributes
}: ProductCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  let [book, setBook] = useState<Book | undefined>(undefined)
  const apiBaseUrl = useMemo(getLibrarianApiBaseUrl, []);
  const axiosInstance = useMemo(() => axios.create({
    baseURL: apiBaseUrl,
  }), [apiBaseUrl]);

  const searchInternal = async (nameOfBook: string, publisherOfBook: string ) => {
    const dataPost3 =  {
      title: nameOfBook,
      publisher: publisherOfBook
    }
    return await axiosInstance.post(
        'search-inside',
        dataPost3,
        {
          headers: {
            "Content-Type": 'application/json',
          }
        }
    ).then((response) => {
      return response.data
    }).finally(() => {
      // return response
    }).catch((error) => {
      console.log(error)
      router.push('/')
    })
  }

  const submitSearchInternalOrBiblionet = async (nameOfBook? : string, isbnOfBook? : string, publisherOfBook? : string ) => {
    if (!isbnOfBook) {
      // noinspection TypeScriptValidateTypes
      await router.push({
        pathname: '/search-on-editors',
        query: { search: nameOfBook, isbn: isbnOfBook, data: JSON.stringify({})}
      })
    } else {
      if (nameOfBook && publisherOfBook) {
        await searchInternal(nameOfBook, publisherOfBook).then(  (resp)  => {
          let comeFromMeta = true;
          if (resp[0]) {
            router.push(`/search?search=${nameOfBook}&comeFromMeta=${comeFromMeta}`)
          } else {
            isbnOfBook ? searchBiblionet(nameOfBook, isbnOfBook) : router.push(`/`);
          }
        })
      }
    }
  }

  const goToFormFromMeta = async (nameOfBook? : string, isbnOfBook? : string, publisherOfBook? : string, authorOfBook? : string ) => {
    // noinspection TypeScriptValidateTypes
    await router.push({
      pathname: '/search-on-editors',
      query: { search: nameOfBook, isbn: isbnOfBook, publisher: publisherOfBook, author: authorOfBook, data: JSON.stringify({}) }
    })
  }



  const searchBiblionet = async (searchValue : string, isbnOfBook: string, bookDetails? : string) => {
    const dataPost2 = {
      "username" : "evangelos.karakaxis@gmail.com",
      "password" : "testing123",
      "isbn": isbnOfBook
    }
    axiosInstance.post(
        '/get-book-from-biblionet',
        dataPost2,
        { headers: {
            "Content-Type": 'application/json',
          }},
    ).then((response) => {
      if (response.data.error) {
        book = {
          Title: name,
          WriterName: author,
          Publisher: publisher
        } as Book;
      } else {
        if (response.data[0]) {
          let responseBooks: Book[] = response.data[0]?.map((responseBooks: any) => {
            return {
              TitlesID: responseBooks.TitlesID,
              CoverImage: responseBooks.CoverImage,
              Title: responseBooks.Title,
              Subtitle: responseBooks.Subtitle,
              ISBN: responseBooks.ISBN,
              PublisherID: responseBooks.PublisherID,
              Publisher: responseBooks.Publisher,
              WriterID: responseBooks.WriterID,
              Writer: responseBooks.Writer,
              WriterName: responseBooks.WriterName,
              FirstPublishDate: responseBooks.FirstPublishDate,
              CurrentPublishDate: responseBooks.CurrentPublishDate,
              PlaceID: responseBooks.PlaceID,
              Place: responseBooks.Place,
              EditionNo: responseBooks.EditionNo,
              Cover: responseBooks.Cover,
              Dimensions: responseBooks.Dimensions,
              PageNo: responseBooks.PageNo,
              Availability: responseBooks.Availability,
              Price: responseBooks.Price,
              VAT: responseBooks.VAT,
              Weight: responseBooks.Weight,
              AgeFrom: responseBooks.AgeFrom,
              AgeTo: responseBooks.AgeTo,
              // Summary: responseBooks.Summary,
              LanguageID: responseBooks.LanguageID,
              Language: responseBooks.Language,
              LanguageOriginalID: responseBooks.LanguageOriginalID,
              LanguageOriginal: responseBooks.LanguageOriginal,
              LanguageTranslatedFromID: responseBooks.LanguageTranslatedFromID,
              LanguageTranslatedFrom: responseBooks.LanguageTranslatedFrom,
              Series: responseBooks.Series,
              MultiVolumeTitle: responseBooks.MultiVolumeTitle,
              VolumeNo: responseBooks.VolumeNo,
              VolumeCount: responseBooks.VolumeCount,
              Specifications: responseBooks.Specifications,
              Comments: responseBooks.Comments,
              CategoryID: responseBooks.CategoryID,
              Category: responseBooks.Category,
            }
          })
          if (responseBooks) {
            book = responseBooks[0] as Book;
          } else {
            router.push(`/`);
          }
        }
      }
    }
    ).catch((error) => {
      console.log(error);
    }).finally(() => {
      router.push({
          pathname: '/search-on-editors',
          query: { search: searchValue, isbn: isbnOfBook, data: JSON.stringify(book)}
        })
    })


  }


  return (
    <div
      className={classNames('border border-neutral-200 rounded-md hover:shadow-lg flex-auto flex-shrink-0', className)}
      data-testid="product-card"
      {...attributes}
    >
      <div className="relative">
        <span  className="relative block w-full pb-[100%]">
          <Image
            src={imageUrl ?? ''}
            alt={imageAlt || 'primary image'}
            className="object-cover rounded-md aspect-square w-full h-full"
            data-testid="image-slot"
            fill
            sizes="(max-width: 768px) 50vw, 190px"
          />
        </span>
      </div>
      <div className="p-2 border-t border-neutral-200 typography-text-sm">
        <span  className="no-underline">
          {name}
        </span>

        <p className="block py-2 font-normal typography-text-xs text-neutral-700 text-justify">{description}</p>
        <span className="block pb-2 font-bold typography-text-sm" data-testid="product-card-vertical-price">
          συγγραφέας: {author}
        </span>
        <span className="block pb-2 font-bold typography-text-sm" data-testid="product-card-vertical-price">
          εκδόσεις: {publisher}
        </span>
        <span className="block pb-2 font-bold typography-text-sm" data-testid="product-card-vertical-price">
          isbn: {isbn?.substring(0,6)} {isbn?.substring(6,10)} {isbn?.substring(10,)}
        </span>

        {(router.route=='/search-on-meta') ?
            <SfButton type="button" onClick={() => goToFormFromMeta(name!, isbn, publisher, author)} size="sm" slotPrefix={<SfIconShoppingCart size="sm" />} > Προσθήκη</SfButton> :
            <SfButton type="button" onClick={() => submitSearchInternalOrBiblionet(name!, isbn, publisher)} size="sm" slotPrefix={<SfIconShoppingCart size="sm" />}>
              Προσθήκη
            </SfButton>
        }
      </div>
    </div>
  );
}
