# Guia de Upload de Documentos - HoraMend

## Formatos Suportados

### ✅ Formatos Aceitos

#### Imagens
- **JPEG/JPG** - Recomendado para fotos de receitas
- **PNG** - Ótimo para capturas de tela
- **WEBP** - Formato moderno, alta qualidade

#### PDFs
- **PDF de 1 página** - Apenas a primeira página será processada
- Tamanho máximo: **10MB**
- Resolução mínima recomendada: **300 DPI**

### ❌ Limitações

- **PDFs multipáginas**: Envie apenas a primeira página da receita
- **PDFs protegidos**: Remova a senha antes de enviar
- **Arquivos corrompidos**: Verifique a integridade do arquivo
- **Imagens de baixa qualidade**: Use boa iluminação e foco adequado

## Requisitos para Melhor Extração

### Receitas Médicas

Para obter os melhores resultados na extração automática de receitas:

1. **Iluminação adequada**
   - Evite sombras e reflexos
   - Use luz natural ou luz branca uniforme
   - Não use flash direto

2. **Foco e nitidez**
   - Mantenha o celular estável
   - Aguarde o foco automático
   - Evite fotos tremidas ou borradas

3. **Enquadramento**
   - Capture todo o documento
   - Deixe uma pequena margem ao redor
   - Mantenha o documento plano (sem dobras)
   - Alinhe o documento com a câmera (evite ângulos)

4. **Qualidade do documento**
   - Documentos impressos são melhores que manuscritos
   - Texto legível e com bom contraste
   - Evite documentos muito desbotados ou manchados

### Campos Extraídos Automaticamente

A IA extrai os seguintes dados de receitas médicas:

#### Informações do Médico
- Nome completo do médico prescritor
- CRM com UF (ex: CRM 12345/SP)
- Nome da clínica/hospital (se disponível)

#### Informações do Paciente
- Nome completo do paciente
- Data de nascimento (se disponível)

#### Dados da Receita
- Data de emissão
- Data de validade (calculada automaticamente se não especificada)

#### Medicamentos Prescritos
Para cada medicamento:
- Nome comercial
- Princípio ativo (genérico)
- Dosagem completa (ex: 500mg)
- Forma farmacêutica (comprimido, cápsula, xarope, etc)
- Posologia (frequência de uso)
- Duração do tratamento em dias
- Instruções específicas (tomar com água, em jejum, etc)

#### Instruções Gerais
- Observações do médico
- Orientações especiais

## Processo de Extração

1. **Upload do documento**
   - Selecione arquivo (imagem ou PDF)
   - PDFs são automaticamente convertidos para imagem de alta qualidade
   - Validação de formato e tamanho

2. **Processamento com IA**
   - Análise da primeira página
   - Extração de texto via OCR
   - Identificação de campos estruturados
   - Cálculo de confiança da extração

3. **Revisão dos dados**
   - Visualize os dados extraídos
   - Campos com baixa confiança são destacados em amarelo
   - Edite e corrija conforme necessário
   - Confirme quando estiver satisfeito

4. **Salvamento**
   - Dados são salvos no seu cofre de saúde
   - Medicamentos são adicionados automaticamente (para receitas)
   - Documento original é armazenado de forma segura

## Confiança da Extração

O sistema calcula um score de confiança baseado em:

- **≥ 70%**: Boa confiança - revise e confirme
- **< 70%**: Baixa confiança - revise cuidadosamente todos os campos
- **< 50%**: Extração falhou - verifique a qualidade do documento

### Campos com Baixa Confiança

Campos destacados em amarelo indicam:
- Valor não foi encontrado no documento
- Confiança geral da extração está baixa
- Requer atenção especial durante revisão

**⚠️ SEMPRE revise campos obrigatórios:**
- Nome do médico
- Nome do paciente
- Data de emissão
- Medicamentos prescritos

## Solução de Problemas

### "Erro ao extrair dados"

**Possíveis causas:**
- Documento ilegível ou de baixa qualidade
- PDF multipáginas
- Formato não suportado
- Arquivo corrompido

**Soluções:**
1. Tire uma nova foto com melhor iluminação
2. Use scanner para criar PDF de alta qualidade
3. Converta PDF para imagem antes de enviar
4. Verifique se o arquivo não está protegido

### "PDF tem múltiplas páginas"

**Solução:**
- Extraia apenas a primeira página do PDF
- Use ferramentas online para separar páginas
- Ou tire foto apenas da página com a receita

### "Confiança baixa na extração"

**Solução:**
1. Revise TODOS os campos cuidadosamente
2. Corrija informações incorretas
3. Preencha campos vazios manualmente
4. Se muitos erros, considere tirar nova foto

### "Medicamento não encontrado"

**Solução:**
- Verifique se o medicamento está claramente visível
- Confirme que a letra está legível
- Adicione manualmente se necessário
- Use o campo de busca para encontrar o nome correto

## Dicas para Melhores Resultados

✅ **Faça:**
- Use boa iluminação natural
- Mantenha o celular estável
- Capture o documento completo
- Aguarde o foco automático
- Revise os dados extraídos

❌ **Evite:**
- Fotos com sombras ou reflexos
- Ângulos muito inclinados
- Flash direto no documento
- Documentos amassados ou dobrados
- Fotos tremidas ou borradas

## Segurança e Privacidade

- Todos os documentos são criptografados
- Apenas você tem acesso aos seus dados
- Imagens são processadas de forma segura
- Nenhuma informação é compartilhada sem sua autorização
- Logs de extração são salvos para melhorar o sistema

## Métricas de Qualidade

O sistema monitora:
- Taxa de sucesso por tipo de arquivo
- Confiança média das extrações
- Tempo de processamento
- Tipos de erros mais comuns

Essas métricas nos ajudam a melhorar continuamente o serviço.

---

**Precisa de ajuda?** Entre em contato pelo suporte dentro do aplicativo.
