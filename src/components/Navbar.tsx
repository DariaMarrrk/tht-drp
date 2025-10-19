import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Droplet, Menu, User, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [themeColors, setThemeColors] = useState({ primary: "270 60% 65%", secondary: "200 70% 70%", accent: "280 70% 75%" });
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, theme")
        .eq("id", user?.id)
        .single();

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
      
      if (data?.theme) {
        const themes: Record<string, { primary: string; secondary: string; accent: string }> = {
          "Purple Dream": { primary: "270 60% 65%", secondary: "200 70% 70%", accent: "280 70% 75%" },
          "Ocean Blue": { primary: "210 80% 60%", secondary: "190 70% 65%", accent: "230 60% 70%" },
          "Forest Green": { primary: "150 50% 50%", secondary: "120 40% 55%", accent: "170 45% 60%" },
          "Sunset Orange": { primary: "30 90% 60%", secondary: "15 85% 55%", accent: "45 80% 65%" },
          "Rose Pink": { primary: "340 75% 65%", secondary: "320 70% 70%", accent: "350 80% 75%" },
        };
        
        const savedTheme = themes[data.theme];
        if (savedTheme) {
          setThemeColors(savedTheme);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "My Week", href: "/week" },
    { label: "How It Works", href: "/how-it-works" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "backdrop-blur-md shadow-lg border-b"
          : "bg-transparent"
      }`}
      style={
        isScrolled
          ? {
              background: `linear-gradient(135deg, hsl(${themeColors.primary} / 0.15), hsl(${themeColors.secondary} / 0.12))`,
              borderColor: `hsl(${themeColors.primary} / 0.2)`,
            }
          : undefined
      }
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(147,51,234,0.5)] group-hover:shadow-[0_0_25px_rgba(147,51,234,0.8)] overflow-hidden">
              <Droplet className="w-5 h-5 text-white animate-pulse relative z-10" fill="white" fillOpacity="0.3" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/40 via-white/20 to-transparent opacity-60" />
              <Sparkles className="absolute top-1 right-1 w-2.5 h-2.5 text-white animate-pulse" style={{ animationDelay: '0.2s' }} />
              <Sparkles className="absolute bottom-2 left-2 w-2 h-2 text-white/80 animate-pulse" style={{ animationDelay: '0.4s' }} />
              <Sparkles className="absolute top-2 left-1 w-1.5 h-1.5 text-white/90 animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Thought Drop
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors relative group ${
                  location.pathname === "/week"
                    ? location.pathname === link.href
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                    : location.pathname === link.href
                    ? "text-foreground"
                    : "text-foreground/80 hover:text-foreground"
                }`}
              >
                {link.label}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                    location.pathname === "/week" ? "bg-white" : "bg-primary"
                  } ${location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"}`}
                />
              </Link>
            ))}

            <Link to="/profile">
              <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white">
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-6 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-left text-lg font-medium transition-colors ${
                      location.pathname === "/week"
                        ? location.pathname === link.href
                          ? "text-white"
                          : "text-white/70 hover:text-white"
                        : location.pathname === link.href
                        ? "text-foreground"
                        : "text-foreground/80 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 text-lg font-medium transition-colors ${
                    location.pathname === "/week"
                      ? "text-white/70 hover:text-white"
                      : "text-foreground/80 hover:text-foreground"
                  }`}
                >
                  <User className="w-5 h-5" />
                  Profile
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
