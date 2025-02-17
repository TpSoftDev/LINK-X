import Link from "next/link"

import Header from '@/components/link-x/Header';

export default function LandingPage() {
  return (
  <div className="relative min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Header isLoggedIn={false}/>
      <main className="flex flex-col items-center justify-center h-screen">
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            className="rounded-lg border border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="/register"
            rel="noopener noreferrer"
          >
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}
