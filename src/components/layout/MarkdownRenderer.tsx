import ReactMarkdown from 'react-markdown';
import NextImage from '@/components/layout/NextImage';

const MarkdownRenderer = ({ markdown }: { markdown: string }) => {

  /*
    Alt prop in img is taken from markdown, an example image is like this:
    "![alt-data:image/png;base64,BLURHASHVALUE](imageurl)"

    usually the [x] represents the alt prop, for efficiency porpuses it now will be handled as [alt-blurhashdataurl]
  */

  return (
    <ReactMarkdown
      components={{
        img: ({ src, alt }) => {

          const data = alt!.split('-');

          const altText = data[0];

          const blurhash = data[1];

          return (
            <NextImage
              src={src!}
              alt={altText}
              blurhash={blurhash}
            />
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;