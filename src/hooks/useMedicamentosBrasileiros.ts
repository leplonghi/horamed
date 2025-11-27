import { useState, useEffect, useMemo } from 'react';

export interface MedicamentoBrasileiro {
  nome: string;
  situacao: string;
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
        
        console.log('CSV carregado, tamanho:', text.length);
        
        // Processar linhas
        const lines = text.split('\n');
        const medicamentosMap = new Map<string, MedicamentoBrasileiro>();
        
        console.log('Total de linhas no CSV:', lines.length);
        
        let validCount = 0;
        
        // Processar cada linha (pular header)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          // Split por ponto e vírgula
          const parts = line.split(';');
          if (parts.length < 2) continue;
          
          const nome = parts[0]?.replace(/"/g, '').trim();
          const situacao = parts[1]?.replace(/"/g, '').trim();
          
          // Filtrar apenas medicamentos com registro VÁLIDO
          if (situacao !== 'VÁLIDO') continue;
          if (!nome || nome.length < 3) continue;
          
          validCount++;
          
          // Normalizar nome para evitar duplicatas
          const nomeKey = nome.toLowerCase();
          
          // Adicionar ao mapa (evita duplicatas)
          if (!medicamentosMap.has(nomeKey)) {
            medicamentosMap.set(nomeKey, {
              nome: nome,
              situacao: situacao
            });
          }
        }
        
        console.log('Medicamentos válidos encontrados:', validCount);
        console.log('Medicamentos únicos após deduplicação:', medicamentosMap.size);
        
        // Converter para array e ordenar alfabeticamente
        const sorted = Array.from(medicamentosMap.values())
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        
        console.log('Primeiros 10 medicamentos:', sorted.slice(0, 10).map(m => m.nome));
        
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
    console.log('Filtrando medicamentos. Total disponível:', medicamentos.length);
    console.log('Termo de busca:', searchTerm);
    
    if (!searchTerm || searchTerm.length < 1) return [];
    
    const search = searchTerm.toLowerCase().trim();
    const results = medicamentos
      .filter(med => {
        const nomeLower = med.nome.toLowerCase();
        // Match if starts with search term or contains it
        return nomeLower.startsWith(search) || nomeLower.includes(search);
      })
      .sort((a, b) => {
        // Prioritize results that start with the search term
        const aStarts = a.nome.toLowerCase().startsWith(search);
        const bStarts = b.nome.toLowerCase().startsWith(search);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      })
      .slice(0, limit);
      
    console.log('Resultados filtrados:', results.length);
    if (results.length > 0) {
      console.log('Primeiros resultados:', results.slice(0, 5).map(m => m.nome));
    }
    
    return results;
  }, [medicamentos, searchTerm, limit]);

  return { medicamentos: filtered, loading };
}
