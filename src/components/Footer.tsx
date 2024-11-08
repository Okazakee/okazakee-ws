import React from 'react'
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';

const Footer = async () => {

  return (
    <div className='flex justify-between items-center mx-5 mb-5'>
      <h3 className=''>Made with ❤️ by <label className='text-main'>Okazakee</label></h3>
      <h3 className='absolute left-1/2 transform -translate-x-1/2 space-x-5'>VAT IT - 02863310815</h3>
      <h3 className=''>Social Links here</h3>
    </div>
  )
}

export default Footer