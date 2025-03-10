import { useEffect } from 'react';
import Header from '@/components/LandingHeader';
import Hero from '@/components/Hero';
import Features from '@/components/Featrues';
import InfoSection from '@/components/InfoSection';
import ForStudents from '@/components/ForStudents';
import Cta from '@/components/Cta';
import Footer from '@/components/Footer';

const Index = () => {
  useEffect(() => {
    const revealSections = () => {
      const reveals = document.querySelectorAll('.reveal');
      
      for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
          reveals[i].classList.add('active');
        }
      }
    };
    
    window.addEventListener('scroll', revealSections);
    revealSections(); // Check on initial load
    
    return () => window.removeEventListener('scroll', revealSections);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Header />
      <Hero />
      <Features />
      <InfoSection />
      <ForStudents />
      <Cta />
      <Footer />
    </div>
  );
};

export default Index;
