import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductShowcase from "@/components/ProductShowcase";
import About from "@/components/About";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulating page loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle initial page transitions
  useEffect(() => {
    if (!isLoading) {
      document.body.style.overflow = "auto";
    } else {
      document.body.style.overflow = "hidden";
    }
  }, [isLoading]);

  return (
    <>
      {/* Loading screen */}
      <div
        className={cn(
          "fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-700",
          isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="text-5xl font-bold relative">
          <span className="text-primary">INSIGHT</span>
          <div 
            className={cn(
              "absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 ease-in-out",
              isLoading ? "w-0" : "w-full"
            )}
          />
        </div>
      </div>

      {/* Main content */}
      <div 
        className={cn(
          "transition-opacity duration-700",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      >
        <Navbar />
        <main>
          <Hero />
          <ProductShowcase />
          <About />
          <Newsletter />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
