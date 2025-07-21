import ResumeButton from '@/components/common/ResumeButton';
import type { ResumeData } from '@/types/fetchedData.types';
import { formatLabels } from '@/utils/formatLabels';
import { getContacts, getResumeLink } from '@/utils/getData';
import { ErrorDiv } from '@components/common/ErrorDiv';
import type { LucideProps } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import React from 'react';

export default async function Contacts({ locale }: { locale: string }) {
  let contacts = await getContacts();
  const resumeData = (await getResumeLink()) as ResumeData;

  contacts = contacts
    ? [...contacts].sort((a, b) => a.position - b.position)
    : null;

  const t = await getTranslations('contacts-section');

  // Get the correct resume link based on locale
  const resumeLink = resumeData
    ? resumeData[`resume_${locale}` as keyof ResumeData]
    : null;

  const getIconComponent = (iconName: string) => {
    // Dynamic import of the icon, explicitly cast to React.ComponentType
    return React.lazy(() =>
      import('lucide-react').then((module) => {
        // Access the icon by name dynamically
        const Icon = module[
          iconName.charAt(0).toUpperCase() + iconName.slice(1)
        ] as React.ComponentType<LucideProps>;

        if (!Icon) {
          throw new Error(`Icon "${iconName}" not found`);
        }

        return { default: Icon };
      })
    );
  };

  return contacts ? (
    <section
      id="contacts"
      className="flex items-center justify-center text-center mx-5 xl:mx-16 md:min-h-lvh my-20 md:my-0 mdh:mt-40"
    >
      <div>
        <h1 className="xl:text-6xl text-xl xs:text-2xl mb-5">{t('title')}</h1>
        <h2
          className="md:mb-20 mb-10 text-base xs:text-lg md:text-2xl"
          dangerouslySetInnerHTML={{ __html: formatLabels(t('subtitle')) }}
        />
        <div className="flex md:flex-row flex-col md:gap-8 mx-12 md:mx-0 justify-between drop-shadow-xl md:drop-shadow-2xl dark:drop-shadow-none">
          {contacts.map(({ id, label, icon, link, bg_color }) => {
            const IconComponent = getIconComponent(icon);

            return (
              <Link
                data-umami-event={`${label} button`}
                key={id}
                style={
                  {
                    '--dyn-color': `${bg_color}99`,
                    '--hover-color': bg_color,
                  } as React.CSSProperties
                }
                href={link}
                target="_blank"
                className={`text-lighttext mb-5 md:mb-0 last:mb-0 transition-all hover:scale-105 border-2
                      border-main rounded-2xl bg-[var(--hover-color)] md:bg-[var(--dyn-color)] md:hover:bg-[var(--hover-color)]`}
              >
                <div className="transition-all ease-in-out md:my-0 my-2 md:w-40 md:h-40">
                  {IconComponent ? (
                    <div className="h-full flex md:flex-col justify-center items-center">
                      <IconComponent
                        className="md:mr-0 mr-5 dark:text-lighttext md:w-[100px] w-[4rem] md:h-auto h-[3.5rem] xs:h-[4rem]"
                        size={80}
                        strokeWidth={1}
                      />
                      <h3 className="text-xl xs:text-2xl text-left w-28 md:text-center md:w-auto">
                        {label}
                      </h3>
                    </div>
                  ) : (
                    <div>No Icon Available</div>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Resume Link Button */}
          {resumeLink && <ResumeButton resumeLink={resumeLink} />}
        </div>
      </div>
    </section>
  ) : (
    <ErrorDiv>Error loading Contacts data</ErrorDiv>
  );
}
