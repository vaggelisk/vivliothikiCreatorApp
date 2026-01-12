/* eslint-disable @next/next/no-html-link-for-pages */
import Link from 'next/link';
import { SfButton } from '@storefront-ui/react';
import { CreatorPageContent } from '~/components';
import { createGetServerSideProps } from '~/helpers';
import { useContent, prefetchContent, ContentDynamicPage } from '~/hooks';
import { DefaultLayout } from '~/layouts';

const contentUrl = 'home-page';

export const getServerSideProps = createGetServerSideProps({ i18nNamespaces: [] }, async (context) => {
  context.res.setHeader('Cache-Control', 'no-cache');
  const content = await prefetchContent(context, contentUrl);

  if (!content) {
    return {
      notFound: true,
    };
  }

  return { props: {} };
});

export default function Home() {
  useContent<ContentDynamicPage>(contentUrl);

  return (
    <DefaultLayout>
      {/* <section className="mx-auto mb-8 w-full max-w-4xl rounded-3xl bg-neutral-100 px-6 py-8 text-center shadow-lg">
        <h2 className="mb-2 text-2xl font-semibold">Νέα λειτουργία: Scanner</h2>
        <p className="mb-6 text-neutral-700">
          Σκάναρε το barcode του βιβλίου και δημιούργησε αυτόματα την εγγραφή στη βιβλιοθήκη.
        </p>
        <Link href="/scanner" legacyBehavior>
          <a>
            <SfButton size="lg">Μετάβαση στο Scanner</SfButton>
          </a>
        </Link>
      </section> */}
      <CreatorPageContent />
    </DefaultLayout>
  );
}
