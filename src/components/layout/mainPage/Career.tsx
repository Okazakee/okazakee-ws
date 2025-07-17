import React from 'react';
import { getTranslations } from 'next-intl/server';
import { formatLabels } from '@/utils/formatLabels';
import { getCareerEntries } from '@/utils/getData';
import { ErrorDiv } from '@components/common/ErrorDiv';
import Image from 'next/image';
import { ExternalLink, MapPin, Calendar } from 'lucide-react';
import moment, { type MomentInput } from 'moment';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface CareerEntry {
  id: string;
  title: string;
  company: string;
  remote: string;
  startDate: string;
  endDate: string | null;
  skills: string;
  logo: string;
  blurhashurl: string;
  [key: `location_${string}`]: string;
  [key: `description_${string}`]: string;
  [key: `company_description_${string}`]: string;
}

export default async function Career() {
  const careerEntries = await getCareerEntries() as unknown as CareerEntry[];
  const t = await getTranslations('career-section');

  const formatDate = (dateString: MomentInput) => {
    if (!dateString) return t('present');
    return moment(dateString).format('MMM YYYY');
  };

  const calculateDuration = (startDate: MomentInput, endDate: MomentInput) => {
    const start = moment(startDate);
    const end = endDate ? moment(endDate) : moment();
    const months = end.diff(start, 'months');

    if (months < 12) {
      return months === 1
        ? `1 ${t('month')}`
        : `${months} ${t('months')}`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;

      if (remainingMonths === 0) {
        return years === 1
          ? `1 ${t('year')}`
          : `${years} ${t('years')}`;
      } else {
        const yearText = years === 1 ? t('year') : t('years');
        const monthText = remainingMonths === 1 ? t('month') : t('months');
        return `${years} ${yearText} ${remainingMonths} ${monthText}`;
      }
    }
  };

  if (!careerEntries) {
    return <ErrorDiv>Error loading Career data</ErrorDiv>;
  }

  return (
    <section
      id="career"
      className="flex items-center justify-center text-center mx-5 xl:mx-16 min-h-screen my-20 md:my-0 mb-20 md:mb-32"
    >
      <div className="w-full max-w-6xl">
        <h1 className="xl:text-6xl text-3xl xs:text-4xl mb-10 xl:mb-5">
          {t('title')}
        </h1>
        <h2
          className="xl:mb-20 text-lg xs:text-[1.4rem] md:text-2xl mb-10"
          dangerouslySetInnerHTML={{ __html: formatLabels(t('subtitle')) }}
        />

        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-main hidden md:block" />

          {careerEntries.map((entry, index) => {
            const isEven = index % 2 === 0;
            const isLast = index === careerEntries.length - 1;
            const locale = t('locale');

            return (
              <div key={entry.id} className="mb-16 md:mb-8 relative">
                <div className={`hidden md:flex items-center ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                  {!isLast && (
                    <div
                      className={`absolute top-1/2 left-1/2 w-10 h-20 ${isEven ? '-translate-x-full' : 'translate-x-0'} -translate-y-1/2`}
                      style={{
                        borderTop: '2px solid #8B53FB',
                        borderRight: isEven ? 'none' : '2px solid #8B53FB',
                        borderLeft: isEven ? '2px solid #8B53FB' : 'none',
                        borderRadius: isEven ? '8px 0 0 0' : '0 8px 0 0'
                      }}
                    />
                  )}

                  <div className={`w-1/2 ${isEven ? 'pr-16 text-right' : 'pl-16 text-left'}`}>
                    <h3 className="text-2xl font-bold text-main">{entry.title}</h3>
                    <h4 className="text-xl mb-2">{entry.company}</h4>

                    <div className={`flex items-center mb-2 text-sm text-gray-500 dark:text-gray-400 gap-2 ${isEven ? 'justify-end' : 'justify-start'}`}>
                      <MapPin size={16} className="inline" />
                      <span>{entry[`location_${locale}`]}</span>
                      <span className="px-1 text-main">•</span>
                      <span className="bg-secondary text-white px-2 py-0.5 rounded-md text-xs">
                        {t(`remote.${entry.remote}`)}
                      </span>
                    </div>

                    <div className={`flex items-center mb-4 text-sm text-gray-500 dark:text-gray-400 gap-2 ${isEven ? 'justify-end' : 'justify-start'}`}>
                      <Calendar size={16} className="inline" />
                      <span>
                        {formatDate(entry.startDate)} — {formatDate(entry.endDate)}
                      </span>
                      <span className="px-1 text-main">•</span>
                      <span>{calculateDuration(entry.startDate, entry.endDate)}</span>
                    </div>

                    <div className={`mb-4 prose dark:prose-invert max-w-none ${isEven ? 'text-right' : 'text-left'}`}>
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                        {entry[`description_${locale}`]}
                      </ReactMarkdown>
                    </div>

                    <div className={`flex flex-wrap gap-2 ${isEven ? 'justify-end' : 'justify-start'}`}>
                      {(JSON.parse(entry.skills) as string[]).map((skill) => (
                        <span key={skill} className="bg-secondary text-white px-2 py-1 rounded-md text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="absolute left-1/2 top-8 transform -translate-x-1/2 w-6 h-6 bg-main rounded-full z-10 border-2 border-white dark:border-gray-900" />

                  <div className={`w-1/2 ${isEven ? 'pl-16' : 'pr-16'}`}>
                    <div className={`bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-lg ${isEven ? 'mr-auto' : 'ml-auto'} max-w-xs`}>
                      <Image
                        src={entry.logo}
                        alt={entry.company}
                        width={100}
                        height={100}
                        placeholder="blur"
                        blurDataURL={entry.blurhashurl}
                        className="mx-auto mb-4 rounded-md"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                        {entry[`company_description_${locale}`]}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:hidden flex flex-col items-center">
                  <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-4 w-full">
                    <div className="flex items-center mb-4">
                      <Image
                        src={entry.logo}
                        alt={entry.company}
                        width={60}
                        height={60}
                        placeholder="blur"
                        blurDataURL={entry.blurhashurl}
                        className="rounded-md mr-4"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-main">{entry.title}</h3>
                        <h4 className="text-lg">{entry.company}</h4>
                      </div>
                    </div>

                    <div className="flex items-center mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin size={16} className="inline mr-1" />
                      <span>{entry[`location_${locale}`]}</span>
                      <span className="px-1 text-main">•</span>
                      <span className="bg-secondary text-white px-2 py-0.5 rounded-md text-xs">
                        {t(`remote.${entry.remote}`)}
                      </span>
                    </div>

                    <div className="flex items-center mb-4 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar size={16} className="inline mr-1" />
                      <span>
                        {formatDate(entry.startDate)} — {formatDate(entry.endDate)}
                      </span>
                      <span className="px-1 text-main">•</span>
                      <span>{calculateDuration(entry.startDate, entry.endDate)}</span>
                    </div>

                    <p className="mb-4 text-sm">
                      {entry[`description_${locale}`]}
                    </p>

                    <div className={`flex flex-wrap gap-2 ${isEven ? '' : 'justify-start'}`}>
                      {(JSON.parse(entry.skills) as string[]).map((skill) => (
                        <span key={skill} className="bg-secondary text-white px-2 py-1 rounded-md text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}