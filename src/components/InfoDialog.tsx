import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { Button } from "./ui/button";

interface InfoDialogProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  triggerClassName?: string;
}

export default function InfoDialog({ 
  title, 
  description, 
  children,
  triggerClassName 
}: InfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={triggerClassName || "h-6 w-6"}
        >
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        {children && (
          <div className="pt-4 space-y-3 text-sm text-muted-foreground">
            {children}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
