import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-background/98 group-[.toaster]:to-background/92 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/30 group-[.toaster]:shadow-[var(--shadow-glass)] group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success: "group-[.toaster]:border-success/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-success/10 group-[.toaster]:to-success/5",
          error: "group-[.toaster]:border-destructive/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-destructive/10 group-[.toaster]:to-destructive/5",
          warning: "group-[.toaster]:border-warning/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-warning/10 group-[.toaster]:to-warning/5",
          info: "group-[.toaster]:border-primary/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-primary/10 group-[.toaster]:to-primary/5",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
