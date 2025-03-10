
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import InfoSection from "@/components/landing/InfoSection";
import ForStudents from "@/components/landing/ForStudents";
import Cta from "@/components/landing/Cta";
import Footer from "@/components/landing/Footer";
import LandingHeader from "@/components/landing/LandingHeader";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <LandingHeader/>
      <Hero />
      <Features />
      <InfoSection />
      <ForStudents />
      <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
        }}>
      <Cta />
      </div>
      <Footer />
    </div>
  );
}
