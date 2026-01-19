import { redirect } from 'next/navigation';

// Registration is disabled for security (single-user CMS)
// To re-enable, uncomment the RegisterPageContent component below

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Redirect to login - registration disabled
  redirect(`/${locale}/cms/login`);
}

/*
// ============ DISABLED REGISTRATION CODE ============
// Uncomment this section to re-enable registration

'use client';

import { signup } from '@/app/actions/cms/signup';
import { CircleUserRound } from 'lucide-react';
import { type FormEvent, useState } from 'react';

function RegisterPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const validateEmail = (email: string) => {
    return /^\S+@\S+$/i.test(email);
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);
    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasNonalphas
    );
  };

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!validatePassword(password)) {
      newErrors.password =
        'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length === 0) {
      const result = await signup(email, password);
      if (result?.error) {
        setErrors({ general: result.error });
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <section className="my-52 flex items-center justify-center">
      <div className="p-8 rounded-xl w-full max-w-md border border-main">
        <CircleUserRound size={100} className="mx-auto mb-6" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                checkPasswordStrength(e.target.value);
              }}
              className="w-full"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
            <div className="flex mt-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-full mr-1 rounded-full ${i < passwordStrength ? 'bg-green-500' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {errors.general && (
            <p className="text-red-500 text-sm">{errors.general}</p>
          )}

          <button
            type="submit"
            className="w-full text-xl bg-secondary text-lighttext transition-all py-3 rounded-lg hover:bg-main focus:outline-hidden"
          >
            Register
          </button>
        </form>
      </div>
    </section>
  );
}
*/
