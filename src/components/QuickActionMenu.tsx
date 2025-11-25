import { Pill, FileText, Stethoscope, FlaskConical } from "lucide-react";
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

interface QuickActionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickActionMenu({ open, onOpenChange }: QuickActionMenuProps) {
  const navigate = useNavigate();
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  const actions = [
    {
      icon: Pill,
      label: "Remédio/Suplemento",
      color: "bg-primary/10 text-primary hover:bg-primary/20",
      onClick: () => {
        onOpenChange(false);
        navigate("/adicionar-medicamento");
      },
    },
    {
      icon: FileText,
      label: "Documento",
      color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
      onClick: () => {
        setShowDocumentUpload(true);
      },
    },
    {
      icon: Stethoscope,
      label: "Consulta",
      color: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
      onClick: () => {
        onOpenChange(false);
        navigate("/saude/consultas");
      },
    },
    {
      icon: FlaskConical,
      label: "Exame",
      color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
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
          <DrawerHeader>
            <DrawerTitle>O que deseja adicionar?</DrawerTitle>
            <DrawerDescription>
              Escolha uma das opções abaixo para começar
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid grid-cols-2 gap-4 p-6">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className={`h-28 flex flex-col gap-3 ${action.color}`}
                onClick={action.onClick}
              >
                <action.icon className="h-8 w-8" />
                <span className="font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
          <div className="p-4">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancelar
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
