/* eslint-disable @next/next/no-html-link-for-pages */
import Head from 'next/head';
import Link from 'next/link';
import { SfButton } from '@storefront-ui/react';
import classNames from 'classnames';
import { NarrowContainer } from '~/components';
import { DefaultLayout } from '~/layouts';
import styles from '~/styles/scanner.module.scss';

const steps = [
  {
    title: 'Βήμα 1',
    description: 'Φωτογράφισε ή σκάναρε το barcode του βιβλίου και ανέβασέ το στην εφαρμογή.',
  },
  {
    title: 'Βήμα 2',
    description: 'Επίλεξε με το ποντίκι την περιοχή που περιέχει το barcode και εκτέλεσε σάρωση.',
  },
  {
    title: 'Βήμα 3',
    description: 'Αφού εντοπιστεί το ISBN, η εφαρμογή αναζητά αυτόματα στοιχεία σε Biblionet, Πολιτεία και Amazon.',
  },
  {
    title: 'Βήμα 4',
    description: 'Μετέφερε τα ευρήματα στην φόρμα καταχώρισης για να δημιουργηθεί η εγγραφή στη βιβλιοθήκη.',
  },
];

export default function ScannerOverviewPage() {
  return (
    <DefaultLayout>
      <Head>
        <title>Οδηγός Scanner | αυτοοργανωμένη βιβλιοθήκη</title>
      </Head>
      <NarrowContainer>
        <section className={classNames(styles.panel, styles.instructions)}>
          <header className={styles['instructions-header']}>
            <h1>Scanner</h1>
            <p>
              Ακολούθησε τα παρακάτω βήματα για να εντάξεις ένα βιβλίο στην βιβλιοθήκη χρησιμοποιώντας το barcode του.
            </p>
          </header>
          <ol className={styles.steps}>
            {steps.map((step) => (
              <li key={step.title} className={styles['step-card']}>
                <h2 className={styles['step-title']}>{step.title}</h2>
                <p className={styles['step-description']}>{step.description}</p>
              </li>
            ))}
          </ol>

          <div className={styles['instructions-actions']}>
            <Link href="/scanner/scan" legacyBehavior>
              <a>
                <SfButton size="lg">Ξεκίνα σάρωση</SfButton>
              </a>
            </Link>
          </div>
        </section>
      </NarrowContainer>
    </DefaultLayout>
  );
}
