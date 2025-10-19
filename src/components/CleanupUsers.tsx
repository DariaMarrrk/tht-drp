import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const CleanupUsers = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleCleanup = async () => {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-users');

      if (error) throw error;

      toast({
        title: "Cleanup complete",
        description: data.message || `Deleted ${data.deleted} users`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cleanup users",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-2">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">User Cleanup</h3>
          <p className="text-sm text-muted-foreground">
            Remove all user accounts except the one with username "account"
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Cleaning up..." : "Cleanup Users"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all user accounts except the one with username "account".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCleanup} className="bg-destructive hover:bg-destructive/90">
                Delete Users
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};
