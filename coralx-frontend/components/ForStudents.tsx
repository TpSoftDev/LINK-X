import { useEffect, useRef } from 'react';
import { GraduationCap, Users, Code, BarChart } from 'lucide-react';

const StudentBenefits = () => {
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

  const benefits = [
    {
      title: "Learn from Experts",
      description: "Collaborate with Masters students and professionals with experience in tech, entrepreneurship, and business.",
      icon: GraduationCap
    },
    {
      title: "Team Collaboration",
      description: "Develop teamwork skills by working with peers on real-world financial challenges and projects.",
      icon: Users
    },
    {
      title: "Technical Skills",
      description: "Master AI APIs, prompt engineering, RAG techniques, and cloud computing for financial applications.",
      icon: Code
    },
    {
      title: "Business Acumen",
      description: "Build practical skills in financial analysis, modeling, and data visualization for career advancement.",
      icon: BarChart
    }
  ];

  return (
    <div id="for-students" ref={sectionRef} className="section">
      <div className="section-inner">
        <div className="text-center mb-16">
          <h5 className="reveal text-blue-400 text-sm font-semibold tracking-wide uppercase mb-3">
            For Students
          </h5>
          <h2 className="reveal text-3xl md:text-4xl font-bold text-white mb-4">
            Skills You'll Develop
          </h2>
          <p className="reveal max-w-2xl mx-auto text-gray-300">
            Link-X doesn't just teach financial concepts - it equips you with practical skills for the modern world.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div 
              key={benefit.title}
              className="reveal glass-effect rounded-xl p-6 flex items-start"
            >
              <div className="rounded-full w-12 h-12 flex items-center justify-center bg-blue-900/50 mr-4 flex-shrink-0">
                <benefit.icon className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentBenefits;
