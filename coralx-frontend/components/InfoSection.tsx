import { useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InfoSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const benefits = [
    "Personalized syllabus from any financial e-book",
    "Interactive quizzes that adapt to your knowledge",
    "Progress tracking with detailed analytics",
    "Downloadable certificates upon completion",
  ];

  return (
    <div id="how-it-works" ref={sectionRef} className="section">
      <div className="section-inner">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h5 className="reveal text-blue-400 text-sm font-semibold tracking-wide uppercase mb-3">
              How It Works
            </h5>
            <h2 className="reveal text-3xl md:text-4xl font-bold text-white mb-6">
              Your Personal Financial Learning Journey
            </h2>
            <p className="reveal text-lg text-gray-300 mb-6">
              Link-X uses AI to transform financial e-books into personalized learning experiences that adapt to your unique learning style, pace, and goals.
            </p>
            
            <div className="reveal space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
                  <p className="text-gray-300">{benefit}</p>
                </div>
              ))}
            </div>
            
            <div className="reveal">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <div className="reveal relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-sky-500/20 rounded-xl blur-xl opacity-50"></div>
              <div className="relative rounded-xl overflow-hidden border border-blue-900 shadow-xl">
                <div className="aspect-[4/3] bg-black flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black p-6 flex flex-col">
                    <div className="glass-effect rounded-lg p-4 mb-4">
                      <div className="h-6 w-2/3 bg-blue-900/50 rounded mb-3"></div>
                      <div className="h-4 w-full bg-blue-900/30 rounded mb-2"></div>
                      <div className="h-4 w-5/6 bg-blue-900/30 rounded mb-2"></div>
                      <div className="h-4 w-4/6 bg-blue-900/30 rounded"></div>
                    </div>
                    <div className="flex-1 glass-effect rounded-lg p-4 flex flex-col">
                      <div className="h-5 w-1/2 bg-blue-900/50 rounded mb-4"></div>
                      <div className="flex-1 grid grid-cols-1 gap-2">
                        <div className="h-10 bg-blue-900/30 rounded flex items-center px-3">
                          <div className="h-4 w-4 bg-blue-500 rounded-full mr-3"></div>
                          <div className="h-4 w-3/4 bg-blue-900/50 rounded"></div>
                        </div>
                        <div className="h-10 bg-blue-900/30 rounded flex items-center px-3">
                          <div className="h-4 w-4 bg-blue-500 rounded-full mr-3"></div>
                          <div className="h-4 w-3/4 bg-blue-900/50 rounded"></div>
                        </div>
                        <div className="h-10 bg-blue-900/30 rounded flex items-center px-3">
                          <div className="h-4 w-4 bg-blue-500 rounded-full mr-3"></div>
                          <div className="h-4 w-3/4 bg-blue-900/50 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoSection;
