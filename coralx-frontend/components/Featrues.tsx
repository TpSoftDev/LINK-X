import { useEffect, useRef } from 'react';
import { Cpu, BookOpen, Zap, Award, BarChart, Database } from 'lucide-react';

const features = [
  {
    name: 'AI-Powered Personalization',
    description: 'Our AI analyzes your learning style and creates a customized curriculum that adapts to your needs.',
    icon: Cpu,
  },
  {
    name: 'Interactive E-Books',
    description: 'Upload or choose from our library of financial e-books that transform into interactive learning modules.',
    icon: BookOpen,
  },
  {
    name: 'Adaptive Assessments',
    description: 'Quizzes and assessments that adjust to your progress, focusing on areas where you need more practice.',
    icon: Zap,
  },
  {
    name: 'Certification',
    description: 'Earn certificates that verify your financial knowledge and skills to share with employers.',
    icon: Award,
  },
  {
    name: 'Progress Analytics',
    description: 'Detailed insights into your learning journey with metrics to track your improvement over time.',
    icon: BarChart,
  },
  {
    name: 'Cloud-Based Learning',
    description: 'Access your personalized learning materials from any device, with progress automatically synced.',
    icon: Database,
  },
];

const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elements = entry.target.querySelectorAll('.reveal');
          if (entry.isIntersecting) {
            elements.forEach((el, index) => {
              setTimeout(() => {
                el.classList.add('active');
              }, index * 100);
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

  return (
    <div id="features" ref={sectionRef} className="section bg-black/50">
      <div className="section-inner">
        <div className="text-center mb-16">
          <h5 className="reveal text-blue-400 text-sm font-semibold tracking-wide uppercase mb-3">
            Features
          </h5>
          <h2 className="reveal text-3xl md:text-4xl font-bold text-white mb-4">
            Revolutionize Your Financial Learning
          </h2>
          <p className="reveal max-w-2xl mx-auto text-gray-300">
            Our comprehensive suite of tools is designed to transform how you learn about finance, making complex concepts accessible and engaging.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.name}
              className="reveal glass-effect rounded-xl p-6 transition-all duration-300 hover:border-blue-700"
            >
              <div className="inline-flex items-center justify-center p-3 bg-blue-900/30 rounded-lg text-blue-400 mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.name}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
