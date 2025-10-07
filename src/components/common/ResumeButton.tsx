'use client';

import { FileUser } from 'lucide-react';
import Link from 'next/link';

interface ResumeButtonProps {
  resumeLink: string;
}

export default function ResumeButton({ resumeLink }: ResumeButtonProps) {
  return (
    <Link
      data-umami-event="Resume button"
      href={resumeLink}
      target="_blank"
      style={
        {
          '--dyn-color': '#4B556399', // A gray color with transparency
          '--hover-color': '#4B5563',
        } as React.CSSProperties
      }
      className="text-lighttext mb-5 md:mb-0 last:mb-0 transition-all hover:scale-105 border-2
            border-main rounded-2xl bg-(--hover-color) md:bg-(--dyn-color) md:hover:bg-(--hover-color)"
    >
      <div className="transition-all ease-in-out md:my-0 my-2 md:w-40 md:h-40">
        <div className="h-full flex md:flex-col justify-center items-center">
          <FileUser
            className="md:mr-0 mr-5 dark:text-lighttext md:w-[100px] w-16 md:h-auto h-14 xs:h-16"
            size={80}
            strokeWidth={1}
          />
          <h3 className="text-xl xs:text-2xl text-left w-28 md:text-center md:w-auto">
            {resumeLink.includes('it') ? 'Curriculum' : 'Resume'}
          </h3>
        </div>
      </div>
    </Link>
  );
}
