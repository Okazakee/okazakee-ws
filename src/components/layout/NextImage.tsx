import Image from 'next/image';

interface NextImageProps {
  src: string;
  alt: string;
  blurhash: string
}

const NextImage = ({ src, alt, blurhash }: NextImageProps) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={900}
      height={500}
      title='Click to view'
      placeholder='blur'
      blurDataURL={blurhash}
      style={{
        objectFit: 'cover',
        objectPosition: 'center',
      }}
      className="rounded-xl border-[1px] border-main mx-auto sm:max-h-[40rem]"
    />
  );
};

export default NextImage;