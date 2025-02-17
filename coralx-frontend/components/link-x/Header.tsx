"use client"

import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"

type HeaderProps = {
    showAuthButton?: boolean    // Shows Auth Button by default. 
    isLoggedIn: boolean         // Always needs to know if logged in
}

const Header = ({ showAuthButton = true, isLoggedIn }: HeaderProps) => {
    const { resolvedTheme } = useTheme()
    // Select logo based on light or dark theme
    const logoSrc = resolvedTheme === "dark" ? "/images/Logo-dark.png" : "/images/Logo-light.png"

  return (
    <header className="absolute top-4 left-0 w-full h-[8vh] flex items-center">
      <nav className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center w-full h-full">
          <Link href="/" className="flex items-center h-full relative">
            <Image
              src={logoSrc}
              alt="Link-X Logo"
              width={288}
              height={197}
              className="max-h-[8vh] w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center lg:order-2">
            {showAuthButton && (
                <Link
                    href={isLoggedIn ? "/logout" : "/login"}      // TODO: Define actual method for logging out later
                    className="hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800"
                >
                    {isLoggedIn ? "Log out" : "Log in"}
                </Link>
            )}

          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header