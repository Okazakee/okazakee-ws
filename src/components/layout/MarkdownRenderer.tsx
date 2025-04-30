import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import NextImage from '@/components/layout/NextImage';
import type { Element } from 'hast';
import PreCustom, { type PreChild } from './PreCustom';

const MarkdownRenderer = ({ markdown }: { markdown: string }) => {
  /*
    Alt prop in img is taken from markdown, an example image is like this:
    "![alt-data:image/png;base64,BLURHASHVALUE](imageurl)"

    usually the [x] represents the alt prop, for efficiency porpuses it now will be handled as [alt-blurhashdataurl]
  */

  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-main font-bold">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-main font-bold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-main font-bold">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-main font-semibold">{children}</h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-main font-semibold">{children}</h5>
        ),
        h6: ({ children }) => (
          <h6 className="text-main font-semibold">{children}</h6>
        ),
        p: ({ children, ...props }) => {
          const node = props.node as Element;

          // Check if paragraph contains ONLY images (one or more)
          const isOnlyImages = node.children.every(
            (child) =>
              child.type === 'element' && (child as Element).tagName === 'img'
          );

          if (isOnlyImages) {
            return <>{children}</>;
          }

          return <p>{children}</p>;
        },
        pre: ({ children }) => {
          return <PreCustom>{children as PreChild}</PreCustom>;
        },
        img: ({ src, alt }) => {
          if (!alt) throw new Error('alt should never be undefined');

          const data = alt.split('-');
          const altText = data[0];
          const blurhash = data[1];

          return (
            <NextImage src={src || ''} alt={altText} blurhash={blurhash} />
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
