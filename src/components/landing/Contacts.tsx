import React, { Suspense } from 'react'
import { LucideProps } from 'lucide-react';
import Link from 'next/link';

interface Props {
  contactsArray: {
    sectionName: string;
    subtitle: string;
    contacts: {
      label: string;
      icon: string;
      link: string;
    }[];
  };
}

export default function Contacts({contactsArray: {sectionName, subtitle, contacts}}: Props) {

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
    <section className="flex items-center justify-center text-center mx-5 xl:mx-16 min-h-lvh">
        <div>
          <h1 className="text-6xl mb-5 ">{sectionName}</h1>
          <h3 className="mb-20 text-2xl" dangerouslySetInnerHTML={{ __html: subtitle }}>
          </h3>
          <div className="flex justify-between">
            {contacts.map(({ label, icon, link }) => {
              const IconComponent = getIconComponent(icon);

              return (
                <Link href={link} target="_blank">
                  <div key={label} className="transition-all ease-in-out w-40 h-40 border-2 border-transparent hover:border-main rounded-2xl">
                    {IconComponent ? (
                    <Suspense fallback={<div>Loading...</div>}>
                      <div className="h-full flex flex-col justify-center items-center">
                        <IconComponent className="dark:invert w-[100px]" size={128} strokeWidth={1} color="#080808" />
                        <h3 className="text-2xl">{label}</h3>
                      </div>
                    </Suspense>
                  ) : (
                    <div>No Icon Available</div>
                  )}
                  </div>
                </Link>
            ) })}
          </div>
        </div>
      </section>
  )
}