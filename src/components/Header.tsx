import React from 'react'
import { fetchBio } from '../app/api/db/connect';
import Image from 'next/image';

const Header = async () => {

  return (
    <div>
      <Image
        src='https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/logo.png'
        width={200}
        height={500}
        className=''
        alt="Picture of the author"
      />
    </div>
  )
}

export default Header