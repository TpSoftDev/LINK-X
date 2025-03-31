"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseconfig";
import { useAuth } from "@/app/(auth)/AuthContext";

type HeaderProps = {
  showAuthButton?: boolean;
  isLoggedIn: boolean;
};

const Header = ({ showAuthButton = true, isLoggedIn }: HeaderProps) => {
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <header className="absolute top-4 left-0 w-full h-[8vh] flex items-center">
      <nav className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center w-full h-full">
          <Link href="/" className="flex items-center h-full relative">
            <Image
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
                onClick={user ? handleSignOut : handleLogin} // ✅ Check if user is logged in
              >
                {user ? "Sign out" : "Log in"}
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
