import { createClient } from '@/utils/supabase/server';
import { redirect } from "next/navigation";

export default async function LoginLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {

  /* const supabase = await createClient();

  // This protects this route effectively as per supabase docs, trust auth.getUser()
  // do not trust auth.getSession().
  const { data, error } = await supabase.auth.getUser()
  if (!error || data.user) {
    redirect('/cms')
  } */

  return (
    <div className="">
      <h1 className='text-5xl my-10 text-center'>Login page</h1>
      {children}
    </div>
  );
};