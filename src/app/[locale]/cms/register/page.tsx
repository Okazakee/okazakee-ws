'use client';

import { useState } from 'react';
import { login } from '@/app/actions/login';
import { CircleUserRound } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <section className="my-52 flex items-center justify-center">
      <div className="p-8 rounded-xl w-full max-w-md border border-main">
        <CircleUserRound size={100} className='mx-auto mb-6' />
        <form onSubmit={(e) => {
          e.preventDefault();
          login(email, password);
        }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md px-4 py-2 border focus:outline-none mb-5 text-darktext"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md px-4 py-2 border focus:outline-none mb-5 text-darktext"
          />
          <button
            type="submit"
            className="w-full text-xl bg-secondary text-lighttext transition-all py-3 rounded-lg hover:bg-main focus:outline-nonescale-[85%] sm:scale-100 xs:scale-100"
          >
            Accedi
          </button>
        </form>
      </div>
    </section>
  );
}