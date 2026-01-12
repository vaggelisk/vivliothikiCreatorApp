import React, {ChangeEvent, FormEventHandler, useMemo, useRef, useState} from 'react'
import {FormLabel, NarrowContainer, Search} from "~/components";
import axios from "axios";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import { IconButton } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import PhotoCameraRoundedIcon from "@material-ui/icons/PhotoCameraRounded";
import type { Book } from "~/components/CreatorBookForm/types";
import Tesseract from 'tesseract.js';
import { BrowserMultiFormatReader } from '@zxing/browser';

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
import { getLibrarianApiBaseUrl } from '~/helpers/api';


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

type TabKey = 'isbn' | 'barcode' | 'picture';

const TAB_CONTENT: Record<TabKey, { heading: string[]; description: string }> = {
    isbn: {
        heading: ['Εισάγετε', 'το isbn του βιβλίου', 'που θέλετε να αρχειοθετήσετε'],
        description: 'Χειροκίνητη εισαγωγή ISBN και ανάκτηση στοιχείων.'
    },
    barcode: {
        heading: ['Σαρώστε', 'το barcode του βιβλίου', 'με το scanner σας'],
        description: 'Συνδέστε barcode scanner και πατήστε υποβολή για άμεση αναζήτηση.'
    },
    picture: {
        heading: ['Φωτογραφήστε', 'τον αριθμό από το οπισθόφυλλο', 'και μετατρέψτε τον σε ISBN'],
        description: 'Ανεβάστε φωτογραφία ή πληκτρολογήστε τον αριθμό που αναγνωρίστηκε.'
    }
};

const TABS: { key: TabKey; label: string }[] = [
    { key: 'isbn', label: 'ISBN' },
    { key: 'barcode', label: 'Barcode' },
    { key: 'picture', label: 'Number Picture' },
];

export function CreatorPageContent() {
    const { isOpen, open, close } = useDisclosure({ initialValue: false });
    const [activeTab, setActiveTab] = useState<TabKey>('isbn');
    const [searchTitleValue, setSearchTitleValue] = useState('');
    const [searchPublisherValue, setSearchPublisherValue] = useState('');
    const inputReference = useRef<HTMLInputElement>(null);
    const [searchValue, setSearchValue] = useState('978960');
    const [barcodeValue, setBarcodeValue] = useState('');
    const [pictureNumberValue, setPictureNumberValue] = useState('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const [barcodeFileName, setBarcodeFileName] = useState<string>();
    const [barcodeOcrStatus, setBarcodeOcrStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
    const [barcodeOcrError, setBarcodeOcrError] = useState<string | null>(null);
    const pictureInputRef = useRef<HTMLInputElement>(null);
    const [pictureFileName, setPictureFileName] = useState<string>();
    const [ocrStatus, setOcrStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
    const [ocrError, setOcrError] = useState<string | null>(null);
    const [book, setBook] = useState<Book | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const apiBaseUrl = useMemo(getLibrarianApiBaseUrl, []);
    const axiosInstance = useMemo(() => axios.create({
        baseURL: apiBaseUrl,
    }), [apiBaseUrl]);

    const { refs } = useDropdown({  onClose: close });

    const handleTitleSubmit: FormEventHandler<HTMLFormElement> = async(event) => {
        event.preventDefault()
        await router.push({
            pathname: '/search',
            query: { search: searchTitleValue, isbn: searchValue, publisher: searchPublisherValue, data: JSON.stringify(book) }
        })
    }

    const fetchBookByIsbn = async (lookup: string) => {
        if (!lookup) return;
        open();
        setLoading(true);
        const dataPost2 = {
            username: 'evangelos.karakaxis@gmail.com',
            password: 'testing123',
            isbn: lookup,
        };
        try {
            const response = await axiosInstance.post('/get-book-from-biblionet', dataPost2, {
                headers: { 'Content-Type': 'application/json' },
            });
            const responseBooks: Book[] =
                response.data[0]?.map((responseBooks: any) => ({
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
                })) ?? [];
            if (responseBooks.length) {
                setBook(responseBooks[0]);
                setSearchTitleValue(responseBooks[0].Title);
                setSearchPublisherValue(responseBooks[0].Publisher);
            } else {
                await router.push(`/cart?isbn=${lookup}`);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        await fetchBookByIsbn(searchValue);
    };

    const handleBarcodeSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        setSearchValue(barcodeValue);
        await fetchBookByIsbn(barcodeValue);
    };

    const handlePictureSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        setSearchValue(pictureNumberValue);
        await fetchBookByIsbn(pictureNumberValue);
    };

    const handlePublisherReset = () => {
        setSearchPublisherValue('')
        inputReference.current?.focus();
    }
    const handleTitleReset = () => {
        setSearchTitleValue('')
        inputReference.current?.focus();
    }
    const handleBarcodeReset = () => setBarcodeValue('');
    const handlePictureNumberReset = () => setPictureNumberValue('');
    const handlePictureCaptureClick = () => pictureInputRef.current?.click();
    const handleBarcodeCaptureClick = () => barcodeInputRef.current?.click();

    const toDataUrl = (blob: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    const extractDigits = (text: string) => text.replace(/[^\d]/g, '').slice(0, 13);

    const runOcr = async (file: File) => {
        const imageData = await toDataUrl(file);
        const digitsOnlyConfig: Partial<Tesseract.WorkerOptions> & Record<string, string> = {
          tessedit_char_whitelist: '0123456789',
        };
        const { data } = await Tesseract.recognize(imageData, 'eng', digitsOnlyConfig);
        return extractDigits(data.text);
    };

    const barcodeReader = useMemo(() => new BrowserMultiFormatReader(), []);

    const handleBarcodeFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setBarcodeFileName(file.name);
        setBarcodeOcrStatus('processing');
        setBarcodeOcrError(null);

        const objectUrl = URL.createObjectURL(file);
        try {
            const result = await barcodeReader.decodeFromImageUrl(objectUrl);
            const digits = result.getText().replace(/[^\d]/g, '');
            if (!digits) throw new Error('no digits');
            setBarcodeValue(digits);
            setBarcodeOcrStatus('done');
        } catch (error) {
            console.error(error);
            setBarcodeValue('');
            setBarcodeOcrStatus('error');
            setBarcodeOcrError('Δεν αναγνωρίστηκε barcode. Προσπαθήστε ξανά με καθαρότερη φωτογραφία.');
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    };

    const handlePictureFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setPictureFileName(file.name);
        setOcrStatus('processing');
        setOcrError(null);
        try {
            const digits = await runOcr(file);
            if (!digits) throw new Error('no digits');
            setPictureNumberValue(digits);
            setOcrStatus('done');
        } catch (error) {
            console.error(error);
            setPictureNumberValue('');
            setOcrStatus('error');
            setOcrError('Αποτυχία OCR. Ελέγξτε τη φωτογραφία.');
        }
    };

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
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {TABS.map((tab) => (
                        <SfButton
                            key={tab.key}
                            variant={activeTab === tab.key ? 'primary' : 'secondary'}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </SfButton>
                    ))}
                </div>
                <div className="font-bold mt-6 typography-headline-4 md:typography-headline-3">
                    {TAB_CONTENT[activeTab].heading.map((line) => (
                        <h5 key={line}>{line}</h5>
                    ))}
                </div>
                <p className="mt-2 text-neutral-600">{TAB_CONTENT[activeTab].description}</p>

                {activeTab === 'isbn' && (
                    <form onSubmit={handleSubmit} ref={refs.setReference} className="mt-4">
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
                )}

                {activeTab === 'barcode' && (
                    <form onSubmit={handleBarcodeSubmit} className="mt-6 space-y-4">
                        <input
                            ref={barcodeInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className={classes.input}
                            onChange={handleBarcodeFileChange}
                        />
                        <div className="flex items-center gap-3">
                            <SfButton type="button" variant="secondary" onClick={handleBarcodeCaptureClick}>
                                Λήψη/Εισαγωγή Φωτογραφίας Barcode
                            </SfButton>
                            {barcodeFileName && (
                                <Box className="text-sm text-neutral-600">{barcodeFileName}</Box>
                            )}
                        </div>
                        {barcodeOcrStatus === 'processing' && (
                            <p className="text-sm text-neutral-600">Ανάλυση εικόνας...</p>
                        )}
                        {barcodeOcrStatus === 'done' && (
                            <p className="text-sm text-green-600">Βρέθηκε barcode: {barcodeValue}</p>
                        )}
                        {barcodeOcrStatus === 'error' && barcodeOcrError && (
                            <p className="text-sm text-red-600">{barcodeOcrError}</p>
                        )}
                        <SfInput
                            value={barcodeValue}
                            type="text"
                            onChange={(event) => setBarcodeValue(event.target.value)}
                            aria-label="Barcode"
                            placeholder="Αριθμός από Σάρωση barcode"
                            slotPrefix={<SfIconGridView />}
                            slotSuffix={
                                !!barcodeValue && (
                                    <button
                                        type="button"
                                        onClick={handleBarcodeReset}
                                        aria-label="Reset barcode"
                                        className="flex rounded-md focus-visible:outline focus-visible:outline-offset"
                                    >
                                        <SfIconCancel />
                                    </button>
                                )
                            }
                        />
                        <SfButton type="submit" className="w-full md:w-1/3">
                            Αναζήτηση με Barcode
                        </SfButton>
                    </form>
                )}

                {activeTab === 'picture' && (
                    <form onSubmit={handlePictureSubmit} className="mt-6 space-y-4">
                        <input
                            ref={pictureInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className={classes.input}
                            onChange={handlePictureFileChange}
                        />
                        <div className="flex items-center gap-3">
                            <SfButton type="button" variant="secondary" onClick={handlePictureCaptureClick}>
                                Λήψη/Εισαγωγή Φωτογραφίας
                            </SfButton>
                            {pictureFileName && <Box className="text-sm text-neutral-600">{pictureFileName}</Box>}
                        </div>
                        {ocrStatus === 'processing' && <p className="text-sm text-neutral-600">Ανάλυση εικόνας...</p>}
                        {ocrStatus === 'done' && (
                            <p className="text-sm text-green-600">Βρέθηκε αριθμός: {pictureNumberValue}</p>
                        )}
                        {ocrStatus === 'error' && ocrError && (
                            <p className="text-sm text-red-600">{ocrError}</p>
                        )}
                        <SfInput
                            value={pictureNumberValue}
                            type="text"
                            onChange={(event) => setPictureNumberValue(event.target.value)}
                            aria-label="Number from picture"
                            placeholder="Αριθμός ISBN από φωτογραφία"
                            slotPrefix={<SfIconPerson />}
                            slotSuffix={
                                !!pictureNumberValue && (
                                    <button
                                        type="button"
                                        onClick={handlePictureNumberReset}
                                        aria-label="Reset number"
                                        className="flex rounded-md focus-visible:outline focus-visible:outline-offset"
                                    >
                                        <SfIconCancel />
                                    </button>
                                )
                            }
                        />
                        <SfButton type="submit" className="w-full md:w-1/3">
                            Αναζήτηση
                        </SfButton>
                    </form>
                )}

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
