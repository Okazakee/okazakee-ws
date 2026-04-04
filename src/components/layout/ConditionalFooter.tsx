import Footer from './Footer';

export default function ConditionalFooter({
  locale,
  isCMSRoute = false,
}: {
  locale: string;
  isCMSRoute?: boolean;
}) {
  return (
    <div
      className={
        isCMSRoute
          ? 'fixed bottom-0 left-0 right-0 z-20 bg-bglight dark:bg-bgdark hidden lg:block'
          : ''
      }
    >
      <Footer locale={locale} />
    </div>
  );
}
