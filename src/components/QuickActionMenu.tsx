import { Pill, FileText, Stethoscope, FlaskConical, Heart, Sparkles } from "lucide-react";
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
import { useState } from "react";
import QuickDocumentUpload from "./QuickDocumentUpload";
import { useLanguage } from "@/contexts/LanguageContext";

interface QuickActionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenClara?: () => void;
}

export default function QuickActionMenu({ open, onOpenChange, onOpenClara }: QuickActionMenuProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  const handleAskClara = () => {
    onOpenChange(false);
    window.dispatchEvent(new CustomEvent('openClara'));
  };

  const actions = [
    {
      icon: Pill,
      label: t('quickAction.medSupplement'),
      description: t('quickAction.addNewItem'),
      color: "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
      onClick: () => {
        onOpenChange(false);
        navigate("/adicionar-medicamento");
      },
    },
    {
      icon: FileText,
      label: t('quickAction.document'),
      description: t('quickAction.prescriptionExam'),
      color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20",
      onClick: () => {
        setShowDocumentUpload(true);
      },
    },
    {
      icon: Stethoscope,
      label: t('quickAction.appointment'),
      description: t('quickAction.scheduleOrRecord'),
      color: "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20",
      onClick: () => {
        onOpenChange(false);
        navigate("/saude/consultas");
      },
    },
    {
      icon: FlaskConical,
      label: t('quickAction.exam'),
      description: t('quickAction.examResult'),
      color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/20",
      onClick: () => {
        onOpenChange(false);
        navigate("/exames");
      },
    },
  ];

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="text-xl">{t('quickAction.whatToDo')}</DrawerTitle>
            <DrawerDescription>
              {t('quickAction.chooseOrAsk')}
            </DrawerDescription>
          </DrawerHeader>

          {/* Clara Wizard Option - Highlighted */}
          <div className="px-6 pb-4">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex items-center gap-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/30 hover:from-primary/10 hover:to-primary/20"
              onClick={handleAskClara}
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{t('quickAction.askClara')}</span>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('quickAction.claraGuides')}
                </p>
              </div>
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-6 pb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{t('quickAction.orChoose')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3 px-6 pb-4">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className={`h-24 flex flex-col gap-2 ${action.color}`}
                onClick={action.onClick}
              >
                <action.icon className="h-7 w-7" />
                <div className="text-center">
                  <span className="font-medium text-sm block">{action.label}</span>
                  <span className="text-[10px] text-muted-foreground">{action.description}</span>
                </div>
              </Button>
            ))}
          </div>

          <div className="p-4 pt-0">
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full text-muted-foreground">
                {t('common.cancel')}
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>

      <QuickDocumentUpload
        open={showDocumentUpload}
        onOpenChange={(open) => {
          setShowDocumentUpload(open);
          if (!open) onOpenChange(false);
        }}
      />
    </>
  );
}
