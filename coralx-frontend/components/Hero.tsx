import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Award, Database } from "lucide-react";

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);

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

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-blue-900/20 rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-1/3 -right-40 w-96 h-96 bg-sky-900/20 rounded-full filter blur-3xl opacity-50"></div>
      </div>

      <div className="container px-6 mx-auto max-w-6xl">
        <div className="text-center">
          <div className="inline-block reveal mb-4 px-3 py-1 bg-blue-900/30 rounded-full text-sm font-medium text-blue-300 border border-blue-800">
            Financial Learning Platform
          </div>
          
          <h1 className="reveal text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance">
            <span className="text-gradient">
              Learn it your way.
            </span>
          </h1>
          
          <p className="reveal text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Traditional learning doesn't work for everyone. Our AI-powered platform personalizes financial education to match your unique learning style.
          </p>
          
          <div className="reveal flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-base h-12 px-6"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-base h-12 px-6 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              How It Works
            </Button>
          </div>
        </div>

        <div className="reveal mt-16 md:mt-24 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass-effect p-6 rounded-xl">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-blue-900/50 mb-4">
              <BookOpen className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Personalized Learning</h3>
            <p className="text-gray-400">AI adapts to your unique learning style for maximum engagement</p>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-blue-900/50 mb-4">
              <Award className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Certification</h3>
            <p className="text-gray-400">Earn recognized certificates to showcase your financial expertise</p>
          </div>
          
          <div className="glass-effect p-6 rounded-xl">
            <div className="rounded-full w-12 h-12 flex items-center justify-center bg-blue-900/50 mb-4">
              <Database className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Cloud Integration</h3>
            <p className="text-gray-400">Access your learning materials anywhere, anytime with cloud storage</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
