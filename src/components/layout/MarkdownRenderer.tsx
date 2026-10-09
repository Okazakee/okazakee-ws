'use client';
import Markdown from 'markdown-to-jsx';
import type { ReactNode } from 'react';
import NextImage from '@/components/layout/NextImage';
import PreCustom, { type PreChild } from './PreCustom';

/**
 * Standalone post image: centered, capped at the prose width, rendered with
 * next/image. The modal keeps the raw asset; only the inline figure is
 * optimized.
 */
function PostFigure({ src, alt }: { src: unknown; alt: unknown }) {
  if (typeof alt !== 'string') throw new Error('alt should never be undefined');

  const data = alt.split('-');
  const altText = data[0] ?? '';
  const blurhash = data[1] ?? '';
  const imageSrc = typeof src === 'string' ? src : '';

  return (
    <figure className="post-figure mx-auto my-8 w-full">
      <NextImage src={imageSrc} alt={altText} blurhash={blurhash} />
    </figure>
  );
}

/**
 * True for image-only paragraph children. markdown-to-jsx applies the `img`
 * override before `p` sees its children, so images arrive as elements (the
 * PostFigure component above, or raw tags) — never as bare 'img' strings.
 * Compared by reference, so minification cannot break the check.
 */
function isImageOnlyChild(child: unknown): boolean {
  if (typeof child !== 'object' || child === null) return false;
  if (!('type' in child)) return false;
  const childType: unknown = child.type;
  return (
    childType === 'img' || childType === 'figure' || childType === PostFigure
  );
}

// Markdown images: `![alt-blurhash](url)` where the first "-" splits alt from blurhash.
const MarkdownRenderer = ({ markdown }: { markdown: string }) => {
  /*
    Alt prop in img is taken from markdown, an example image is like this:
    "![alt-data:image/png;base64,BLURHASHVALUE](imageurl)"

    usually the [x] represents the alt prop, for efficiency porpuses it now will be handled as [alt-blurhashdataurl]
  */

  return (
    <Markdown
      options={{
        forceBlock: true,
        overrides: {
          h1: {
            component: ({ children }) => (
              <h1 className="text-text-white font-bold">{children}</h1>
            ),
          },
          h2: {
            component: ({ children }) => (
              <h2 className="text-text-white font-bold">{children}</h2>
            ),
          },
          h3: {
            component: ({ children }) => (
              <h3 className="text-text-white font-bold">{children}</h3>
            ),
          },
          h4: {
            component: ({ children }) => (
              <h4 className="text-text-white font-semibold">{children}</h4>
            ),
          },
          h5: {
            component: ({ children }) => (
              <h5 className="text-text-white font-semibold">{children}</h5>
            ),
          },
          h6: {
            component: ({ children }) => (
              <h6 className="text-text-white font-semibold">{children}</h6>
            ),
          },
          p: {
            component: ({ children }: { children?: ReactNode }) => {
              const childrenArray = (
                Array.isArray(children) ? children : [children]
              ).filter(
                (child) =>
                  !(typeof child === 'string' && child.trim().length === 0)
              );

              if (childrenArray.length === 0) return null;

              // Image-only: no paragraph wrapper at all — <figure> can never
              // nest inside <p>.
              if (childrenArray.every(isImageOnlyChild)) {
                return <>{children}</>;
              }

              // Mixed text + figures (single-\n image after prose): split
              // into text runs wrapped in <p> and sibling figures, so the
              // figure never lands inside a paragraph.
              if (childrenArray.some(isImageOnlyChild)) {
                const blocks: ReactNode[] = [];
                let run: ReactNode[] = [];
                const flushRun = () => {
                  if (run.length > 0) {
                    blocks.push(<p key={`t-${blocks.length}`}>{run}</p>);
                    run = [];
                  }
                };
                for (const child of childrenArray) {
                  if (isImageOnlyChild(child)) {
                    flushRun();
                    blocks.push(child);
                  } else {
                    run.push(child);
                  }
                }
                flushRun();
                return <>{blocks}</>;
              }

              return <p>{children}</p>;
            },
          },
          pre: {
            component: ({ children }) => {
              return <PreCustom>{children as PreChild}</PreCustom>;
            },
          },
          img: {
            component: PostFigure,
          },
        },
      }}
    >
      {markdown}
    </Markdown>
  );
};

export default MarkdownRenderer;
