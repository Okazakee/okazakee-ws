// app/cms/page.tsx
'use client'; // Mark as a Client Component

import { useState } from 'react';

export default function CMSDashboard() {
  const [activeSection, setActiveSection] = useState('hero');

  return (
    <div className='flex flex-col justify-center max-w-screen-2xl text-center my-10 mx-auto'>
      <div className='mx-5 flex justify-between'>
        <nav className='flex flex-col gap-8 mr-auto text-3xl'>
          <button onClick={() => setActiveSection('hero')}>Hero Section</button>
          <button onClick={() => setActiveSection('portfolio')}>Portfolio</button>
          <button onClick={() => setActiveSection('blog')}>Blog Posts</button>
          <button onClick={() => setActiveSection('i18n')}>i18n Strings</button>
        </nav>
        <div className='content right'>
          {activeSection === 'hero' && <div>section sjaodha</div>}
          {activeSection === 'portfolio' && <div>section sjaodha</div>}
          {activeSection === 'blog' && <div>section sjaodha</div>}
          {activeSection === 'i18n' && <div>section sjaodha</div>}
        </div>
      </div>
    </div>
  );
}