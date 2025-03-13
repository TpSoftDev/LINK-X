import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import LandingHeader from './landing/LandingHeader';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Close mobile menu if open
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
      
      // Scroll to the element with smooth behavior
      targetElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const navItems = [
    { name: "Features", href: "#features", id: "features" },
    { name: "How It Works", href: "#how-it-works", id: "how-it-works" },
    { name: "For Students", href: "#for-students", id: "for-students" },
    { name: "Pricing", href: "#pricing", id: "pricing" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out py-5 md:py-6 w-full",
        isScrolled 
          ? "bg-black/80 backdrop-blur shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="max-w-[1400px] w-full mx-auto flex items-center justify-between">
        <a href="#" className="flex items-center">
          <span className="text-2xl md:text-3xl font-bold text-gradient">
            LINK-X
          </span>
        </a>

        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-gray-300 hover:text-blue-400 transition-colors"
              onClick={(e) => handleSmoothScroll(e, item.id)}
            >
              {item.name}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <Button
            variant="ghost"
            className="text-sm font-medium text-gray-300 hover:text-blue-400"
          >
            Log In
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            Get Started
          </Button>
        </div>

        <button 
          className="md:hidden" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={cn(
          "fixed inset-0 bg-black z-40 md:hidden transition-transform duration-300 ease-in-out pt-20",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="px-6 py-4 space-y-6">
          <nav className="flex flex-col space-y-6">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-lg font-medium text-gray-300 hover:text-blue-400"
                onClick={(e) => handleSmoothScroll(e, item.id)}
              >
                {item.name}
              </a>
            ))}
          </nav>
          <div className="flex flex-col space-y-4 pt-6 border-t border-gray-800">
            <Button
              variant="ghost"
              className="justify-center text-gray-300"
            >
              Log In
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 justify-center"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
