'use client';

import { useState } from 'react';
import { login } from '@/app/actions/login';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <section className="my-52 flex items-center justify-center">
      <div className="px-8 py-16 rounded-xl w-full max-w-md border border-main">
        <h1 className="text-2xl font-bold mb-12 text-center">Login</h1>
        <div className="">
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
            onClick={() => login(email, password)}
            className="w-full bg-secondary text-white py-2 rounded-lg hover:bg-main focus:outline-none transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </section>
  );
}