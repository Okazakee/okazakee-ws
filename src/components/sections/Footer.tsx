import Link from 'next/link'
import React from 'react'
import { ArrowUpToLine } from 'lucide-react';

const Footer = async () => {

  return (
    <div id='contacts' className='absolute w-full'>
      <div className='flex justify-between items-center mx-5 mb-5'>
        <h3 className=''>Made with ❤️ by <label className='text-main'>Okazakee</label></h3>
        <h3 className='absolute left-1/2 transform -translate-x-1/2 space-x-5'>VAT IT - 02863310815</h3>
        <Link className='flex' href={'#about'}>Go back up <ArrowUpToLine className='ml-2' /></Link>
      </div>
    </div>
  )
}

export default Footer