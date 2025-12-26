import { useState, useEffect, useCallback } from "react";
import { Search, Pill, FileText, Zap, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchResult {
  id: string;
  type: "medication" | "document" | "action";
  title: string;
  subtitle?: string;
  route: string;
}

interface SpotlightSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SpotlightSearch({ open, onOpenChange }: SpotlightSearchProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const QUICK_ACTIONS: SearchResult[] = [
    { id: "add-med", type: "action", title: t('search.addMedication'), route: "/adicionar-medicamento" },
    { id: "upload-doc", type: "action", title: t('search.uploadDocument'), route: "/cofre/upload" },
    { id: "view-stock", type: "action", title: t('search.viewStock'), route: "/estoque" },
    { id: "view-calendar", type: "action", title: t('search.viewCalendar'), route: "/agenda" },
    { id: "view-progress", type: "action", title: t('search.viewProgress'), route: "/progresso" },
    { id: "view-vaccines", type: "action", title: t('search.vaccineWallet'), route: "/vacinas" },
  ];

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(QUICK_ACTIONS.slice(0, 4));
      return;
    }

    setIsLoading(true);
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    try {
      // Search medications
      const { data: items } = await supabase
        .from("items")
        .select("id, name, dose_text")
        .ilike("name", `%${normalizedQuery}%`)
        .limit(5);

      items?.forEach(item => {
        searchResults.push({
          id: item.id,
          type: "medication",
          title: item.name,
          subtitle: item.dose_text || undefined,
          route: `/medicamentos`,
        });
      });

      // Search documents
      const { data: docs } = await supabase
        .from("documentos_saude")
        .select("id, title")
        .ilike("title", `%${normalizedQuery}%`)
        .limit(5);

      docs?.forEach(doc => {
        searchResults.push({
          id: doc.id,
          type: "document",
          title: doc.title || t('cofre.document'),
          route: `/cofre/${doc.id}`,
        });
      });

      // Filter quick actions
      const matchingActions = QUICK_ACTIONS.filter(action => 
        action.title.toLowerCase().includes(normalizedQuery)
      );

      setResults([...searchResults, ...matchingActions].slice(0, 8));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(QUICK_ACTIONS.slice(0, 4));
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    const debounce = setTimeout(() => search(query), 200);
    return () => clearTimeout(debounce);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    navigate(result.route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "medication": return Pill;
      case "document": return FileText;
      case "action": return Zap;
    }
  };

  const getIconColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "medication": return "text-primary bg-primary/10";
      case "document": return "text-blue-500 bg-blue-500/10";
      case "action": return "text-amber-500 bg-amber-500/10";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-base py-4"
            autoFocus
          />
          {query && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-8 w-8"
              onClick={() => setQuery("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('search.noResults')}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {results.map((result, index) => {
                const Icon = getIcon(result.type);
                const iconColor = getIconColor(result.type);
                
                return (
                  <motion.button
                    key={result.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                      index === selectedIndex 
                        ? "bg-primary/10 text-foreground" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconColor)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Keyboard hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">↑↓</kbd>
            {t('search.navigate')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">↵</kbd>
            {t('search.select')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px]">esc</kbd>
            {t('search.close')}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
