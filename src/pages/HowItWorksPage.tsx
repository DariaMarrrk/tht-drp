import { HowItWorks } from "@/components/HowItWorks";
import { Benefits } from "@/components/Benefits";

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen">
      <HowItWorks />
      <Benefits />

      <section className="py-16 px-6 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <div className="p-8 rounded-lg border-2 border-muted-foreground/20 bg-card/80 backdrop-blur-sm">
            <p className="text-center text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">ThoughtDrop isn't an AI companion or a therapy bot.</span>{" "}
              It is only a tool designed to help you take care of your wellbeing. If you require professional help,
              please reach out to a qualified specialist or someone you trust.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
