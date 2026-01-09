import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Building, Calendar, Loader2, Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

export interface ExtractedInfo {
  provider?: string;
  issuedAt?: string;
}

export interface FieldConfig {
  id: string;
  label: string;
  type: "text" | "date" | "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

interface ReviewScreenBaseProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  extractedInfo: ExtractedInfo;
  fields: FieldConfig[];
  onSave: () => Promise<void>;
  saveButtonLabel?: string;
  isSaveDisabled?: boolean;
  successRedirectPath?: string;
  backPath?: string;
  children?: ReactNode;
}

export default function ReviewScreenBase({
  title,
  subtitle,
  icon,
  extractedInfo,
  fields,
  onSave,
  saveButtonLabel,
  isSaveDisabled = false,
  backPath,
  children
}: ReviewScreenBaseProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [processing, setProcessing] = useState(false);
  
  const dateLocale = language === "pt" ? ptBR : enUS;
  const dateFormat = language === "pt" ? "d 'de' MMMM, yyyy" : "MMMM d, yyyy";

  const handleSubmit = async () => {
    setProcessing(true);
    try {
      await onSave();
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), dateFormat, { locale: dateLocale });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 p-4">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          {backPath && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(backPath)}
              className="shrink-0 h-9 w-9 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            {icon || (
              <div className="p-2 rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Extracted info display */}
        {(extractedInfo.provider || extractedInfo.issuedAt) && (
          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {language === "pt" ? "Informações Extraídas" : "Extracted Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {extractedInfo.provider && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{extractedInfo.provider}</span>
                </div>
              )}
              {extractedInfo.issuedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(extractedInfo.issuedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Custom content slot */}
        {children}

        {/* Form fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {language === "pt" ? "Revisar e Completar" : "Review and Complete"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.id}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="resize-none"
                    rows={3}
                  />
                ) : (
                  <Input
                    id={field.id}
                    type={field.type === "date" ? "date" : "text"}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save button */}
        <Button
          onClick={handleSubmit}
          disabled={processing || isSaveDisabled}
          className="w-full h-12 rounded-2xl gap-2 shadow-lg"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {language === "pt" ? "Salvando..." : "Saving..."}
            </>
          ) : (
            <>
              <Check className="h-5 w-5" />
              {saveButtonLabel || (language === "pt" ? "Salvar" : "Save")}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
