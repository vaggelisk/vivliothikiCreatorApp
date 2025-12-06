/* eslint-disable
  @next/next/no-html-link-for-pages,
  @next/next/no-img-element,
  max-lines,
  max-statements,
  sonarjs/cognitive-complexity,
  unicorn/no-for-loop,
  unicorn/prevent-abbreviations,
  unicorn/better-regex,
  unicorn/prefer-native-coercion-functions,
  unicorn/no-useless-undefined,
  react-hooks/exhaustive-deps
*/
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException, Result } from '@zxing/library';
import classNames from 'classnames';
import type { Book } from '~/components/CreatorBookForm/types';
import styles from '~/styles/scanner.module.scss';

type SourceKey = 'biblionet' | 'politeia' | 'amazon';

interface ScrapePayload {
  title?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  coverUrl?: string;
  description?: string;
  subtitle?: string;
  translator?: string;
  publicationDate?: string;
}

interface SourceState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: ScrapePayload | null;
  message?: string;
}

const DEFAULT_REMOTE_BASE = 'https://librarian-api.notia-evia.gr';
const SCANNER_BASE_URL = (process.env.NEXT_PUBLIC_SCANNER_API_URL?.trim() ?? '') || `${DEFAULT_REMOTE_BASE}/scanner`;
const MIDDLEWARE_BASE_URL = deriveMiddlewareBase(
  process.env.NEXT_PUBLIC_LIBRARY_API_URL?.trim(),
  SCANNER_BASE_URL,
  DEFAULT_REMOTE_BASE,
);

const BIBLIONET_USERNAME = process.env.NEXT_PUBLIC_BIBLIONET_USERNAME ?? 'evangelos.karakaxis@gmail.com';
const BIBLIONET_PASSWORD = process.env.NEXT_PUBLIC_BIBLIONET_PASSWORD ?? 'testing123';

const SOURCE_LABELS: Record<SourceKey, { title: string; url: (isbn: string) => string }> = {
  biblionet: {
    title: 'Biblionet',
    url: (isbn) => `https://www.biblionet.gr/search?q=${encodeURIComponent(isbn)}`,
  },
  politeia: {
    title: 'Πολιτεία',
    url: (isbn) =>
      `https://www.politeianet.gr/index.php?option=com_com_virtuemart&Itemid=721&keyword=${encodeURIComponent(isbn)}`,
  },
  amazon: {
    title: 'Amazon',
    url: (isbn) => `https://www.amazon.com/s?k=${encodeURIComponent(isbn)}&i=stripbooks-intl-ship`,
  },
};

const SOURCE_KEYS: SourceKey[] = ['biblionet', 'politeia', 'amazon'];

const hints = new Map<DecodeHintType, unknown>();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
]);
hints.set(DecodeHintType.TRY_HARDER, true);

const initialSources = (): Record<SourceKey, SourceState> => ({
  biblionet: { status: 'idle' },
  politeia: { status: 'idle' },
  amazon: { status: 'idle' },
});

const normaliseIsbn = (value: string) => value.replace(/[^0-9X]/gi, '').toUpperCase();

const toIsbn13 = (value: string): string => {
  if (value.length === 13) {
    return value;
  }
  if (value.length === 10) {
    const core = `978${value.slice(0, 9)}`;
    let sum = 0;
    for (let index = 0; index < core.length; index += 1) {
      const digit = Number(core[index]);
      sum += index % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return `${core}${checkDigit}`;
  }
  return value;
};

const SCANNER_ENDPOINT = `${SCANNER_BASE_URL.replace(/\/$/, '')}/api/scrape`;

const middlewareBaseUrl = MIDDLEWARE_BASE_URL.replace(/\/$/, '');

function deriveMiddlewareBase(explicit: string | undefined, scannerBase: string, fallback: string): string {
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  const normalised = scannerBase?.trim().replace(/\/$/, '');
  if (normalised && normalised.endsWith('/scanner')) {
    return normalised.slice(0, normalised.length - '/scanner'.length);
  }
  return normalised || fallback;
}

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
}

function mapBiblionetEntry(entry: Record<string, unknown>, isbn: string): Book {
  return {
    customer_id: '2',
    TitlesID: asString(entry.TitlesID),
    CoverImage: asString(entry.CoverImage),
    Title: asString(entry.Title),
    Subtitle: asString(entry.Subtitle),
    ISBN: asString(entry.ISBN) || isbn,
    PublisherID: asString(entry.PublisherID),
    Publisher: asString(entry.Publisher),
    WriterID: asString(entry.WriterID),
    Writer: asString(entry.Writer),
    WriterName: asString(entry.WriterName),
    FirstPublishDate: asString(entry.FirstPublishDate),
    CurrentPublishDate: asString(entry.CurrentPublishDate),
    PlaceID: asString(entry.PlaceID),
    Place: asString(entry.Place),
    EditionNo: asString(entry.EditionNo),
    Cover: asString(entry.Cover),
    Dimensions: asString(entry.Dimensions),
    PageNo: asString(entry.PageNo),
    Availability: asString(entry.Availability),
    Price: asString(entry.Price),
    VAT: asString(entry.VAT),
    Weight: asString(entry.Weight),
    AgeFrom: asString(entry.AgeFrom),
    AgeTo: asString(entry.AgeTo),
    Summary: asString(entry.Summary),
    LanguageID: asString(entry.LanguageID),
    Language: asString(entry.Language),
    LanguageOriginalID: asString(entry.LanguageOriginalID),
    LanguageOriginal: asString(entry.LanguageOriginal),
    LanguageTranslatedFromID: asString(entry.LanguageTranslatedFromID),
    LanguageTranslatedFrom: asString(entry.LanguageTranslatedFrom),
    Series: asString(entry.Series),
    MultiVolumeTitle: asString(entry.MultiVolumeTitle),
    VolumeNo: asString(entry.VolumeNo),
    VolumeCount: asString(entry.VolumeCount),
    Specifications: asString(entry.Specifications),
    Comments: asString(entry.Comments),
    CategoryID: asString(entry.CategoryID),
    Category: asString(entry.Category),
    SubjectsID: asString(entry.SubjectsID),
    SubjectTitle: asString(entry.SubjectTitle),
    SubjectDDC: asString(entry.SubjectDDC),
    SubjectOrder: asString(entry.SubjectOrder),
  };
}

function createFallbackBook(isbn: string, sources: Record<SourceKey, SourceState>): Book {
  const preferredOrder: SourceKey[] = ['biblionet', 'politeia', 'amazon'];
  const candidatePayload =
    preferredOrder.map((source) => sources[source]?.data).find((payload) => Boolean(payload)) ?? null;

  const payload = candidatePayload ?? {};

  return {
    customer_id: '2',
    TitlesID: '',
    CoverImage: asString(payload?.coverUrl),
    Title: asString(payload?.title),
    Subtitle: asString(payload?.subtitle),
    ISBN: isbn,
    PublisherID: '',
    Publisher: asString(payload?.publisher),
    WriterID: '',
    Writer: '',
    WriterName: asString(payload?.author),
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
    Summary: asString(payload?.description),
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
    SubjectOrder: '',
  };
}

async function fetchScrape(isbn: string, source: SourceKey): Promise<ScrapePayload | null> {
  const response = await fetch(SCANNER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      isbn,
      confirm: false,
      mode: 'isbn',
      query: isbn,
      source,
      collection: 'books',
    }),
  });

  const payload = (await response.json()) as {
    error?: string;
    scraped?: ScrapePayload | null;
  };

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Αποτυχία αναζήτησης.');
  }

  return payload.scraped ?? null;
}

export function ScannerContent() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanStage, setScanStage] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isbn, setIsbn] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<Result | null>(null);
  const [sources, setSources] = useState<Record<SourceKey, SourceState>>(initialSources);
  const [bookPayload, setBookPayload] = useState<Book | null>(null);
  const [detailStatus, setDetailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [detailMessage, setDetailMessage] = useState<string | null>(null);
  const [navigateState, setNavigateState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [navigateMessage, setNavigateMessage] = useState<string | null>(null);

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader(hints);
    return () => {
      readerRef.current = null;
    };
  }, [middlewareBaseUrl]);

  useEffect(
    () => () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    },
    [objectUrl],
  );

  const hasValidCrop = useMemo(
    () => Boolean(imageRef.current && completedCrop && completedCrop.width > 2 && completedCrop.height > 2),
    [completedCrop],
  );

  const fetchBookDetails = useCallback(async (isbnValue: string): Promise<Book | null> => {
    const response = await fetch(`${middlewareBaseUrl}/get-book-from-biblionet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: BIBLIONET_USERNAME,
        password: BIBLIONET_PASSWORD,
        isbn: isbnValue,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: 'Αποτυχία επικοινωνίας με το Biblionet.' }));
      const message = (payload as { error?: string })?.error ?? `Το Biblionet επέστρεψε σφάλμα (${response.status}).`;
      throw new Error(message);
    }

    const data = await response.json();
    const entries = Array.isArray(data) ? data[0] : data?.[0];

    if (!Array.isArray(entries) || entries.length === 0) {
      return null;
    }

    return mapBiblionetEntry(entries[0] as Record<string, unknown>, isbnValue);
  }, []);

  const loadBookDetails = useCallback(
    async (isbnValue: string) => {
      setDetailStatus('loading');
      setDetailMessage(null);
      try {
        const detailed = await fetchBookDetails(isbnValue);
        if (detailed) {
          setBookPayload(detailed);
          setDetailStatus('success');
        } else {
          setBookPayload(null);
          setDetailStatus('error');
          setDetailMessage('Δεν βρέθηκαν λεπτομέρειες στο Biblionet για αυτό το ISBN.');
        }
      } catch (error) {
        setBookPayload(null);
        setDetailStatus('error');
        setDetailMessage(error instanceof Error ? error.message : 'Παρουσιάστηκε σφάλμα κατά την ανάκτηση στοιχείων.');
      }
    },
    [fetchBookDetails],
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }

    const nextUrl = URL.createObjectURL(file);
    setObjectUrl(nextUrl);
    setImageUrl(nextUrl);
    setCrop(undefined);
    setCompletedCrop(null);
    setScanStage('idle');
    setScanMessage(null);
    setIsbn(null);
    setLastResult(null);
    setSources(initialSources());
    setBookPayload(null);
    setDetailStatus('idle');
    setDetailMessage(null);
    setNavigateState('idle');
    setNavigateMessage(null);
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const element = event.currentTarget;
    imageRef.current = element;
    const { width, height } = element;
    const defaultWidth = Math.min(width * 0.8, width);
    const defaultHeight = Math.min(height * 0.4, height);
    const x = (width - defaultWidth) / 2;
    const y = (height - defaultHeight) / 2;
    const nextCrop: Crop = {
      unit: 'px',
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
    };
    setCrop(nextCrop);
    setCompletedCrop({
      unit: 'px',
      x,
      y,
      width: defaultWidth,
      height: defaultHeight,
    });
  };

  const clearImage = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    setObjectUrl(null);
    setImageUrl(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setScanStage('idle');
    setScanMessage(null);
    setIsbn(null);
    setLastResult(null);
    setSources(initialSources());
    setBookPayload(null);
    setDetailStatus('idle');
    setDetailMessage(null);
    setNavigateState('idle');
    setNavigateMessage(null);
  };

  const handleScan = async () => {
    if (!imageRef.current) {
      setScanStage('error');
      setScanMessage('Παρακαλώ ανέβασε πρώτα μια εικόνα.');
      return;
    }
    if (!completedCrop || completedCrop.width <= 2 || completedCrop.height <= 2) {
      setScanStage('error');
      setScanMessage('Επίλεξε περιοχή με το barcode για να γίνει το scan.');
      return;
    }

    const canvas = document.createElement('canvas');
    const image = imageRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = Math.floor(completedCrop.width * scaleX);
    canvas.height = Math.floor(completedCrop.height * scaleY);

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      setScanStage('error');
      setScanMessage('Δεν ήταν δυνατή η προετοιμασία της εικόνας για ανάγνωση.');
      return;
    }

    context.imageSmoothingEnabled = true;
    context.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    setScanStage('scanning');
    setScanMessage('Ανάγνωση barcode...');
    setNavigateState('idle');
    setNavigateMessage(null);

    try {
      let reader = readerRef.current;
      if (!reader) {
        reader = new BrowserMultiFormatReader(hints);
        readerRef.current = reader;
      }

      const result = await reader.decodeFromCanvas(canvas);
      setLastResult(result);
      const text = result.getText();
      const normalised = normaliseIsbn(text);
      if (!normalised) {
        throw new Error('Δεν εντοπίστηκε ISBN στο αποτέλεσμα.');
      }

      const isbnCandidate = toIsbn13(normalised);
      setIsbn(isbnCandidate);
      setScanStage('success');
      setScanMessage('Το barcode διαβάστηκε επιτυχώς.');

      setSources({
        biblionet: { status: 'loading' },
        politeia: { status: 'loading' },
        amazon: { status: 'loading' },
      });

      await Promise.all([
        loadBookDetails(isbnCandidate),
        ...SOURCE_KEYS.map(async (source) => {
          try {
            const data = await fetchScrape(isbnCandidate, source);
            setSources((prev) => ({
              ...prev,
              [source]: data
                ? {
                    status: 'success',
                    data,
                  }
                : {
                    status: 'error',
                    message: 'Δεν βρέθηκε αποτέλεσμα.',
                  },
            }));
          } catch (error) {
            setSources((prev) => ({
              ...prev,
              [source]: {
                status: 'error',
                message: error instanceof Error ? error.message : 'Παρουσιάστηκε σφάλμα κατά την αναζήτηση.',
              },
            }));
          }
        }),
      ]);
    } catch (error) {
      let message = 'Παρουσιάστηκε σφάλμα κατά την ανάγνωση του barcode.';
      if (error instanceof NotFoundException) {
        message = 'Δεν βρέθηκε barcode στην επιλεγμένη περιοχή. Δοκίμασε ξανά.';
      } else if (error instanceof Error) {
        message = error.message;
      }
      setScanStage('error');
      setScanMessage(message);
      setIsbn(null);
      setSources(initialSources());
      setBookPayload(null);
      setDetailStatus('error');
      setDetailMessage(message);
    }
  };

  const handleContinueToForm = useCallback(async () => {
    if (!isbn) {
      setNavigateState('error');
      setNavigateMessage('Δεν έχει εντοπιστεί ακόμη ISBN.');
      return;
    }

    setNavigateState('loading');
    setNavigateMessage(null);

    try {
      let payload = bookPayload;
      if (!payload) {
        payload = await fetchBookDetails(isbn);
      }
      const bookData = payload ?? createFallbackBook(isbn, sources);

      await router.push({
        pathname: '/search-on-editors',
        query: {
          search: bookData.Title ?? '',
          isbn,
          publisher: bookData.Publisher ?? '',
          author: bookData.WriterName ?? '',
          data: JSON.stringify(bookData),
        },
      });
      setNavigateState('idle');
    } catch (error) {
      setNavigateState('error');
      setNavigateMessage(
        error instanceof Error ? error.message : 'Παρουσιάστηκε σφάλμα κατά τη μετάβαση στη φόρμα καταχώρισης.',
      );
    }
  }, [bookPayload, fetchBookDetails, isbn, router, sources]);

  return (
    <>
      <Head>
        <title>Scanner | αυτοοργανωμένη βιβλιοθήκη</title>
      </Head>
      <div className={styles['app-shell']}>
        <main className={styles.page}>
          <header className={styles['page-header']}>
            <h1>Scanner</h1>
            <p>
              Ανέβασε μια εικόνα με barcode ISBN, επίλεξε την περιοχή και εκτέλεσε σάρωση. Το σύστημα αναζητά
              αποτελέσματα σε Biblionet, Πολιτεία και Amazon και ετοιμάζει την καταχώριση στη βιβλιοθήκη.
            </p>
          </header>

          <section className={styles.workspace}>
            <div className={classNames(styles.panel, styles['image-panel'])}>
              <div className={styles['upload-controls']}>
                <label className={styles['upload-label']} htmlFor="file-input">
                  Επιλογή εικόνας
                </label>
                <input id="file-input" type="file" accept="image/*" onChange={handleFileChange} />
                {imageUrl && (
                  <button
                    type="button"
                    className={classNames(styles.button, styles['button-alt'])}
                    onClick={clearImage}
                  >
                    Καθαρισμός
                  </button>
                )}
              </div>

              {imageUrl ? (
                <div className={styles['crop-stage']}>
                  <ReactCrop
                    crop={crop}
                    onChange={(nextCrop) => setCrop(nextCrop)}
                    onComplete={(nextCrop) => setCompletedCrop(nextCrop)}
                    minWidth={32}
                    minHeight={32}
                    keepSelection
                  >
                    <img ref={imageRef} src={imageUrl} alt="Barcode προς ανάγνωση" onLoad={handleImageLoad} />
                  </ReactCrop>
                </div>
              ) : (
                <div className={styles['empty-stage']}>
                  <p>Φόρτωσε μια φωτογραφία που περιέχει barcode. Στη συνέχεια επίλεξε την περιοχή για σάρωση.</p>
                </div>
              )}

              <div className={styles['scan-actions']}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={handleScan}
                  disabled={!imageUrl || !hasValidCrop || scanStage === 'scanning'}
                >
                  {scanStage === 'scanning' ? 'Σάρωση...' : 'Σάρωση περιοχής'}
                </button>
                {isbn && (
                  <div className={styles['isbn-pill']}>
                    <span>ISBN</span>
                    <strong>{isbn}</strong>
                  </div>
                )}
              </div>

              {scanMessage && (
                <div
                  className={classNames(styles['scan-status'], {
                    [styles['is-error']]: scanStage === 'error',
                    [styles['is-success']]: scanStage === 'success',
                  })}
                >
                  {scanMessage}
                </div>
              )}
            </div>

            <div className={classNames(styles.panel, styles['results-panel'])}>
              <h2>Αποτελέσματα αναζήτησης</h2>
              <p className={styles['results-hint']}>
                Μετά την ανάγνωση του barcode, εκτελούνται ταυτόχρονες αναζητήσεις σε όλες τις πηγές.
              </p>

              <div className={styles['results-grid']}>
                {SOURCE_KEYS.map((source) => {
                  const state = sources[source];
                  const label = SOURCE_LABELS[source];
                  const data = state.data ?? null;
                  return (
                    <article key={source} className={styles['result-card']}>
                      <header className={styles['result-header']}>
                        <div>
                          <h3>{label.title}</h3>
                          {isbn && (
                            <a href={label.url(isbn)} target="_blank" rel="noopener noreferrer">
                              Άνοιγμα σελίδας
                            </a>
                          )}
                        </div>
                        <span
                          className={classNames(styles.badge, styles[`status-${state.status}` as const] ?? undefined)}
                        >
                          {state.status}
                        </span>
                      </header>
                      <div className={styles['result-body']}>
                        {state.status === 'idle' && <p>Περιμένω σάρωση barcode.</p>}
                        {state.status === 'loading' && <p>Αναζήτηση...</p>}
                        {state.status === 'error' && (
                          <p className={styles['result-error']}>
                            {state.message ?? 'Δεν βρέθηκε αποτέλεσμα για αυτό το ISBN.'}
                          </p>
                        )}
                        {state.status === 'success' && data && (
                          <div className={styles['result-details']}>
                            {data.coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={data.coverUrl} alt="" />
                            ) : (
                              <div className={styles['cover-placeholder']} aria-hidden>
                                ?
                              </div>
                            )}
                            <dl>
                              <div>
                                <dt>Τίτλος</dt>
                                <dd>{data.title ?? '—'}</dd>
                              </div>
                              <div>
                                <dt>Συγγραφέας</dt>
                                <dd>{data.author ?? '—'}</dd>
                              </div>
                              <div>
                                <dt>Εκδότης</dt>
                                <dd>{data.publisher ?? '—'}</dd>
                              </div>
                              <div>
                                <dt>ISBN</dt>
                                <dd>{data.isbn ?? isbn ?? '—'}</dd>
                              </div>
                              {data.subtitle && (
                                <div>
                                  <dt>Υπότιτλος</dt>
                                  <dd>{data.subtitle}</dd>
                                </div>
                              )}
                              {data.translator && (
                                <div>
                                  <dt>Μετάφραση</dt>
                                  <dd>{data.translator}</dd>
                                </div>
                              )}
                              {data.publicationDate && (
                                <div>
                                  <dt>Ημ. έκδοσης</dt>
                                  <dd>{data.publicationDate}</dd>
                                </div>
                              )}
                              {data.description && (
                                <div>
                                  <dt>Περιγραφή</dt>
                                  <dd>{data.description}</dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={classNames(styles.panel, styles['integration-panel'])}>
            <h2>Καταχώριση στη βιβλιοθήκη</h2>
            <p className={styles['integration-hint']}>
              Με την ολοκλήρωση της σάρωσης, ανακτούμε λεπτομέρειες από το Biblionet ώστε να προσυμπληρωθεί η φόρμα
              καταχώρισης.
            </p>

            <div
              className={classNames(styles['status-note'], {
                [styles['is-loading']]: detailStatus === 'loading',
                [styles['is-success']]: detailStatus === 'success',
                [styles['is-error']]: detailStatus === 'error',
              })}
            >
              {detailStatus === 'idle' && <span>Ξεκίνα με μια σάρωση για να αντλήσουμε στοιχεία.</span>}
              {detailStatus === 'loading' && <span>Ανακτώνται στοιχεία από το Biblionet...</span>}
              {detailStatus === 'success' && <span>Τα στοιχεία από το Biblionet είναι έτοιμα για καταχώριση.</span>}
              {detailStatus === 'error' && <span>{detailMessage ?? 'Δεν βρέθηκαν στοιχεία στο Biblionet.'}</span>}
            </div>

            {bookPayload && (
              <dl className={styles['book-preview']}>
                <div>
                  <dt>Τίτλος</dt>
                  <dd>{bookPayload.Title || '—'}</dd>
                </div>
                <div>
                  <dt>Συγγραφέας</dt>
                  <dd>{bookPayload.WriterName || '—'}</dd>
                </div>
                <div>
                  <dt>Εκδότης</dt>
                  <dd>{bookPayload.Publisher || '—'}</dd>
                </div>
                <div>
                  <dt>ISBN</dt>
                  <dd>{bookPayload.ISBN || isbn || '—'}</dd>
                </div>
              </dl>
            )}

            {navigateState === 'error' && navigateMessage && (
              <div className={classNames(styles['status-note'], styles['is-error'])}>{navigateMessage}</div>
            )}

            <div className={styles['actions-footer']}>
              <button
                type="button"
                className={classNames(styles.button, styles['primary-action'])}
                onClick={handleContinueToForm}
                disabled={!isbn || navigateState === 'loading'}
              >
                {navigateState === 'loading' ? 'Μετάβαση...' : 'Συνέχεια στη φόρμα καταχώρισης'}
              </button>
            </div>
          </section>

          {lastResult && (
            <details className={styles['debug-details']}>
              <summary>Τεχνικές πληροφορίες</summary>
              <dl>
                <div>
                  <dt>Format</dt>
                  <dd>{lastResult.getBarcodeFormat().toString()}</dd>
                </div>
                <div>
                  <dt>Raw text</dt>
                  <dd>{lastResult.getText()}</dd>
                </div>
              </dl>
            </details>
          )}
        </main>
      </div>
    </>
  );
}

export default dynamic(() => Promise.resolve(ScannerContent), { ssr: false });
