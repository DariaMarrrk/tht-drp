import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import adminAvatar from "@/assets/admin-avatar.png";

export const CleanupUsers = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUpAdmin, setIsSettingUpAdmin] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCleanup = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-users');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: data.message,
      });
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

  const handleSetupAdmin = async () => {
    if (!user) return;
    
    setIsSettingUpAdmin(true);
    try {
      // First, update the username to 'admin'
      const { error: functionError } = await supabase.functions.invoke('setup-admin');
      
      if (functionError) throw functionError;

      // Upload the admin avatar
      const response = await fetch(adminAvatar);
      const blob = await response.blob();
      const file = new File([blob], "admin-avatar.png", { type: "image/png" });

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}/avatar.png`, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${user.id}/avatar.png`);

      // Update the avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl } as any)
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Admin account setup complete! Please refresh the page.",
      });

      // Refresh the page after a short delay
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSettingUpAdmin(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Admin Tools</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Setup admin account (rename "account" to "admin" with custom avatar)
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full"
                disabled={isSettingUpAdmin}
              >
                <UserCog className="w-4 h-4 mr-2" />
                {isSettingUpAdmin ? "Setting up..." : "Setup Admin Account"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Setup Admin Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will rename the "account" user to "admin" and set a custom avatar. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSetupAdmin}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Remove all user accounts except the one with username "admin"
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isLoading ? "Cleaning up..." : "Cleanup Users"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all user accounts except the one with username "admin".
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanup}>
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
};
