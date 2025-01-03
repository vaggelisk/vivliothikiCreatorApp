import Link from 'next/link';
import classNames from 'classnames';
import { useTranslation } from 'next-i18next';
import { Divider } from '~/components';
import { bottomLinks, categories, companyName, contactOptions, socialMedia } from '~/mocks';

export function Footer({ className = '' }: { className?: string }): JSX.Element {
  const { t } = useTranslation('footer');

  return (
    <footer className={classNames('pt-10 bg-neutral-100', className)} data-testid="footer">
      <div
        className="grid gap-5 justify-center grid-cols-[1fr_1fr] md:grid-cols-[repeat(4,1fr)] px-4 md:px-6 pb-10 mx-auto max-w-screen-3xl"
        data-testid="section-top"
      >

      </div>
      <Divider />
      <div className="py-10 lg:flex mx-auto max-w-screen-3xl" data-testid="section-middle">
        {contactOptions.map(({ icon, link, details, key }) => (
          <div key={key} className="mx-auto my-4 text-center flex flex-col items-center">
            {icon}
            {details?.map((option) => (
              <p className="text-sm leading-5" key={option}>
                {t(`contactOptions.${key}.details.${option}`)}
              </p>
            ))}
          </div>
        ))}
      </div>
      <div className="bg-neutral-900" data-testid="section-bottom">
        <div className="mx-auto max-w-screen-3xl text-sm leading-5 text-white justify-end px-4 py-10 lg:flex lg:py-6">
          <div className="flex justify-center gap-6 lg:self-start">
            {socialMedia.map(({ icon, label, link }) => (
              <Link
                key={label}
                href={link}
                title={t('socialLabel', { label })}
                className="hover:bg-neutral-500 hover:shadow-[0_0_0_8px] hover:shadow-neutral-500 rounded-sm"
                data-testid={label}
              >
                {icon}
              </Link>
            ))}
          </div>
          <div className="flex justify-center gap-6 my-6 lg:ml-auto lg:my-0">
            {bottomLinks.map(({ link, key }) => (
              <Link
                key={key}
                href={link}
                className="text-white no-underline typography-text-sm active:text-white active:underline hover:text-white hover:underline"
              >
                {t(`bottomLinks.${key}`)}
              </Link>
            ))}
          </div>
          <p className="flex items-center justify-center leading-5 text-center typography-text-sm text-white/50 font-body md:ml-6">
            αυτοοργανωμένη βιβλιοθήκη
          </p>
            <p className="flex items-center justify-center leading-5 text-center typography-text-sm text-white/50 font-body md:ml-6">
            νότιας εύβοιας
          </p>
        </div>
      </div>
    </footer>
  );
}
