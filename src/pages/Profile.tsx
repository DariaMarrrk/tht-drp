import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Upload, User, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CleanupUsers } from "@/components/CleanupUsers";
import themeSpace from "@/assets/theme-space.jpg";
import themeForest from "@/assets/theme-forest.jpg";
import themeOcean from "@/assets/theme-ocean.jpg";
import themeGarden from "@/assets/theme-garden.jpg";
import themeCampfire from "@/assets/theme-campfire.jpg";
import themeCoralReef from "@/assets/theme-coral-reef.jpg";
import themeCosyLibrary from "@/assets/theme-cosy-library.jpg";
import themeStarryNight from "@/assets/theme-starry-night.jpg";
import themeVillageSunrise from "@/assets/theme-village-sunrise.jpg";

const themes = [
  { name: "Purple Dream", colors: { primary: "270 65% 55%", secondary: "200 80% 65%", accent: "310 75% 70%" } },
  { name: "Ocean Blue", colors: { primary: "210 85% 50%", secondary: "180 70% 65%", accent: "240 90% 70%" } },
  { name: "Forest Green", colors: { primary: "150 60% 45%", secondary: "85 50% 55%", accent: "170 70% 65%" } },
  { name: "Sunset Orange", colors: { primary: "25 95% 55%", secondary: "340 80% 60%", accent: "45 90% 70%" } },
  { name: "Rose Pink", colors: { primary: "340 80% 60%", secondary: "320 65% 70%", accent: "10 90% 75%" } },
  { name: "Monochrome", colors: { primary: "0 0% 45%", secondary: "0 0% 25%", accent: "0 0% 85%" } },
];

const imageryThemes = [
  { name: "Space", description: "Cosmic serenity", image: themeSpace },
  { name: "Forest", description: "Woodland peace", image: themeForest },
  { name: "Ocean", description: "Coastal calm", image: themeOcean },
  { name: "Garden", description: "Botanical tranquility", image: themeGarden },
  { name: "Campfire", description: "Cozy warmth", image: themeCampfire },
  { name: "Coral Reef", description: "Underwater wonder", image: themeCoralReef },
  { name: "Cosy Library", description: "Literary comfort", image: themeCosyLibrary },
  { name: "Starry Night", description: "Celestial dreams", image: themeStarryNight },
  { name: "Village Sunrise", description: "Morning hope", image: themeVillageSunrise },
];

const Profile = () => {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [selectedImageryTheme, setSelectedImageryTheme] = useState(imageryThemes[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, theme, imagery_theme")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      const profile = data as any;
      setUsername(profile?.username || "");
      setAvatarUrl(profile?.avatar_url || "");

      if (profile?.theme) {
        const savedTheme = themes.find((t) => t.name === profile.theme);
        if (savedTheme) {
          setSelectedTheme(savedTheme);
          // Apply theme colors on load
          const root = document.documentElement;
          root.style.setProperty("--primary", savedTheme.colors.primary);
          root.style.setProperty("--secondary", savedTheme.colors.secondary);
          root.style.setProperty("--accent", savedTheme.colors.accent);
        }
      }

      if (profile?.imagery_theme) {
        const savedImageryTheme = imageryThemes.find(
          (t) => t.name.toLowerCase() === profile.imagery_theme.toLowerCase(),
        );
        if (savedImageryTheme) setSelectedImageryTheme(savedImageryTheme);
      }

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roleData);
    } catch (error: any) {
      console.error("Error loading profile:", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl } as any)
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleThemeChange = async (theme: (typeof themes)[0]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ theme: theme.name } as any)
        .eq("id", user.id);

      if (error) throw error;

      setSelectedTheme(theme);

      // Apply theme to document
      const root = document.documentElement;
      root.style.setProperty("--primary", theme.colors.primary);
      root.style.setProperty("--secondary", theme.colors.secondary);
      root.style.setProperty("--accent", theme.colors.accent);

      toast({
        title: "Theme updated",
        description: `Switched to ${theme.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImageryThemeChange = async (theme: (typeof imageryThemes)[0]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ imagery_theme: theme.name.toLowerCase() } as any)
        .eq("id", user.id);

      if (error) throw error;

      setSelectedImageryTheme(theme);

      toast({
        title: "Imagery theme updated",
        description: `Switched to ${theme.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data."
    );

    if (!confirmed) return;

    try {
      // Call the delete_user function which will cascade delete everything
      const { error } = await supabase.rpc("delete_user" as any);

      if (error) throw error;

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error deleting account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen py-24 px-6">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Profile</h1>
          <p className="text-xl text-muted-foreground">Customize your Etheri experience</p>
        </div>

        <div className="space-y-6">
          {/* Avatar Section */}
          <Card className="p-6">
            <div className="flex flex-col items-center gap-6">
              <Avatar className="w-32 h-32">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white text-3xl">
                  <User className="w-16 h-16" />
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">{username}</h2>
                <p className="text-sm text-muted-foreground">@{username}</p>
              </div>

              <div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Label htmlFor="avatar-upload">
                  <Button variant="outline" className="cursor-pointer" disabled={isUploading} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? "Uploading..." : "Change Picture"}
                    </span>
                  </Button>
                </Label>
              </div>
            </div>
          </Card>

          {/* Theme Selection */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Color Theme</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => handleThemeChange(theme)}
                  className={`relative p-4 rounded-lg border-2 transition-all overflow-hidden h-32 ${
                    selectedTheme.name === theme.name
                      ? "border-primary shadow-glow ring-2 ring-primary/50"
                      : "border-border hover:border-primary/50"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, hsl(${theme.colors.primary}) 0%, hsl(${theme.colors.secondary}) 50%, hsl(${theme.colors.accent}) 100%)`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <p className="text-sm font-bold text-white drop-shadow-lg">{theme.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Imagery Theme Selection */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Imagery Theme</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose a visual atmosphere for your backgrounds and patterns
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imageryThemes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => handleImageryThemeChange(theme)}
                  className={`relative p-4 rounded-lg border-2 transition-all overflow-hidden h-32 ${
                    selectedImageryTheme.name === theme.name
                      ? "border-primary shadow-glow ring-2 ring-primary/50"
                      : "border-border hover:border-primary/50"
                  }`}
                  style={{
                    backgroundImage: `url(${theme.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-all hover:bg-black/30" />
                  <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                    <p className="text-sm font-bold mb-1 drop-shadow-lg">{theme.name}</p>
                    <p className="text-xs drop-shadow-lg">{theme.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* User Cleanup (Admin) */}
          {isAdmin && <CleanupUsers />}

          {/* Sign Out */}
          <Card className="p-6">
            <div className="space-y-3">
              <Button onClick={handleLogout} variant="destructive" className="w-full" size="lg">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <Button
                onClick={handleDeleteAccount}
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                size="lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
