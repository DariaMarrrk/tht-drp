import logo from "@/assets/logo.svg";

export const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Etheri Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-xl">Etheri</span>
          </div>

          <p className="text-sm text-muted-foreground">© 2025 Etheri. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
