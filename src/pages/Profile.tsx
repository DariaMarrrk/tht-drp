import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Upload, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const themes = [
  { name: "Purple Dream", colors: { primary: "270 60% 65%", secondary: "200 70% 70%", accent: "280 70% 75%" } },
  { name: "Ocean Blue", colors: { primary: "210 80% 60%", secondary: "190 70% 65%", accent: "230 60% 70%" } },
  { name: "Forest Green", colors: { primary: "150 50% 50%", secondary: "120 40% 55%", accent: "170 45% 60%" } },
  { name: "Sunset Orange", colors: { primary: "30 90% 60%", secondary: "15 85% 55%", accent: "45 80% 65%" } },
  { name: "Rose Pink", colors: { primary: "340 75% 65%", secondary: "320 70% 70%", accent: "350 80% 75%" } },
];

const imageryThemes = [
  { name: "Space", description: "Cosmic serenity" },
  { name: "Forest", description: "Woodland peace" },
  { name: "Ocean", description: "Coastal calm" },
  { name: "Garden", description: "Botanical tranquility" },
  { name: "Campfire", description: "Cozy warmth" },
  { name: "Coral Reef", description: "Underwater wonder" },
  { name: "Cosy Library", description: "Literary comfort" },
];

const Profile = () => {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [selectedImageryTheme, setSelectedImageryTheme] = useState(imageryThemes[0]);
  const [isUploading, setIsUploading] = useState(false);
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
        const savedTheme = themes.find(t => t.name === profile.theme);
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
        const savedImageryTheme = imageryThemes.find(t => t.name.toLowerCase() === profile.imagery_theme.toLowerCase());
        if (savedImageryTheme) setSelectedImageryTheme(savedImageryTheme);
      }
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

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

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

  const handleThemeChange = async (theme: typeof themes[0]) => {
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

  const handleImageryThemeChange = async (theme: typeof imageryThemes[0]) => {
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

  return (
    <div className="min-h-screen py-24 px-6">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Profile</h1>
          <p className="text-xl text-muted-foreground">
            Customize your Thought Drop experience
          </p>
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
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    disabled={isUploading}
                    asChild
                  >
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
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTheme.name === theme.name
                      ? "border-primary shadow-glow"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                    />
                  </div>
                  <p className="text-sm font-medium">{theme.name}</p>
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
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedImageryTheme.name === theme.name
                      ? "border-primary shadow-glow"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-medium mb-1">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Sign Out */}
          <Card className="p-6">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
