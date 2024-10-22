type BookFields =
  | 'customer_id'
  | 'title'
  | 'subtitle'
  | 'category_name'
  | 'category_id'
  | 'writer'
  | 'translator'
  | 'editor_epimelitis'
  | 'publisher'
  | 'pages'
  | 'dimensions'
  | 'first_language'
  | 'title_in_first_language'
  | 'commercial_availability'
  | 'type_of_bookbinding'
  | 'weight'
  | 'first_publishing';

export type BookFormFields = Record<BookFields, string>;

export type BookFormProps = {
  type?: 'book';
  titleOfBook?: string;
  isbnOfBook?: string;
  bookDetails?: object;
  savedBook?: object;
  onSave?: () => string;
  onClear?: () => void;
  savedAddress?: BookFormFields | undefined;
};

export type Book = {
  customer_id: string;
  TitlesID: string;
  CoverImage: string ;
  Title: string ;
  Subtitle: string;
  ISBN: string;
  PublisherID: string;
  Publisher: string;
  WriterID: string;
  Writer: string;
  WriterName: string;
  FirstPublishDate: string;
  CurrentPublishDate: string;
  PlaceID: string;
  Place: string;
  EditionNo: string;
  Cover: string;
  Dimensions: string;
  PageNo: string;
  Availability: string;
  Price: string;
  VAT: string;
  Weight: string;
  AgeFrom: string;
  AgeTo: string;
  Summary: string ;
  LanguageID: string;
  Language: string;
  LanguageOriginalID: string;
  LanguageOriginal: string;
  LanguageTranslatedFromID: string;
  LanguageTranslatedFrom: string;
  Series: string;
  MultiVolumeTitle: string;
  VolumeNo: string;
  VolumeCount: string;
  Specifications: string;
  Comments: string;
  CategoryID: string;
  Category: string;
  SubjectsID:  string;
  SubjectTitle:  string;
  SubjectDDC:   string;
  SubjectOrder:  string;
}

