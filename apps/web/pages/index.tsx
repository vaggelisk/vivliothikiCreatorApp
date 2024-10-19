import { Fragment } from 'react';
import {CreatorPageContent, RenderContent} from '~/components';
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
  const { data: content } = useContent<ContentDynamicPage>(contentUrl);

  return (
    <DefaultLayout>
      <CreatorPageContent />
    </DefaultLayout>
  );
}
