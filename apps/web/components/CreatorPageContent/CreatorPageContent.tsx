import React, {ChangeEvent, FormEventHandler, useRef, useState} from 'react'
import {FormLabel, NarrowContainer, Search} from "~/components";
import axios from "axios";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import { IconButton } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import PhotoCameraRoundedIcon from "@material-ui/icons/PhotoCameraRounded";
import type { Book } from "~/components/CreatorBookForm/types";

import {
    SfButton,
    SfIconCancel,
    SfIconClose, SfIconCreditCard, SfIconGridView, SfIconPerson,
    SfIconSearch, SfIconShoppingCart,
    SfInput,
    SfModal,
    useDisclosure,
    useDropdown
} from "@storefront-ui/react";
import classNames from "classnames";
import {offset} from "@floating-ui/react-dom";
import {useRouter} from "next/router";


const useStyles = makeStyles((theme) => ({
    root: {
        height: "100%",
        textAlign: "center"
    },
    imgBox: {
        maxWidth: "100%",
        maxHeight: "80%",
        margin: "10px"
    },
    img: {
        height: "inherit",
        maxWidth: "inherit"
    },
    input: {
        display: "none"
    }
}));



export function CreatorPageContent() {
    // a local state to store the currently selected file.
    const { isOpen, open, close } = useDisclosure({ initialValue: false });
    const [searchTitleValue, setSearchTitleValue] = useState('')
    const [searchPublisherValue, setSearchPublisherValue] = useState('')
    const inputReference = useRef<HTMLInputElement>(null);
    const [searchValue, setSearchValue] = useState('978960')
    const [book, setBook] = useState<Book | undefined>(undefined)
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const axiosInstance = axios.create({
        baseURL: 'https://librarian-api.notia-evia.gr',
    });

    const { refs } = useDropdown({  onClose: close });

    const handleTitleSubmit: FormEventHandler<HTMLFormElement> = async(event) => {
        event.preventDefault()
        await router.push({
            pathname: '/search',
            query: { search: searchTitleValue, isbn: searchValue, publisher: searchPublisherValue, data: JSON.stringify(book) }
        })
    }

    const handleSubmit: FormEventHandler<HTMLFormElement> = async(event) => {
        event.preventDefault()
        const dataPost2 = {
            "username" : "evangelos.karakaxis@gmail.com",
            "password" : "testing123",
            "isbn": searchValue
        }
        open()
        setLoading(true)                                         //  avtes edw oi grammes einai gia na mh kopaname synexeia to API
                                                                       //  kai mas banarei
                                                                       //  let responseBooks = [{
        axiosInstance.post(                                            //     id: "473674",
           '/get-book-from-biblionet',                             //     name: "Montana",
                dataPost2,                                             //     isbn: "498594598948598"
            { headers: {                                         //  }]
                    "Content-Type": 'application/json',                //  setBooks( responseBooks )
            }},                                                        //  setSearchTitleValue(responseBooks[0].name)
        )
            .then((response) => {
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
                    setBook(responseBooks[0]);
                    setSearchTitleValue(responseBooks[0].Title)
                    setSearchPublisherValue(responseBooks[0].Publisher)
                    setLoading(false)
                } else {
                    router.push(`/cart?isbn=${searchValue}`);
                }

            })
            .catch((error) => {
                console.log(error);
            })

    }

    const handlePublisherReset = () => {
        setSearchPublisherValue('')
        inputReference.current?.focus();
    }
    const handleTitleReset = () => {
        setSearchTitleValue('')
        inputReference.current?.focus();
    }

    const handleReset = () => {
        setSearchValue('');
        close();
        inputReference.current?.focus();
    };
    const handlePublisherChange = (event: ChangeEvent<HTMLInputElement>) => {
        const phrase2 = event.target.value;
        if (phrase2) {
            setSearchPublisherValue(phrase2);
        } else {
            handlePublisherReset();
        }
    };
    const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const phrase2 = event.target.value;
        if (phrase2) {
            setSearchTitleValue(phrase2);
        } else {
            handleTitleReset();
        }
    };
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const phrase = event.target.value;
        if (phrase) {
            setSearchValue(phrase);
        } else {
            handleReset();
        }
    };

    const classes = useStyles();

    return (
        <NarrowContainer>
            <div className={classes.root}>
                <Grid container>
                    <Grid item xs={12}>
                        <div className="font-bold mt-6 typography-headline-4 md:typography-headline-3">
                            <h5>Εισάγετε </h5>
                            <h5>το isbn του βιβλίου</h5>
                            <h5>που θέλετε να αρχειοθετήσετε</h5>
                        </div>
                        <form  onSubmit={handleSubmit}
                               ref={refs.setReference}
                               className="mt-4"
                               >
                            <SfInput
                                ref={inputReference}
                                value={searchValue}
                                type="number"
                                onChange={handleChange}
                                aria-label="Isbn"
                                placeholder="ISBN"
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
                            <div className="mb-6">
                                <SfButton type="submit" className="w-full md:w-1/6 mt-3 flex" >
                                    Αναζήτηση
                                </SfButton>
                            </div>
                        </form>
                    </Grid>
                </Grid>





                {(book && isOpen) && (
                    <SfModal
                        open={isOpen}
                        onClose={close}
                        className="w-full h-full z-50"
                        as="section"
                        role="dialog"
                        aria-labelledby="search-modal-title"
                    >
                        <header className="mb-10">
                            <SfButton square variant="tertiary"
                                      className="absolute right-4 top-2"
                                      onClick={close}>
                                <SfIconClose className="text-neutral-500" />
                            </SfButton>
                            <h3 id="search-modal-title"
                                className="absolute left-6 top-4 font-bold typography-headline-4 mb-4">
                                <div>Είναι αυτός τα στοιχεία;</div>
                            </h3>
                            <h3 id="search-modal-title"
                                className="absolute left-6 top-10 font-bold typography-headline-4 mb-20">
                                <div>Αν όχι διορθώστε.</div>
                            </h3>
                        </header>
                        {loading ? (
                            <div className="font-bold mt-6 typography-headline-2"> IS LOADING...</div>
                        ) : (
                            <form  onSubmit={handleTitleSubmit}
                                   ref={refs.setReference}
                                   className={classNames('relative')}>
                                <label>
                                    <FormLabel className="grid justify-items-start pt-4">Τίτλος</FormLabel>
                                    <SfInput
                                        ref={inputReference}
                                        value={searchTitleValue}
                                        onChange={handleTitleChange}
                                        aria-label="Search"
                                        placeholder="Search"
                                        slotPrefix={<SfIconSearch />}
                                        slotSuffix={
                                            !!searchTitleValue && (
                                                <button
                                                    type="button"
                                                    onClick={handleTitleReset}
                                                    aria-label="Reset search"
                                                    className="flex rounded-md focus-visible:outline focus-visible:outline-offset"
                                                >
                                                    <SfIconCancel />
                                                </button>
                                            )
                                        }
                                    />
                                </label>
                                <label>
                                    <FormLabel className="grid justify-items-start pt-4">Εκδόσεις</FormLabel>                                <SfInput
                                        ref={inputReference}
                                        value={searchPublisherValue}
                                        onChange={handlePublisherChange}
                                        aria-label=""
                                        placeholder="Εκδόσεις"
                                        slotPrefix={<SfIconCreditCard />}
                                        slotSuffix={
                                            !!searchPublisherValue && (
                                                <button
                                                    type="button"
                                                    onClick={handlePublisherReset}
                                                    aria-label="Reset search"
                                                    className="flex rounded-md focus-visible:outline focus-visible:outline-offset"
                                                >
                                                    <SfIconCancel />
                                                </button>
                                            )
                                        }
                                    />
                                </label>
                                <div>
                                    <SfButton type="submit" className="w-full md:w-1/6 mt-3 flex" >
                                        Αναζήτηση στη Βιβλιοθήκη μας
                                    </SfButton>
                                </div>
                            </form>
                        )}

                    </SfModal>
                )}
            </div>
        </NarrowContainer>
    )
}
