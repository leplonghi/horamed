// Script para processar o CSV de medicamentos e gerar lista ordenada alfabeticamente
const fs = require('fs');
const path = require('path');

// Ler o CSV
const csvPath = path.join(__dirname, '..', 'src', 'data', 'medicamentos-brasileiros.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Processar linhas
const lines = csvContent.split('\n');
const headers = lines[0].split(';');

// Índices das colunas que precisamos
const NOME_PRODUTO_IDX = 1;
const TIPO_PRODUTO_IDX = 0;
const PRINCIPIO_ATIVO_IDX = 10;

// Set para evitar duplicatas
const medicamentosSet = new Map();

// Processar cada linha (pular header)
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  // Usar regex para fazer split considerando aspas
  const matches = line.match(/(".*?"|[^";]+)(?=\s*;|\s*$)/g);
  if (!matches || matches.length < 11) continue;
  
  const tipo = matches[TIPO_PRODUTO_IDX]?.replace(/"/g, '').trim();
  let nome = matches[NOME_PRODUTO_IDX]?.replace(/"/g, '').trim();
  let principioAtivo = matches[PRINCIPIO_ATIVO_IDX]?.replace(/"/g, '').trim();
  
  // Filtrar apenas medicamentos
  if (tipo !== 'MEDICAMENTO') continue;
  if (!nome || nome.length < 3) continue;
  
  // Limpar nome (remover espaços extras no início)
  nome = nome.replace(/^\s+/, '');
  
  // Normalizar nome
  const nomeKey = nome.toLowerCase();
  
  // Adicionar ao mapa (sobrescreve se já existe, mantendo o mais completo)
  if (!medicamentosSet.has(nomeKey) || 
      (principioAtivo && principioAtivo.length > (medicamentosSet.get(nomeKey)?.principioAtivo?.length || 0))) {
    medicamentosSet.set(nomeKey, {
      nome: nome,
      principioAtivo: principioAtivo || undefined,
      tipo: 'MEDICAMENTO'
    });
  }
}

// Converter para array e ordenar alfabeticamente
const medicamentos = Array.from(medicamentosSet.values())
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

console.log(`Total de medicamentos únicos: ${medicamentos.length}`);

// Gerar arquivo TypeScript
const tsContent = `// Lista completa de medicamentos brasileiros processada da base ANVISA
// Total: ${medicamentos.length} medicamentos únicos
// Gerado automaticamente - NÃO EDITAR MANUALMENTE

export interface MedicamentoBrasileiro {
  nome: string;
  principioAtivo?: string;
  tipo: string;
}

export const medicamentosBrasileiros: MedicamentoBrasileiro[] = ${JSON.stringify(medicamentos, null, 2)};
`;

// Salvar arquivo
const outputPath = path.join(__dirname, '..', 'src', 'data', 'medicamentos-brasileiros.ts');
fs.writeFileSync(outputPath, tsContent);

console.log(`Arquivo gerado: ${outputPath}`);
console.log('Primeiros 10 medicamentos:');
medicamentos.slice(0, 10).forEach(m => console.log(`  - ${m.nome}`));
