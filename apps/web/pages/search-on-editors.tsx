import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { CategoryFilters, CategoryPageContent, CategorySorting } from '~/components';
import { createGetServerSideProps } from '~/helpers';
import { prefetchProducts, useProducts } from '~/hooks';
import { DefaultLayout } from '~/layouts';
import {useEffect, useState} from "react";
import axios from "axios";
import {Book} from "~/components/CreatorBookForm/types";
import { useQueryClient } from '@tanstack/react-query';


export const getServerSideProps = createGetServerSideProps({ i18nNamespaces: ['category'] }, async (context) => {

    context.res.setHeader('Cache-Control', 'no-cache');
    // let search = query ? query.search : '';
    let search = context.query.search;
    let isbn = context.query.isbn;
    const products = await prefetchProducts(context, search ? search.toString() : '');


    return { props: {} };
});

export default function SearchOnEditorsPage() {
    const { t } = useTranslation('category');
    const { query } = useRouter();
        const queryClient = useQueryClient();
    const { data: productsCatalog } = useProducts();
    const title = query.search
    const isbn = query.isbn

        const selectedMetaBook = (queryClient.getQueryData(['selected-meta-book']) as {
                name?: string;
                isbn?: string;
                author?: string;
                publisher?: string;
            description?: string;
            subtitle?: string;
            } | undefined) ?? undefined;

        const bookTitleValue = selectedMetaBook?.name || (query.search ? query.search.toString() : '');
        const isbnValue = selectedMetaBook?.isbn || (query.isbn ? query.isbn.toString() : '');
        const bookAuthorValue = selectedMetaBook?.author || (query.author ? query.author.toString() : '');
        const bookPublisherValue = selectedMetaBook?.publisher || (query.publisher ? query.publisher.toString() : '');
        const bookSummaryValue = selectedMetaBook?.description || '';
        const bookSubtitleValue = selectedMetaBook?.subtitle || '';

    if (!productsCatalog) {
        return null;
    }

    const { products, pagination, facets } = productsCatalog;
    const categoryTitle = t('resultsFor', { phrase: query?.search });

    return (
        <DefaultLayout >
            <CategoryPageContent
                title={categoryTitle}
                bookTitle={bookTitleValue}
                isbn={isbnValue}
                bookAuthor={bookAuthorValue}
                bookPublisher={bookPublisherValue}
                bookSummary={bookSummaryValue}
                bookSubtitle={bookSubtitleValue}
                products={products ? products : Array()}
                book={query.data ? JSON.parse(query?.data.toString()) : {}}
                totalProducts={ Number(pagination.totalResults)}
                sidebar={
                    <>
                        <CategorySorting />
                        <CategoryFilters facets={facets} />
                    </>
                }
            />
        </DefaultLayout>
    );
}
