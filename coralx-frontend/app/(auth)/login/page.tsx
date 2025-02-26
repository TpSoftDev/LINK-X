'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [state, setState] = useState<'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data'>('idle');

  useEffect(() => {
    if (state === 'failed') {
      toast.error('Invalid credentials!');
    } else if (state === 'invalid_data') {
      toast.error('Failed validating your submission!');
    } else if (state === 'success') {
      toast.success('Logged in successfully');
      setIsSuccessful(true);
      
      console.log('Redirecting to /chat'); // Debugging log
      router.push('/chat');
    }
  }, [state, router]);
  

  const handleSubmit = async (formData: FormData) => {
    setEmail(formData.get('email') as string);
    setState('in_progress');
  
    const response = await fetch('http://localhost:8080/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
      }),
    });
  
    if (response.ok) {
      const data = await response.json();
      const token = data.token;
  
      // Store the JWT token in localStorage or cookies
      localStorage.setItem('token', token);
  
      setState('success');
      // Redirect to the chat page after login
      router.push('/chat');
    } else {
      const { error } = await response.json();
      if (error === 'Invalid credentials') {
        setState('failed');
      } else if (error === 'Invalid data') {
        setState('invalid_data');
      }
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}