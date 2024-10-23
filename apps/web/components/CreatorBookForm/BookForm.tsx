import { FormEventHandler, useEffect, useRef, useState } from 'react';
import {
    SfButton,
    SfCheckbox,
    SfIconClose,
    SfInput,
    SfLoaderCircular,
    SfModal,
    SfSelect,
    useDisclosure
} from '@storefront-ui/react';
import { useTranslation } from 'next-i18next';
import {FormHelperText, FormLabel, Overlay} from '~/components';
import type {BookFormFields, BookFormProps} from "~/components/CreatorBookForm/types";
import axios from "axios";
import type { Book } from "~/components/CreatorBookForm/types";
import { TextareaAutosize } from '@mui/base/TextareaAutosize';
import {ContactInformationForm} from "~/components/ContactInformation/ContactInformationForm";
import {useRouter} from "next/router";


const emptyBook: Book = {
    customer_id: '2',
    Title: '',
    Subtitle: '',
    TitlesID: '',
    CoverImage: '',
    ISBN: '',
    PublisherID: '',
    Publisher: '',
    WriterID: '',
    Writer: '',
    WriterName: '',
    FirstPublishDate: '',
    CurrentPublishDate: '',
    PlaceID: '',
    Place: '',
    EditionNo: '',
    Cover: '',
    Dimensions: '',
    PageNo: '',
    Availability: '',
    Price: '',
    VAT: '',
    Weight: '',
    AgeFrom: '',
    AgeTo: '',
    Summary: '',
    LanguageID: '',
    Language: '',
    LanguageOriginalID: '',
    LanguageOriginal: '',
    LanguageTranslatedFromID: '',
    LanguageTranslatedFrom: '',
    Series: '',
    MultiVolumeTitle: '',
    VolumeNo: '',
    VolumeCount: '',
    Specifications: '',
    Comments: '',
    CategoryID: '',
    Category: '',
    SubjectsID: '',
    SubjectTitle: '',
    SubjectDDC: '',
    SubjectOrder: ''
};

export function BookForm({ type, onSave, onClear, savedBook, titleOfBook, isbnOfBook, bookDetails }: BookFormProps): JSX.Element {
    const { t } = useTranslation('address');
    const isCartUpdateLoading = false;
    const { isOpen, open, close } = useDisclosure({ initialValue: false });
    const router = useRouter();


    const formReference = useRef<HTMLFormElement>(null);

    const [error, setError] = useState(null);
    const [summary, setSummary ] = useState('');
    const [loading, setLoading] = useState(true);
    const axiosInstance = axios.create({
        baseURL: 'https://librarian-api.notia-evia.gr',
    });
    const [book, setBook] = useState<Book>( JSON.parse( JSON.stringify( bookDetails )))


    const dataPost2 = {
        "username" : "evangelos.karakaxis@gmail.com",
        "password" : "testing123",
        "title": book.TitlesID
    }
    const dataPost3 = {
        "username" : "evangelos.karakaxis@gmail.com",
        "password" : "testing123",
        "isbn": isbnOfBook
    }

    useEffect(() => {
        axiosInstance.post('/get-subject-book-from-biblionet', dataPost2)
            .then((response) => {
                if (response.status >= 400) {
                    throw new Error("server error");
                }
                let responseBooks: Book[] = response.data[0]?.map((responseBooks: any) => {
                    return {
                        SubjectsID: responseBooks.SubjectsID,
                        SubjectTitle: responseBooks.SubjectTitle,
                        SubjectDDC: responseBooks.SubjectDDC,
                        SubjectOrder: responseBooks.SubjectOrder,
                    }
                })
                setBook( Object.assign(book, responseBooks[0]) )
            })
            .catch((error) => setError(error))
            .finally(() => setLoading(false));


        axiosInstance.post('/get-book-from-biblionet', dataPost3,
            { headers: {"Content-Type": 'application/json'}},
            ).then((response) => {
                if (response.status >= 400) {
                    throw new Error("server error");
                }
                let responseBooks: Book[] = response.data[0]?.map((responseBooks: any) => {
                    return {
                        Summary: responseBooks.Summary,
                    }
                })
                setSummary(responseBooks[0].Summary)
            })
            .catch((error) => setError(error))
            .finally(() => setLoading(false));


    }, []
    );

    const handleClearAll = (): void => {
        setBook(emptyBook);
        setSummary('')
        if (typeof onClear === 'function') {
            onClear();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBook({ ...book, [e.target.name]: e.target.value });
    };


    const handleSave: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        setBook(Object.assign(book, {
            customer_id: '2',
            Summary: summary
        }))
        console.log('Form data submitted successfully:', book);
        axiosInstance.post('/create-book', book)
            .then((response) => {
                    if (response.status >= 400) {
                        throw new Error("server error");
                    }
                    if (response.status == 200) {
                        open()

                        let count = 0;
                        //Implementing the setInterval method
                        setTimeout(() => {
                            router.push(`/`)
                        }, 3000);

                    }
                }
            )
            .catch((error) => setError(error))

    };

    return (
        <form
            className="grid grid-cols-1 md:grid-cols-[50%_1fr_120px] gap-4"
            data-testid="book-form"
            onSubmit={handleSave}
            ref={formReference}
        >


            <div className="md:col-span-2 flex justify-start gap-4">
                <SfButton type="reset" onClick={handleClearAll} className="max-md:w-1/2" variant="secondary">
                    Σβήσιμο Όλων
                </SfButton>
                <SfButton type="submit" className="w-1/2 md:w-1/6" disabled={isCartUpdateLoading}>
                    {isCartUpdateLoading ? (
                        <SfLoaderCircular className="flex justify-center items-center" size="sm" />
                    ) : (
                        <span>Αποθήκευση Βιβλίου </span>
                    )}
                </SfButton>
            </div>
            <div className="col-span-2">
            <label >
                <FormLabel >Τίτλος</FormLabel>
                <SfInput name="Title" autoComplete="given-name"
                         value={book.Title}
                         onChange={handleChange}
                         required />
            </label></div>
            <label className="md:col-span-2 col-span-2">
                <FormLabel>Υπότιτλος</FormLabel>
                <SfInput name="Subtitle" onChange={handleChange}  defaultValue={book.Subtitle}  />
            </label>
            <label className="md:col-span-2">
                <FormLabel>Συγγραφέας</FormLabel>
                <SfInput name="writerName"
                         onChange={handleChange}
                         defaultValue={book.WriterName}  />
            </label>
            <label className="md:col-span-2  w-48">
                <FormLabel>Εκδότης</FormLabel>
                <SfInput name="Publisher"
                         onChange={handleChange}
                         defaultValue={book.Publisher}  />
            </label>
            <label className=" md:col-span-2">
                <FormLabel>Κατηγορία Ταξινόμησης</FormLabel>
                <SfInput
                    name="SubjectTitle"
                    onChange={handleChange}
                    defaultValue={book.SubjectTitle}  />
            </label>
            <label  className=" md:col-span-2">
                <FormLabel>Αριθμός Ταξινόμησης</FormLabel>
                <SfInput name="SubjectNumber"
                         onChange={handleChange}
                         defaultValue={book.SubjectDDC}  />
            </label>
            <label className="col-span-2 ">
                <div className="col-span-2 pb-4">
                 <FormLabel >Περίληψη</FormLabel>
                </div>
                <TextareaAutosize minRows="3"  className="w-full"  maxRows="10" name="summary"  defaultValue={summary}    />
            </label>





        {isOpen && (
            <Overlay visible={isOpen}>
                <SfModal
                    as="section"
                    role="dialog"
                    className=" overflow-auto md:w-[600px] md:h-fit"
                    open={isOpen}
                    onClose={close}
                    aria-labelledby="contact-modal-title"
                >
                    <header>
                        <SfButton square variant="tertiary" className="absolute right-2 top-2" onClick={close}>
                            <SfIconClose />
                        </SfButton>
                        <h3 id="contact-modal-title" className="text-neutral-900 text-lg md:text-2xl font-bold mb-4">
                            Η εισαγωγή του βιβλίου έγινε με επιτυχία
                        </h3>
                    </header>
                    <div className="text-neutral-900 text-lg">σε λίγα δευτερόλεπτα θα επιστρέψετε στην Αρχική</div>
                </SfModal>
            </Overlay>
        )}
        </form>

    );
}
