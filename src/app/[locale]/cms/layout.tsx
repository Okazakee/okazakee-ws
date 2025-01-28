import { logout } from '@/app/actions/logout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from "next/navigation";

export default async function CmsLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {

  const supabase = await createClient();

  // This protects this route effectively as per supabase docs, trust auth.getUser()
  // do not trust auth.getSession().
  const { data, error } = await supabase.auth.getUser()
  /* if (error || !data?.user) {
    redirect('/cms/login')
  } */

  return (
    <div className="">
      { data.user &&
      <>
        <h1 className='text-5xl my-10 text-center'>CMS - {data.user.email}</h1>
        <button className='border' onClick={logout}>logout</button>
      </>
      }
      {children}
    </div>
  );
};