import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { SfButton, SfCheckbox, SfInput, SfLoaderCircular, SfSelect } from '@storefront-ui/react';
import { useTranslation } from 'next-i18next';
import { FormHelperText, FormLabel } from '~/components';
import type {BookFormFields, BookFormProps} from "~/components/CreatorBookForm/types";
import axios from "axios";
import type { Book } from "~/components/CreatorBookForm/types";
import { TextareaAutosize } from '@mui/base/TextareaAutosize';




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

    const formReference = useRef<HTMLFormElement>(null);

    const [error, setError] = useState(null);
    const [summary, setSummary ] = useState('');
    const [loading, setLoading] = useState(true);
    const axiosInstance = axios.create({
        baseURL: 'http://127.0.0.1:4000',
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
        // setDefaultValues({ ...defaultValues, [e.target.name]: e.target.value });
        setBook({ ...book, [e.target.name]: e.target.value });
    };


    const handleSave: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        try {
            setBook(Object.assign(book, {
                customer_id: '2',
                Summary: summary
            }))
            console.log('Form data submitted successfully:', book);
            const response = axiosInstance.post('/create-book', book);
            // You can add additional logic here, such as displaying a success message
        } catch (error) {
            console.error('Error submitting form data:', error);
            // You can add error handling logic here, such as displaying an error message
        }

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



        </form>
    );
}
