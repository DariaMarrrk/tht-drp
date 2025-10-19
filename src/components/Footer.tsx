import { Sparkles } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl">Etheri</span>
          </div>

          <p className="text-sm text-muted-foreground">© 2025 Etheri. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
