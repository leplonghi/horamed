import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Achievement } from "@/hooks/useAchievements";
import { Share2, Twitter, Facebook, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Props {
  achievement: Achievement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AchievementShareDialog({
  achievement,
  open,
  onOpenChange,
}: Props) {
  const [copied, setCopied] = useState(false);

  const shareText = `🎉 Acabei de desbloquear "${achievement.title}" no HoraMed! ${achievement.description}`;
  const shareUrl = window.location.origin;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      toast.success("Texto copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const handleDownloadBadge = () => {
    // Create a canvas to generate badge image
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 800);
    gradient.addColorStop(0, "#6366f1");
    gradient.addColorStop(1, "#8b5cf6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 800);

    // Badge circle
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(400, 300, 150, 0, Math.PI * 2);
    ctx.fill();

    // Icon
    ctx.font = "120px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(achievement.icon, 400, 300);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px Arial";
    ctx.fillText(achievement.title, 400, 520);

    // Description
    ctx.font = "32px Arial";
    ctx.fillText(achievement.description, 400, 580);

    // Level badge
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(300, 650, 200, 60);
    ctx.fillStyle = "#6366f1";
    ctx.font = "bold 28px Arial";
    ctx.fillText(achievement.level.toUpperCase(), 400, 685);

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `horamed-conquista-${achievement.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Badge baixado!");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Conquista
          </DialogTitle>
          <DialogDescription>
            Mostre sua conquista para seus amigos!
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="flex flex-col items-center gap-4 py-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
        >
          {/* Badge preview */}
          <div className="relative">
            <motion.div
              className="text-8xl"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [-5, 5, -5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {achievement.icon}
            </motion.div>
            <motion.div
              className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {achievement.level}
            </motion.div>
          </div>

          <div className="text-center space-y-1">
            <h3 className="font-bold text-xl">{achievement.title}</h3>
            <p className="text-sm text-muted-foreground">
              {achievement.description}
            </p>
          </div>
        </motion.div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleTwitterShare}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <Twitter className="h-4 w-4" />
            Compartilhar no Twitter
          </Button>

          <Button
            onClick={handleFacebookShare}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <Facebook className="h-4 w-4" />
            Compartilhar no Facebook
          </Button>

          <Button
            onClick={handleDownloadBadge}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <Download className="h-4 w-4" />
            Baixar Badge
          </Button>

          <Button
            onClick={handleCopyLink}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copiado!" : "Copiar Texto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
