"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
// import { useTheme } from "next-themes"

type HeaderProps = {
    showAuthButton?: boolean    // Shows Auth Button by default. 
    isLoggedIn: boolean         // Always needs to know if logged in
}

const Header = ({ showAuthButton = true, isLoggedIn }: HeaderProps) => {
  // Check for computer's theme 
  // const { resolvedTheme } = useTheme()
  // Select logo based on light or dark theme
  // const logoSrc = resolvedTheme === "dark" ? "/images/Logo-dark.png" : "/images/Logo-light.png"

  const router = useRouter()

  const handleSignOut = () => {
    signOut({
      redirectTo: "/",
    })
  }

  const handleLogin = () => {
    router.push("/login")
  }

  return (
    <header className="absolute top-4 left-0 w-full h-[8vh] flex items-center">
      <nav className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center w-full h-full">
          <Link href="/" className="flex items-center h-full relative">
            <Image
              // src={logoSrc}
              src={"/images/Logo-dark.png"}
              alt="Link-X Logo"
              width={288}
              height={197}
              className="max-h-[8vh] w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center lg:order-2">
            {showAuthButton && (
              <button
                type="button"
                className="w-full cursor-pointer hover:bg-gray-700 focus:ring-4 focus:ring-gray-800 rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2 focus:outline-none"
                onClick={isLoggedIn ? handleSignOut : handleLogin}
              >
                {isLoggedIn ? "Sign out" : "Log in"}
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header