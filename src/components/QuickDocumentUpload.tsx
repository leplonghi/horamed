import { Camera, Upload, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuickDocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickDocumentUpload({ open, onOpenChange }: QuickDocumentUploadProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const options = [
    {
      icon: Camera,
      label: t('docUpload.takePhoto'),
      description: t('docUpload.photoDesc'),
      onClick: () => {
        onOpenChange(false);
        navigate("/scan");
      },
    },
    {
      icon: Upload,
      label: t('docUpload.uploadFile'),
      description: t('docUpload.fileTypes'),
      onClick: () => {
        onOpenChange(false);
        navigate("/carteira/upload");
      },
    },
    {
      icon: Edit,
      label: t('docUpload.fillManually'),
      description: t('docUpload.noFile'),
      onClick: () => {
        onOpenChange(false);
        navigate("/carteira/criar-manual");
      },
    },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('docUpload.title')}</DrawerTitle>
          <DrawerDescription>
            {t('docUpload.howToAdd')}
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 p-6">
          {options.map((option) => (
            <Button
              key={option.label}
              variant="outline"
              className="w-full h-auto py-4 flex items-start gap-4 hover:bg-accent"
              onClick={option.onClick}
            >
              <option.icon className="h-6 w-6 mt-1" />
              <div className="flex-1 text-left">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
        <div className="p-4">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              {t('common.cancel')}
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
