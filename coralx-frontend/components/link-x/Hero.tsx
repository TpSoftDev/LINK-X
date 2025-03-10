import { useEffect, useState, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Hero = () => {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const animate = () => {
      if (titleRef.current && subtitleRef.current && ctaRef.current) {
        setTimeout(() => {
          titleRef.current?.classList.add('animate-fade-up');
          titleRef.current?.classList.remove('opacity-0');
          
          setTimeout(() => {
            subtitleRef.current?.classList.add('animate-fade-up');
            subtitleRef.current?.classList.remove('opacity-0');
            
            setTimeout(() => {
              ctaRef.current?.classList.add('animate-fade-up');
              ctaRef.current?.classList.remove('opacity-0');
            }, 300);
          }, 300);
        }, 200);
      }
    };

    animate();
  }, []);

  const scrollToProducts = () => {
    const productsSection = document.querySelector('#products');
    if (productsSection) {
      window.scrollTo({
        top: productsSection.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section 
      id="home" 
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        paddingTop: '80px',
        paddingBottom: '80px'
      }}
    >
      {/* Background gradient */}
      <div 
        className="absolute inset-0 z-0 opacity-30 dark:opacity-20"
        style={{ 
          transform: `translateY(${scrollY * 0.15}px)`,
          background: 'radial-gradient(circle at top right, rgba(29, 78, 216, 0.15), transparent 80%), radial-gradient(circle at bottom left, rgba(30, 64, 175, 0.15), transparent 80%)'
        }}
      >
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 rounded-full bg-blue-800/10 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full bg-blue-700/10 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 container max-w-6xl mx-auto px-6 text-center">
        <h1 
          ref={titleRef}
          className="opacity-0 heading-xl mb-6 leading-tight text-balance max-w-4xl mx-auto"
          style={{ 
            transform: `translateY(${scrollY * -0.1}px)`
          }}
        >
          <span className="text-foreground">Discover Insights That</span>
          <br />
          <span className="text-primary">Transform Your Business</span>
        </h1>

        <p 
          ref={subtitleRef}
          className="opacity-0 text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance"
          style={{ 
            transform: `translateY(${scrollY * -0.05}px)`
          }}
        >
          Harness the power of data-driven decisions with our cutting-edge analytics platform. Elevate your strategy with clarity and precision.
        </p>

        <div 
          ref={ctaRef}
          className="opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
        >
          <button 
            className="px-8 py-4 rounded-full bg-primary text-white font-medium hover:bg-primary/90 btn-hover shadow-lg shadow-primary/20"
          >
            Start Free Trial
          </button>
          <button 
            className="px-8 py-4 rounded-full border border-border hover:border-foreground/30 transition-colors btn-hover"
          >
            View Demo
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div 
        className={cn(
          "absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer transition-opacity duration-500",
          scrollY > 100 ? "opacity-0" : "opacity-100"
        )}
        onClick={scrollToProducts}
      >
        <div className="flex flex-col items-center animate-bounce">
          <span className="text-sm font-medium mb-2">Scroll Down</span>
          <ArrowDown className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
