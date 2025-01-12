import React from 'react'
import { LucideProps } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { formatLabels } from '@/utils/formatLabels';
import { getContacts } from '@/utils/getData';
import { ErrorDiv } from '../common/ErrorDiv';

export default async function Contacts() {

  const contacts = await getContacts();

  const t = await getTranslations('contacts-section');

  const getIconComponent = (iconName: string) => {
    // Dynamic import of the icon, explicitly cast to React.ComponentType
    return React.lazy(() =>
      import('lucide-react').then((module) => {
        // Access the icon by name dynamically
        const Icon = module[iconName.charAt(0).toUpperCase() + iconName.slice(1)] as React.ComponentType<LucideProps>;

        if (!Icon) {
          throw new Error(`Icon "${iconName}" not found`);
        }

        return { default: Icon };
      })
    );
  };

  return (
    contacts ?
      <section className="flex items-center justify-center text-center mx-5 xl:mx-16 md:min-h-lvh my-20 md:my-0 mdh:mt-40">
          <div>
            <h1 className="xl:text-6xl text-4xl xs:text-5xl mb-5">{t('title')}</h1>
            <h3 className="md:mb-20 mb-10 text-lg xs:text-[1.4rem] md:text-2xl" dangerouslySetInnerHTML={{ __html: formatLabels(t('subtitle')) }}>
            </h3>
            <div className="flex md:flex-row flex-col md:gap-8 mx-12 md:mx-0 justify-between">
              {contacts.map(({ id, label, icon, link, bg_color }) => {
                const IconComponent = getIconComponent(icon);

                return (
                  <Link
                    key={id}
                    style={{
                      "--dyn-color": `${bg_color}99`,
                      "--hover-color": bg_color,
                    } as React.CSSProperties}
                    href={link}
                    target="_blank"
                    className={`text-lighttext mb-5 md:mb-0 last:mb-0 transition-all hover:scale-105 border-2
                      border-main rounded-2xl bg-[var(--hover-color)] md:bg-[var(--dyn-color)] md:hover:bg-[var(--hover-color)]
                      ${label === 'Resume' && 'md:hidden'}`}
                  >
                    <div className="transition-all ease-in-out md:my-0 my-2 md:w-40 md:h-40">
                      {IconComponent ? (
                        <div className="h-full flex md:flex-col justify-center items-center">
                          <IconComponent
                            className="md:mr-0 mr-5 dark:text-lighttext md:w-[100px] w-[5rem] md:h-auto h-[3.5rem] xs:h-[5rem] bg-w"
                            size={80}
                            strokeWidth={1}
                          />
                          <h3 className="text-xl xs:text-2xl text-left w-28 md:text-center md:w-auto">{label}</h3>
                        </div>
                      ) : (
                        <div>No Icon Available</div>
                      )}
                    </div>
                  </Link>
              ) })}
            </div>
          </div>
        </section>
    :
      <ErrorDiv>Error loading Contacts data</ErrorDiv>
  )
}