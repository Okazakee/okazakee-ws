import React from 'react'

export default function page() {
  return (
    <section className="mx-auto max-w-7xl mt-20 flex justify-center">
      <div className="xl:mx-16 text-center">
        <h1 className="text-6xl mb-5">{'Portfolio'}</h1>
        <h3 className="mb-20 text-2xl" dangerouslySetInnerHTML={{ __html: 'subtitle' }}></h3>
      </div>
    </section>
  )
}