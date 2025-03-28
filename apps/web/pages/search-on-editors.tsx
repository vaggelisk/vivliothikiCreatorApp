import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { CategoryFilters, CategoryPageContent, CategorySorting } from '~/components';
import { createGetServerSideProps } from '~/helpers';
import { prefetchProducts, useProducts } from '~/hooks';
import { DefaultLayout } from '~/layouts';
import {useEffect, useState} from "react";
import axios from "axios";
import {Book} from "~/components/CreatorBookForm/types";


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
    const { data: productsCatalog } = useProducts();
    const title = query.search
    const isbn = query.isbn

    if (!productsCatalog) {
        return null;
    }

    const { products, pagination, facets } = productsCatalog;
    const categoryTitle = t('resultsFor', { phrase: query?.search });

    return (
        <DefaultLayout >
            <CategoryPageContent
                title={categoryTitle}
                bookTitle={query.search ?  query.search.toString() : ''}
                isbn={query.isbn ? query.isbn.toString() : ''}
                bookAuthor={query.author ? query.author.toString() : '' }
                bookPublisher={query.publisher ? query.publisher.toString() : '' }
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
