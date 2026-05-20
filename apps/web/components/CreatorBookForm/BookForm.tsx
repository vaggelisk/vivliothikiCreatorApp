import { FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import {
    SfButton,
    SfCheckbox,
    SfIconClose,
    SfInput,
    SfIconCheckCircle,
    SfIconCancel,
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
import {sortingOptions} from "~/mocks";
import {useProductAttribute} from "~/hooks";
import { getLibrarianApiBaseUrl } from '~/helpers/api';
import deweyCategories from '~/helpers/dewey-categories.json';


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

type DeweySubcategory = {
    code: string;
    label: string;
};

type DeweyCategory = {
    code: string;
    label: string;
    subcategories: DeweySubcategory[];
};

type DeweyGuideEntry = {
    code: string;
    label: string;
    parentCode?: string;
    parentLabel?: string;
};

type DeweyMainCategory = {
    key: string;
    start: number;
    end: number;
    code: string;
    label: string;
};

type DeweySubcategoryRange = {
    key: string;
    start: number;
    end: number;
    label: string;
};

export function BookForm({ type, onSave, onClear, savedBook, titleOfBook, subtitleOfBook, isbnOfBook, authorOfBook, publisherOfBook, summaryOfBook, bookDetails }: BookFormProps): JSX.Element {
    const { t } = useTranslation('address');
    const isCartUpdateLoading = false;
    const { isOpen, open, close } = useDisclosure({ initialValue: false });
    const {
        isOpen: isGuideOpen,
        open: openGuide,
        close: closeGuide,
    } = useDisclosure({ initialValue: false });
    const router = useRouter();
    const isSearchOnEditors = router.route === '/search-on-editors';
    const requiredClassificationMessage = 'Η Υποκατηγορία και ο Αριθμός Ταξινόμησης είναι πεδία υποχρεωτικά';


    const formReference = useRef<HTMLFormElement>(null);
    let errorInResponse = useRef(false)


    const [error, setError] = useState(null);
    const [summary, setSummary ] = useState('');
    const [loading, setLoading] = useState(true);
    const [loading2, setLoading2] = useState(true);
    const [guideQuery, setGuideQuery] = useState('');
    const [selectedMainCategoryKey, setSelectedMainCategoryKey] = useState('');
    const [selectedSubcategoryRangeKey, setSelectedSubcategoryRangeKey] = useState('');
    const apiBaseUrl = useMemo(getLibrarianApiBaseUrl, []);
    const axiosInstance = useMemo(() => axios.create({
        baseURL: apiBaseUrl,
    }), [apiBaseUrl]);
    const [book, setBook] = useState<Book>( JSON.parse( JSON.stringify( bookDetails )))

    const contributorOptions = [
        { "value": "214", "label": "Βιβλιοθήκη" },
        { "value": "215", "label": "Κάντρο" },
        { "value": "216", "label": "Διάκενο" },
        { "value": "217", "label": "Αντώνης Λαρισα" },
        { "value": "218", "label": "Αβδελάς" }
    ];

    const [selectedContributor, setSelectedContributor] = useState(contributorOptions[0].value);

    const deweyGuideEntries = useMemo<DeweyGuideEntry[]>(() => {
        const source = deweyCategories as DeweyCategory[];
        const rows: DeweyGuideEntry[] = [];

        for (const category of source) {
            rows.push({ code: category.code, label: category.label });
            for (const subcategory of category.subcategories ?? []) {
                rows.push({
                    code: subcategory.code,
                    label: subcategory.label,
                    parentCode: category.code,
                    parentLabel: category.label,
                });
            }
        }

        return rows;
    }, []);

    const filteredDeweyEntries = useMemo(() => {
        const query = guideQuery.trim().toLowerCase();
        if (!query) {
            return deweyGuideEntries;
        }

        return deweyGuideEntries.filter((entry) => {
            const composite = `${entry.code} ${entry.label} ${entry.parentCode ?? ''} ${entry.parentLabel ?? ''}`.toLowerCase();
            return composite.includes(query);
        });
    }, [deweyGuideEntries, guideQuery]);

    const deweyMainCategories = useMemo<DeweyMainCategory[]>(() => {
        const fromSource = new Map<string, string>();
        for (const entry of deweyGuideEntries) {
            if (/^\d{3}$/.test(entry.code)) {
                fromSource.set(entry.code, entry.label);
            }
        }

        const fallbackLabels: Record<string, string> = {
            '000': 'Γενικά βιβλία',
            '100': 'Φιλοσοφία. Παραφυσικά φαινόμενα. Ψυχολογία',
            '200': 'Θρησκεία',
            '300': 'Κοινωνικές επιστήμες',
            '400': 'Γλώσσα',
            '500': 'Φυσικές επιστήμες και μαθηματικά',
            '600': 'Τεχνολογία (Εφαρμοσμένες επιστήμες)',
            '700': 'Τέχνες και διασκέδαση',
            '800': 'Λογοτεχνία',
            '900': 'Ιστορία και γεωγραφία',
        };

        return [0, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((start) => {
            const code = String(start).padStart(3, '0');
            return {
                key: code,
                start,
                end: start + 99,
                code,
                label: fromSource.get(code) ?? fallbackLabels[code] ?? code,
            };
        });
    }, [deweyGuideEntries]);

    const rangeFilteredEntries = useMemo(() => {
        if (!selectedMainCategoryKey) {
            return filteredDeweyEntries;
        }

        const start = Number(selectedMainCategoryKey);
        const end = start + 99;

        return filteredDeweyEntries.filter((entry) => {
            const majorCode = Number(entry.code.split('.')[0]);
            return Number.isFinite(majorCode) && majorCode >= start && majorCode <= end;
        });
    }, [filteredDeweyEntries, selectedMainCategoryKey]);

    const subcategoryRanges = useMemo<DeweySubcategoryRange[]>(() => {
        if (!selectedMainCategoryKey) {
            return [];
        }

        const base = Number(selectedMainCategoryKey);
        if (!Number.isFinite(base)) {
            return [];
        }

        const threeDigitLabels = new Map<string, string>();
        for (const entry of deweyGuideEntries) {
            if (/^\d{3}$/.test(entry.code)) {
                threeDigitLabels.set(entry.code, entry.label);
            }
        }

        const formatCode = (value: number) => String(value).padStart(3, '0');

        return Array.from({ length: 10 }, (_, index) => {
            const start = base + index * 10;
            const end = index === 9 ? base + 99 : base + (index + 1) * 10;
            const startCode = formatCode(start);
            const startLabel = threeDigitLabels.get(startCode) ?? '';

            return {
                key: `${start}-${end}`,
                start,
                end,
                label: `${formatCode(start)}-${formatCode(end)}${startLabel ? ` ${startLabel}` : ''}`,
            };
        });
    }, [deweyGuideEntries, selectedMainCategoryKey]);

    const subRangeFilteredEntries = useMemo(() => {
        if (!selectedSubcategoryRangeKey) {
            return rangeFilteredEntries;
        }

        const selectedRange = subcategoryRanges.find((range) => range.key === selectedSubcategoryRangeKey);
        if (!selectedRange) {
            return rangeFilteredEntries;
        }

        return rangeFilteredEntries.filter((entry) => {
            const code = Number(entry.code.split('.')[0]);
            return Number.isFinite(code) && code >= selectedRange.start && code <= selectedRange.end;
        });
    }, [rangeFilteredEntries, selectedSubcategoryRangeKey, subcategoryRanges]);

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
        if (book.TitlesID) {        // avto shmainei oti to exei vrei sto biblionet
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
                    setBook(Object.assign(book, responseBooks[0]))
                })
                .catch((error) => setError(error))
                .finally(() => setLoading2(false));


            axiosInstance.post('/get-book-from-biblionet', dataPost3,
                {headers: {"Content-Type": 'application/json'}},
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
        }
        else {
            book.ISBN = isbnOfBook ?? ''
            book.Title = titleOfBook ?? ''
            book.Subtitle = subtitleOfBook ?? ''
            book.WriterName = authorOfBook ?? ''
            book.Publisher = publisherOfBook ?? ''
            setSummary(summaryOfBook ?? '')
        }

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

    const handleDeweyPick = (entry: DeweyGuideEntry): void => {
        setBook((previous) => ({
            ...previous,
            SubjectDDC: entry.code,
            SubjectTitle: entry.label,
        }));
        closeGuide();
    };

    const handleSave: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        setBook(Object.assign(book, {
            customer_id: '2',                    // avto einai gia to api.noti-evia.gr
            // customer_id: '5',                 // avto einai gia to local yourdomain.gr
            Summary: summary,
            contributor: Number(selectedContributor),
        }))
        axiosInstance.post('/create-book', book)
            .then((response) => {
                    if (response.status >= 400) {
                        errorInResponse.current = true
                        throw new Error("server error");
                    }
                    if (response.status == 200) {
                        let resp = JSON.parse(response.data)
                        if (!resp.success) {
                            errorInResponse.current = true
                            open()
                        } else {
                            errorInResponse.current = false
                            open()
                            //Implementing the setInterval method
                            setTimeout(() => {
                                router.push(`/`)
                            }, 3000);
                        }
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
                <SfInput name="WriterName"
                         onChange={handleChange}
                         defaultValue={book.WriterName}  />
            </label>
            <label className="md:col-span-2  w-48">
                <FormLabel>Εκδότης</FormLabel>
                <SfInput name="Publisher"
                         onChange={handleChange}
                         defaultValue={book.Publisher}  />
            </label>
            <div className="md:col-span-2">
                <SfButton
                  type="button"
                  className="bg-black text-white hover:bg-neutral-800"
                  onClick={openGuide}
                >
                    Οδηγός Ταξινόμησης
                </SfButton>
            </div>
            <label className=" md:col-span-2">
                <FormLabel>
                    Υποκατηγορία Ταξινόμησης
                    {isSearchOnEditors && <span className="text-red-600"> *</span>}
                </FormLabel>
                <SfInput
                    name="SubjectTitle"
                    required={isSearchOnEditors}
                    onInvalid={(event) => {
                        if (isSearchOnEditors) {
                            event.currentTarget.setCustomValidity(requiredClassificationMessage);
                        }
                    }}
                    onInput={(event) => event.currentTarget.setCustomValidity('')}
                    onChange={handleChange}
                        value={book.SubjectTitle}  />
            </label>
            <label  className=" md:col-span-2">
                <FormLabel>
                    Αριθμός Ταξινόμησης
                    {isSearchOnEditors && <span className="text-red-600"> *</span>}
                </FormLabel>
                <SfInput name="SubjectDDC"
                         required={isSearchOnEditors}
                         onInvalid={(event) => {
                             if (isSearchOnEditors) {
                                 event.currentTarget.setCustomValidity(requiredClassificationMessage);
                             }
                         }}
                         onInput={(event) => event.currentTarget.setCustomValidity('')}
                         onChange={handleChange}
                         value={book.SubjectDDC}  />
            </label>
            <label className=" md:col-span-2">
                <FormLabel>ISBN</FormLabel>
                <SfInput
                    name="isbn"
                    onChange={handleChange}
                    defaultValue={book.ISBN}  />
            </label>
            <label  className=" md:col-span-2">
                <FormLabel>ISBN2</FormLabel>
                <SfInput name="isbn2"
                         onChange={handleChange}
                         defaultValue={isbnOfBook}  />
            </label>
            <label className="col-span-2">
                <span className="pb-1 text-sm font-medium text-neutral-900 font-body">Contributor</span>
                <SfSelect aria-label={t('contributor')}
                          value={selectedContributor}
                          onChange={e => setSelectedContributor(e.target.value)}
                >
                    {contributorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </SfSelect>
            </label>
            <label className="col-span-2 ">
                <div className="col-span-2 pb-4">
                 <FormLabel >Περίληψη</FormLabel>
                </div>
                                <TextareaAutosize
                                    minRows="3"
                                    className="w-full"
                                    maxRows="10"
                                    name="summary"
                                    value={summary}
                                    onChange={(event) => setSummary(event.target.value)}
                                />
            </label>

            <div className="md:col-span-2 flex justify-start gap-4">
                <SfButton type="reset" onClick={handleClearAll} className="max-md:w-1/2" variant="secondary">
                    Σβήσιμο Όλων
                </SfButton>
                <SfButton type="submit" className="w-1/2 md:w-1/6" disabled={isCartUpdateLoading}>
                    {isCartUpdateLoading ? (
                        <SfLoaderCircular className="flex justify-center items-center" size="sm" />
                    ) : (
                        <span>Αποθήκευση Βιβλίου</span>
                    )}
                </SfButton>
            </div>
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
                            {errorInResponse.current ?
                                <h3 id="contact-modal-title"
                                    className="text-neutral-900 text-lg md:text-2xl font-bold mb-4">
                                    <SfIconCancel  className="mr-4" color='red' />
                                        Η εισαγωγή του βιβλίου απέτυχε
                                </h3> :
                                <h3 id="contact-modal-title"
                                    className="text-neutral-900 text-lg md:text-2xl font-bold mb-4">
                                    <SfIconCheckCircle className="mr-4" color='black' />
                                        Η εισαγωγή του βιβλίου έγινε με επιτυχία
                                </h3>
                            }
                        </header>
                        {(errorInResponse.current) ?
                            <div className="text-neutral-900 text-lg">
                                Το πιθανότερο να φταίει ο πολύ  μεγάλος τίτλος ή εκδότης</div> :
                            <div className="text-neutral-900 text-lg">
                                σε λίγα δευτερόλεπτα θα επιστρέψετε στην Αρχική</div>
                        }
                    </SfModal>
                </Overlay>
            )}
            {isGuideOpen && (
                <Overlay visible={isGuideOpen}>
                    <SfModal
                        as="section"
                        role="dialog"
                        className="overflow-auto md:w-[600px] md:h-fit !p-0"
                        open={isGuideOpen}
                        onClose={closeGuide}
                        aria-labelledby="classification-guide-modal-title"
                    >
                        <div
                            className="w-full px-6 pt-4 pb-4"
                            style={{ background: 'rgb(1,137,55)' }}
                        >
                            <header>
                                <SfButton square variant="tertiary" className="absolute right-2 top-2" onClick={closeGuide}>
                                    <SfIconClose />
                                </SfButton>
                                <h3
                                    id="classification-guide-modal-title"
                                    className="text-white text-lg md:text-2xl font-bold mb-2"
                                >
                                    Οδηγός Ταξινόμησης
                                </h3>
                            </header>
                            <div className="text-white text-base">
                                Συμπληρώστε την Υποκατηγορία Ταξινόμησης και τον Αριθμό Ταξινόμησης με βάση το Σύστημα Dewey.
                            </div>
                        </div>
                        <div className="p-6 pt-4">
                        <div className="mt-4">
                            <div className="mb-2 text-sm font-medium text-neutral-900">Κύρια κατηγορία Dewey</div>
                            <SfSelect
                                value={selectedMainCategoryKey}
                                onChange={(event) => {
                                    setSelectedMainCategoryKey(event.target.value);
                                    setSelectedSubcategoryRangeKey('');
                                }}
                                aria-label="Κύρια κατηγορία Dewey"
                            >
                                <option value="">Επιλογή κύριας κατηγορίας</option>
                                {deweyMainCategories.map((mainCategory) => (
                                    <option key={mainCategory.key} value={mainCategory.key}>
                                        {`${mainCategory.start}-${mainCategory.end} ${mainCategory.label}`}
                                    </option>
                                ))}
                            </SfSelect>
                        </div>
                        <div className="mt-4">
                            <div className="mb-2 text-sm font-medium text-neutral-900">Υποκατηγορία</div>
                            <SfSelect
                                value={selectedSubcategoryRangeKey}
                                onChange={(event) => {
                                    setSelectedSubcategoryRangeKey(event.target.value);
                                }}
                                aria-label="Υποκατηγορία Dewey"
                            >
                                <option value="">Επιλογή υποκατηγορίας</option>
                                {subcategoryRanges.map((range) => (
                                    <option key={range.key} value={range.key}>
                                        {range.label}
                                    </option>
                                ))}
                            </SfSelect>
                        </div>
                        <div className="mt-4">
                            <SfInput
                                value={guideQuery}
                                onChange={(event) => setGuideQuery(event.target.value)}
                                placeholder="Αναζήτηση με αριθμό ή λέξη"
                            />
                        </div>
                        <div className="mt-4 max-h-[420px] overflow-auto border border-neutral-200 rounded-md">
                            {subRangeFilteredEntries.slice(0, 250).map((entry) => (
                                <button
                                    key={`${entry.code}-${entry.label}-${entry.parentCode ?? ''}`}
                                    type="button"
                                    className="w-full text-left px-3 py-2 border-b border-neutral-100 hover:bg-neutral-100"
                                    onClick={() => handleDeweyPick(entry)}
                                >
                                    <div className="font-semibold">{entry.code}</div>
                                    <div className="text-sm">{entry.label}</div>
                                    {entry.parentCode && entry.parentLabel && (
                                        <div className="text-xs text-neutral-500 mt-1">
                                            {entry.parentCode} - {entry.parentLabel}
                                        </div>
                                    )}
                                </button>
                            ))}
                            {subRangeFilteredEntries.length > 250 && (
                                <div className="p-3 text-xs text-neutral-500">
                                    Εμφανίζονται τα πρώτα 250 αποτελέσματα. Χρησιμοποιήστε πιο συγκεκριμένη αναζήτηση.
                                </div>
                            )}
                            {subRangeFilteredEntries.length === 0 && (
                                <div className="p-3 text-sm text-neutral-500">Δεν βρέθηκαν αποτελέσματα.</div>
                            )}
                        </div>
                        </div>
                    </SfModal>
                </Overlay>
            )}
        </form>
    );
}
