import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Cta = () => {
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elements = entry.target.querySelectorAll('.reveal');
          if (entry.isIntersecting) {
            elements.forEach((el) => {
              el.classList.add('active');
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (ctaRef.current) {
      observer.observe(ctaRef.current);
    }

    return () => {
      if (ctaRef.current) {
        observer.unobserve(ctaRef.current);
      }
    };
  }, []);

  return (
    <div id="pricing" ref={ctaRef} className="section bg-black/30 flex justify-center">
      <div className="section-inner max-w-4xl w-full flex justify-center">
        <div className="relative p-8 md:p-12 rounded-2xl overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-sky-600 opacity-90"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAwIDEwMFYwaC0xMDBsMTAwIDEwMHptLTEwMC0xMDBMMCA1MHYyNWw1MC01MEg3NUwwIDEwMGgxMDBWNzVMMjUgMTAwaDI1TDEwMCAyMFYwTDUwIDUweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] opacity-30 mix-blend-overlay"></div>
          
          <div className="relative text-center">
            <h2 className="reveal text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to transform your financial education?
            </h2>
            <p className="reveal text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are already mastering finance with personalized AI learning.
            </p>
            <div className="reveal flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 border-0 text-base h-12 px-6"
              >
                Start Learning Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-white border-white/30 hover:bg-white/10 hover:border-white/50 text-base h-12 px-6"
              >
                Schedule a Demo
              </Button>
            </div>
            <p className="reveal text-sm text-blue-100/80 mt-6">
              No credit card required. Start with a free 14-day trial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cta;

