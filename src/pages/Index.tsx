import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ThoughtInput } from "@/components/ThoughtInput";
import { ThoughtsConstellation } from "@/components/ThoughtsConstellation";
import { HowItWorks } from "@/components/HowItWorks";
import { Benefits } from "@/components/Benefits";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div id="home">
        <Hero />
      </div>
      <div id="share">
        <ThoughtInput />
      </div>
      <div id="constellation">
        <ThoughtsConstellation />
      </div>
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <div id="benefits">
        <Benefits />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
