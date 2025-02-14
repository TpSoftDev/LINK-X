import Image from "next/image";

export default function LandingPage() {
  return (
  <div className="relative min-h-screen font-[family-name:var(--font-geist-sans)]">
      <header className="absolute top-0 left-0 w-full h-[6.5vh] flex items-center">
        <nav className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center w-full h-full border-2">
            <a href="/" className="flex items-center h-full">
              <img
                src="/images/Logots.png"
                className="max-h-[6.5vh] object-contain"
                alt="Link-X Logo"
              />
            </a>
            <div className="flex items-center lg:order-2">
              <a href="/login" className="hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800">
              Log in 
              </a>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex flex-col items-center justify-center h-screen">
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-lg border border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="/register"
            //target="_blank"
            rel="noopener noreferrer"
          >
            Register
          </a>
        </div>
      </main>
    </div>
  );
}
