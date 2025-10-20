import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import authLogo from "@/assets/logo.svg";

const usernameSchema = z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const [mode, setMode] = useState<"initial" | "login-username" | "login-password" | "signup-username" | "signup-password">("initial");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCheckUsername = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      usernameSchema.parse(username);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid username",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    // Do not query profiles here — it may not exist for older accounts.
    // Proceed directly to password entry and let sign-in handle validity.
    setMode("login-password");
  };

  const handleCheckSignupUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      usernameSchema.parse(username);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid username",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Check if username exists
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Username already exists
        toast({
          title: "Username taken",
          description: "This username is already taken. Please choose another or sign in instead.",
          variant: "destructive",
        });
      } else {
        // Username is available, go to password entry
        setMode("signup-password");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid password",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const email = `${username}@etheri.app`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid password",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const email = `${username}@etheri.app`;
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Welcome to Etheri.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-soft">
      <Card className="w-full max-w-md p-8 bg-card/95 backdrop-blur-sm border-2">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <img 
              src={authLogo} 
              alt="Etheri logo" 
              className="w-full h-full object-contain"
              style={{ filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(240deg) brightness(118%) contrast(119%)' }}
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">Etheri</h1>
          <p className="text-muted-foreground">
            {mode === "initial" && "Let's get started"}
            {mode === "login-username" && "Enter your username"}
            {mode === "login-password" && "Sign in to your account"}
            {mode === "signup-username" && "Choose your username"}
            {mode === "signup-password" && "Create your password"}
          </p>
        </div>

        {mode === "initial" && (
          <div className="space-y-4">
            <Button
              onClick={() => setMode("login-password")}
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
            <Button
              onClick={() => setMode("signup-username")}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Create Account
            </Button>
          </div>
        )}

        {mode === "login-username" && (
          <form onSubmit={handleCheckUsername} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="yourusername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMode("initial");
                  setUsername("");
                }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || !username}>
                Continue
              </Button>
            </div>
          </form>
        )}

        {mode === "login-password" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                type="text"
                placeholder="yourusername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMode("initial");
                  setPassword("");
                }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || !username || !password}>
                Sign In
              </Button>
            </div>
          </form>
        )}

        {mode === "signup-username" && (
          <form onSubmit={handleCheckSignupUsername} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMode("initial");
                  setUsername("");
                }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || !username}>
                Continue
              </Button>
            </div>
          </form>
        )}

        {mode === "signup-password" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Choose a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMode("signup-username");
                  setPassword("");
                }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || !password}>
                Create Account
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
