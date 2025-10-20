import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const themes = [
  { name: "Purple Dream", colors: { primary: "270 65% 55%", secondary: "200 80% 65%", accent: "310 75% 70%" } },
  { name: "Ocean Blue", colors: { primary: "210 85% 50%", secondary: "180 70% 65%", accent: "240 90% 70%" } },
  { name: "Forest Green", colors: { primary: "150 60% 45%", secondary: "85 50% 55%", accent: "170 70% 65%" } },
  { name: "Sunset Orange", colors: { primary: "25 95% 55%", secondary: "340 80% 60%", accent: "45 90% 70%" } },
  { name: "Rose Pink", colors: { primary: "340 80% 60%", secondary: "320 65% 70%", accent: "10 90% 75%" } },
  { name: "Monochrome", colors: { primary: "0 0% 45%", secondary: "0 0% 25%", accent: "0 0% 85%" } },
];

export const useUserTheme = () => {
  const { user } = useAuth();

  useEffect(() => {
    const loadAndApplyTheme = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("theme")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data?.theme) {
          const savedTheme = themes.find((t) => t.name === data.theme);
          if (savedTheme) {
            const root = document.documentElement;
            root.style.setProperty("--primary", savedTheme.colors.primary);
            root.style.setProperty("--secondary", savedTheme.colors.secondary);
            root.style.setProperty("--accent", savedTheme.colors.accent);
          }
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };

    loadAndApplyTheme();
  }, [user]);
};
