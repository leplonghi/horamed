import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  FileText, 
  FlaskConical, 
  Syringe, 
  Stethoscope, 
  FolderOpen,
  Edit,
  Share2,
  Eye,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  Download,
  Trash2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentoSaude } from "@/hooks/useCofre";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, differenceInDays, isAfter, isBefore, addDays } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface EnhancedDocumentCardProps {
  document: DocumentoSaude;
  index: number;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function EnhancedDocumentCard({ 
  document: doc, 
  index,
  onEdit,
  onShare,
  onDelete
}: EnhancedDocumentCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : enUS;
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const now = new Date();
  const in7Days = addDays(now, 7);
  const in30Days = addDays(now, 30);

  const isExpired = doc.expires_at && isBefore(new Date(doc.expires_at), now);
  const isExpiringUrgent = doc.expires_at && 
    isAfter(new Date(doc.expires_at), now) && 
    isBefore(new Date(doc.expires_at), in7Days);
  const isExpiringSoon = doc.expires_at && 
    isAfter(new Date(doc.expires_at), in7Days) && 
    isBefore(new Date(doc.expires_at), in30Days);
  const needsReview = doc.status_extraction === "pending_review";
  const isReviewed = doc.status_extraction === "reviewed";

  const daysUntilExpiry = doc.expires_at 
    ? differenceInDays(new Date(doc.expires_at), now) 
    : null;

  // Load thumbnail for images
  useEffect(() => {
    const loadThumbnail = async () => {
      if (doc.mime_type?.startsWith('image/')) {
        try {
          const { data } = await supabase.storage
            .from('cofre-saude')
            .createSignedUrl(doc.file_path, 3600);
          if (data?.signedUrl) {
            setThumbnailUrl(data.signedUrl);
          }
        } catch (e) {
          console.warn('Error loading thumbnail:', e);
        }
      }
    };
    loadThumbnail();
  }, [doc.file_path, doc.mime_type]);

  const getCategoryInfo = (slug?: string) => {
    switch (slug) {
      case "receita":
        return { 
          Icon: FileText, 
          emoji: "💊",
          label: language === 'pt' ? 'Receita' : 'Prescription',
          color: "text-blue-500", 
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          gradient: "from-blue-500/20 to-blue-600/10"
        };
      case "exame":
        return { 
          Icon: FlaskConical, 
          emoji: "🧪",
          label: language === 'pt' ? 'Exame' : 'Exam',
          color: "text-green-500", 
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          gradient: "from-green-500/20 to-green-600/10"
        };
      case "vacinacao":
        return { 
          Icon: Syringe, 
          emoji: "💉",
          label: language === 'pt' ? 'Vacina' : 'Vaccine',
          color: "text-purple-500", 
          bg: "bg-purple-500/10",
          border: "border-purple-500/30",
          gradient: "from-purple-500/20 to-purple-600/10"
        };
      case "consulta":
        return { 
          Icon: Stethoscope, 
          emoji: "🩺",
          label: language === 'pt' ? 'Consulta' : 'Consultation',
          color: "text-orange-500", 
          bg: "bg-orange-500/10",
          border: "border-orange-500/30",
          gradient: "from-orange-500/20 to-orange-600/10"
        };
      default:
        return { 
          Icon: FolderOpen, 
          emoji: "📋",
          label: language === 'pt' ? 'Documento' : 'Document',
          color: "text-gray-500", 
          bg: "bg-gray-500/10",
          border: "border-gray-500/30",
          gradient: "from-gray-500/20 to-gray-600/10"
        };
    }
  };

  const category = getCategoryInfo(doc.categorias_saude?.slug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Link to={`/carteira/${doc.id}`}>
        <div 
          className={`
            relative overflow-hidden rounded-2xl 
            bg-gradient-to-br ${category.gradient}
            border ${category.border} backdrop-blur-sm
            p-4 transition-all duration-300
            hover:shadow-lg hover:border-primary/40
          `}
        >
          {/* Status indicators */}
          <div className="absolute top-3 right-3 flex items-center gap-1">
            {isExpired && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                {language === 'pt' ? 'EXPIRADO' : 'EXPIRED'}
              </span>
            )}
            {isExpiringUrgent && !isExpired && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-destructive/90 text-destructive-foreground animate-pulse">
                {daysUntilExpiry}d
              </span>
            )}
            {isExpiringSoon && !isExpiringUrgent && !isExpired && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-warning/20 text-warning">
                {daysUntilExpiry}d
              </span>
            )}
            {needsReview && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/20 text-amber-600">
                <Eye className="h-3 w-3 inline mr-0.5" />
                {language === 'pt' ? 'Revisar' : 'Review'}
              </span>
            )}
            {isReviewed && (
              <CheckCircle2 className="h-4 w-4 text-success" />
            )}
          </div>

          {/* Quick actions (visible on hover) */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault();
                  navigate(`/carteira/${doc.id}`);
                }}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {language === 'pt' ? 'Abrir' : 'Open'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault();
                  onEdit?.(doc.id);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  {language === 'pt' ? 'Editar' : 'Edit'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault();
                  onShare?.(doc.id);
                }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {language === 'pt' ? 'Compartilhar' : 'Share'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete?.(doc.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === 'pt' ? 'Excluir' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex gap-4">
            {/* Thumbnail or Icon */}
            <div className={`
              w-16 h-16 rounded-xl overflow-hidden
              ${category.bg} ${category.border} border
              flex items-center justify-center flex-shrink-0
              transition-transform group-hover:scale-105
            `}>
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">{category.emoji}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-16">
              <h3 className="font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors">
                {doc.title || (language === 'pt' ? 'Sem título' : 'Untitled')}
              </h3>

              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                  ${category.bg} ${category.color}
                `}>
                  {category.emoji} {category.label}
                </span>
              </div>

              <div className="text-xs text-muted-foreground space-y-0.5">
                {doc.issued_at && (
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {format(new Date(doc.issued_at), "dd MMM yyyy", { locale: dateLocale })}
                  </p>
                )}
                {doc.provider && (
                  <p className="truncate">
                    🏥 {doc.provider}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar for expiration (only if expires_at exists and not expired) */}
          {doc.expires_at && !isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 90 && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {language === 'pt' ? 'Validade' : 'Validity'}
                </span>
                <span className={`font-medium ${
                  daysUntilExpiry <= 7 ? 'text-destructive' :
                  daysUntilExpiry <= 30 ? 'text-warning' : 'text-muted-foreground'
                }`}>
                  {daysUntilExpiry} {language === 'pt' ? 'dias restantes' : 'days left'}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, (daysUntilExpiry / 90) * 100))}%` }}
                  transition={{ delay: index * 0.03 + 0.2 }}
                  className={`h-full rounded-full ${
                    daysUntilExpiry <= 7 ? 'bg-destructive' :
                    daysUntilExpiry <= 30 ? 'bg-warning' : 'bg-success'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
