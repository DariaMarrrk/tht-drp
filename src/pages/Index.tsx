import { Hero } from "@/components/Hero";
import { ThoughtInput } from "@/components/ThoughtInput";
import { ThoughtsConstellation } from "@/components/ThoughtsConstellation";
import { HowItWorks } from "@/components/HowItWorks";
import { Benefits } from "@/components/Benefits";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <ThoughtInput />
      <ThoughtsConstellation />
      <HowItWorks />
      <Benefits />
      <Footer />
    </div>
  );
};

export default Index;
