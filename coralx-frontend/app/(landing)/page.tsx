
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import InfoSection from "@/components/landing/InfoSection";
import ForStudents from "@/components/landing/ForStudents";
import Cta from "@/components/landing/Cta";
import Footer from "@/components/landing/Footer";
import LandingHeader from "@/components/landing/LandingHeader";

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-black text-white min-h-screen w-full overflow-hidden">
      <LandingHeader />
      <Hero />
      <Features />
      <InfoSection />
      <ForStudents />
      <Cta />
      <Footer />
    </div>
  );
}
