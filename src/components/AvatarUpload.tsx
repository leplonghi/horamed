import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, User } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
  avatarUrl: string | null;
  userEmail: string;
  onUploadComplete: (url: string) => void;
}

export default function AvatarUpload({ avatarUrl, userEmail, onUploadComplete }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);

  // Fetch signed URL for display
  const fetchSignedUrl = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) throw error;
      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error fetching signed URL:', error);
      return null;
    }
  };

  // Update display URL when avatarUrl changes
  useEffect(() => {
    if (avatarUrl) {
      // Extract path from URL if it's a full URL, or use as-is if it's a path
      const path = avatarUrl.includes('/storage/v1/') 
        ? avatarUrl.split('/avatars/')[1] 
        : avatarUrl;
      
      if (path) {
        fetchSignedUrl(path).then(url => {
          if (url) setDisplayUrl(url);
        });
      }
    } else {
      setDisplayUrl(null);
    }
  }, [avatarUrl]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Não autenticado");

      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.includes('/storage/v1/') 
          ? avatarUrl.split('/avatars/')[1] 
          : avatarUrl;
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Update profile with file path (not public URL)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: fileName })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Fetch signed URL for immediate display
      const signedUrl = await fetchSignedUrl(fileName);
      if (signedUrl) {
        setDisplayUrl(signedUrl);
      }

      onUploadComplete(fileName);
      toast.success("Foto atualizada com sucesso!");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao fazer upload da foto");
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={displayUrl || undefined} alt="Avatar" />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {userEmail ? getInitials(userEmail) : <User className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>
        
        <label htmlFor="avatar-upload" className="absolute bottom-0 right-0">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full cursor-pointer"
            disabled={uploading}
            asChild
          >
            <span>
              <Camera className="h-4 w-4" />
            </span>
          </Button>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Clique no ícone da câmera para alterar sua foto
      </p>
    </div>
  );
}
