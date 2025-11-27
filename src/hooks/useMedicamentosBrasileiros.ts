import { useState, useEffect, useMemo } from 'react';
import { medicamentosBrasileiros } from '@/data/medicamentos-brasileiros';

export interface MedicamentoBrasileiro {
  nome: string;
  principioAtivo?: string;
  tipo: string;
}

export function useMedicamentosBrasileiros() {
  const [medicamentos, setMedicamentos] = useState<MedicamentoBrasileiro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      console.log('Carregando medicamentos da lista estática. Total disponível:', medicamentosBrasileiros.length);

      const medicamentosMap = new Map<string, MedicamentoBrasileiro>();

      medicamentosBrasileiros.forEach((med) => {
        const nome = med.nome?.trim();
        if (!nome || nome.length < 3) return;

        const nomeKey = nome.toLowerCase();

        if (!medicamentosMap.has(nomeKey)) {
          medicamentosMap.set(nomeKey, {
            nome,
            principioAtivo: med.principioAtivo,
            tipo: med.tipo,
          });
        }
      });

      const sorted = Array.from(medicamentosMap.values()).sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR')
      );

      console.log('Medicamentos únicos após deduplicação (lista estática):', sorted.length);
      console.log('Primeiros 10 medicamentos (lista estática):', sorted.slice(0, 10).map((m) => m.nome));

      setMedicamentos(sorted);
    } catch (error) {
      console.error('Erro ao carregar medicamentos estáticos:', error);
      setMedicamentos([]);
    } finally {
      setLoading(false);
    }
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
