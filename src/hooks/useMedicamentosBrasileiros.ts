import { useState, useEffect, useMemo } from 'react';

export interface MedicamentoBrasileiro {
  nome: string;
  principioAtivo?: string;
  categoria: string;
  empresa?: string;
  classeTerapeutica?: string;
}

export function useMedicamentosBrasileiros() {
  const [medicamentos, setMedicamentos] = useState<MedicamentoBrasileiro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMedicamentos = async () => {
      try {
        // Carregar o CSV
        const response = await fetch('/src/data/medicamentos-brasileiros.csv');
        const text = await response.text();
        
        // Processar linhas
        const lines = text.split('\n');
        const medicamentosMap = new Map<string, MedicamentoBrasileiro>();
        
        // Processar cada linha (pular header)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          // Split considerando aspas
          const parts = line.split(';');
          if (parts.length < 6) continue;
          
          const nome = parts[0]?.replace(/"/g, '').trim();
          const categoriaRegulatoria = parts[1]?.replace(/"/g, '').trim();
          const classeTerapeutica = parts[2]?.replace(/"/g, '').trim();
          const empresa = parts[3]?.replace(/"/g, '').trim();
          const situacaoRegistro = parts[4]?.replace(/"/g, '').trim();
          const principioAtivo = parts[5]?.replace(/"/g, '').trim();
          
          // Filtrar apenas medicamentos com registro VÁLIDO
          if (!situacaoRegistro || situacaoRegistro === 'CADUCO/CANCELADO') continue;
          if (!nome || nome.length < 3) continue;
          
          // Normalizar nome
          const nomeKey = nome.toLowerCase();
          
          // Mapear categoria regulatória para categoria do app
          let categoria = 'medicamento';
          if (categoriaRegulatoria.includes('FITOTER')) {
            categoria = 'fitoterapico';
          } else if (categoriaRegulatoria.includes('HOMEOP')) {
            categoria = 'homeopatico';
          } else if (categoriaRegulatoria.includes('VITAM') || categoriaRegulatoria.includes('SUPLEM')) {
            categoria = 'suplemento';
          }
          
          // Adicionar ao mapa (sobrescreve se já existe)
          if (!medicamentosMap.has(nomeKey)) {
            medicamentosMap.set(nomeKey, {
              nome: nome,
              principioAtivo: principioAtivo || undefined,
              categoria,
              empresa: empresa || undefined,
              classeTerapeutica: classeTerapeutica || undefined,
            });
          }
        }
        
        // Converter para array e ordenar alfabeticamente
        const sorted = Array.from(medicamentosMap.values())
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        
        setMedicamentos(sorted);
      } catch (error) {
        console.error('Erro ao carregar medicamentos:', error);
        // Fallback para lista vazia em caso de erro
        setMedicamentos([]);
      } finally {
        setLoading(false);
      }
    };

    loadMedicamentos();
  }, []);

  return { medicamentos, loading };
}

export function useFilteredMedicamentos(searchTerm: string, limit: number = 100) {
  const { medicamentos, loading } = useMedicamentosBrasileiros();

  const filtered = useMemo(() => {
    if (!searchTerm) return medicamentos.slice(0, limit);
    
    const search = searchTerm.toLowerCase();
    return medicamentos
      .filter(med => med.nome.toLowerCase().includes(search))
      .slice(0, limit);
  }, [medicamentos, searchTerm, limit]);

  return { medicamentos: filtered, loading };
}
