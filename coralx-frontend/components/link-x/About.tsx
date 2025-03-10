
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Shield, Zap, Lightbulb } from "lucide-react";

interface Feature {
  icon: JSX.Element;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: "Intelligent Insights",
    description: "Our advanced algorithms process and analyze complex datasets to uncover hidden patterns and valuable insights."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Lightning Fast",
    description: "Experience real-time data processing with our optimized platform, delivering results when you need them most."
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure & Private",
    description: "Your data security is our priority, with end-to-end encryption and strict privacy controls built into every layer."
  }
];

const About = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
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

  useEffect(() => {
    if (isVisible) {
      featureRefs.current.forEach((ref, index) => {
        if (ref) {
          setTimeout(() => {
            ref.classList.add("opacity-100", "translate-y-0");
            ref.classList.remove("opacity-0", "translate-y-20");
          }, 200 * index);
        }
      });
    }
  }, [isVisible]);

  return (
    <section 
      id="about" 
      ref={sectionRef}
      className="section-padding relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          {/* Left column: About content */}
          <div className="w-full md:w-1/2">
            <div className="max-w-lg">
              <div className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-medium bg-primary/10 text-primary">
                About Us
              </div>
              <h2 className="heading-lg mb-6">Transforming Data Into Strategic Decisions</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Founded on the principle that quality insights drive exceptional outcomes, we've built a platform that makes data analytics accessible, actionable, and transformative for businesses of all sizes.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 btn-hover">
                  Our Story
                </button>
                <button className="px-6 py-3 rounded-full border border-border hover:border-foreground/30 transition-colors btn-hover">
                  Join Our Team
                </button>
              </div>
            </div>
          </div>

          {/* Right column: Features */}
          <div className="w-full md:w-1/2">
            <div className="grid grid-cols-1 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  ref={el => featureRefs.current[index] = el}
                  className={cn(
                    "p-6 rounded-2xl bg-white dark:bg-black shadow-lg border border-border/50 opacity-0 translate-y-20 transition-all duration-700",
                    index % 2 === 0 ? "md:ml-12" : ""
                  )}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="flex gap-4 items-start">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;