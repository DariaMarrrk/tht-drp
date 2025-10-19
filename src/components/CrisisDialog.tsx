import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Heart, Phone } from "lucide-react";

interface CrisisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CrisisDialog = ({ open, onOpenChange }: CrisisDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl">
            We're here for you
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base space-y-4">
            <p className="text-foreground/90">
              Thank you for sharing. We want you to know that you're not alone, and there are people who care and want to help.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-left">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">988 Suicide & Crisis Lifeline</p>
                  <p className="text-sm text-muted-foreground">Call or text 988 (US) - Available 24/7</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Crisis Text Line</p>
                  <p className="text-sm text-muted-foreground">Text HOME to 741741 - Free, 24/7 support</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">International Support</p>
                  <p className="text-sm text-muted-foreground">
                    <a 
                      href="https://findahelpline.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      findahelpline.com
                    </a> - Global crisis resources
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Your thought has been saved. Please consider reaching out to someone you trust or a professional who can provide support.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="w-full">
            I understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
