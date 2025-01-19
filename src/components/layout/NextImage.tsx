import Image from 'next/image';

interface NextImageProps {
  src: string;
  alt: string;
  blurhash: string;
}

const NextImage = ({ src, alt, blurhash }: NextImageProps) => {

  return (
    <Image
      src={src}
      alt={alt}
      width={1280}
      height={720}
      title='Click to view'
      placeholder='blur'
      blurDataURL={blurhash}
      style={{
        objectFit: 'cover',
        objectPosition: 'center',
      }}
      className={`rounded-xl cursor-pointer border-[1px] border-main mx-auto max-h-[50rem] w-auto`}
    />
  );
};

export default NextImage;