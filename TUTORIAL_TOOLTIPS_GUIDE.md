# Guia de Tooltips e Tutoriais do HoraMed

## Visão Geral
Sistema completo de hints e tooltips para melhorar a UX, especialmente para usuários idosos.

## Componentes Disponíveis

### 1. TutorialHint
**Uso:** Cards dismissíveis que aparecem uma vez por usuário
**Localização:** `src/components/TutorialHint.tsx`

```tsx
<TutorialHint
  id="unique_page_id"
  title="Título da dica 🎯"
  message="Mensagem explicativa detalhada"
  placement="top" // ou "bottom"
/>
```

### 2. HelpTooltip
**Uso:** Tooltips inline com ícone de ajuda
**Localização:** `src/components/HelpTooltip.tsx`

```tsx
<HelpTooltip
  content="Explicação curta e direta"
  side="top" // "top" | "bottom" | "left" | "right"
/>
```

### 3. OnboardingTour
**Uso:** Tour guiado completo para novos usuários
**Localização:** `src/components/OnboardingTour.tsx`

## Páginas com Tutoriais Implementados

### ✅ Hoje (/hoje)
- **ID:** `today_page`
- **Foco:** Ações rápidas (✓, ⏰, →), progresso diário, streaks
- **InfoDialog:** Explicação de streak e progresso

### ✅ Rotina (/rotina)
- **ID:** `rotina_page`
- **Foco:** Adicionar medicamentos, uso de câmera OCR

### ✅ Progresso (/progresso)
- **ID:** `progress_page`
- **Foco:** Streak, taxa de compromisso, XP e conquistas

### ✅ Carteira de Saúde (/cofre)
- **ID:** `cofre_page`
- **Foco:** Guardar documentos, OCR automático, compartilhamento

### ✅ Conquistas (/conquistas)
- **ID:** `achievements_page`
- **Foco:** Sistema de medalhas, XP, níveis, compartilhamento social

### ✅ Estoque (/estoque)
- **ID:** `stock_page`
- **Foco:** Projeções automáticas, alertas, links de reposição

### ✅ Perfil (/perfil)
- **ID:** `profile_page`
- **Foco:** Gerenciar conta, perfis de família, cuidadores, Premium

## Páginas que PRECISAM de Tutoriais

### 🔴 Prioridade Alta

1. **Medicamentos (/medications)**
   - ID sugerido: `medications_list_page`
   - Foco: Gerenciar lista completa, editar, excluir, ver detalhes de estoque
   - HelpTooltips: badges de status de estoque, origem da prescrição

2. **Adicionar Medicamento (/adicionar-medicamento)**
   - ID sugerido: `add_medication_wizard`
   - Foco: Wizard de 3 passos, presets de horários
   - HelpTooltips: campos de dose, frequência, duração, com/sem alimento

3. **Carteira de Vacinação (/carteira-vacina)**
   - ID sugerido: `vaccine_card_page`
   - Foco: Vacinas adulto vs infantil, lembretes automáticos
   - HelpTooltips: próxima dose, lote, fabricante

4. **My Doses (/minhas-doses)**
   - ID sugerido: `my_doses_page`
   - Foco: Histórico completo de doses, filtros por status
   - HelpTooltips: status de dose (tomada, perdida, pulada, atrasada)

### 🟡 Prioridade Média

5. **Modo Viagem (/viagem)**
   - ID sugerido: `travel_mode_page`
   - Foco: Ajuste automático de fuso horário, lista de bagagem
   - HelpTooltips: cálculo de quantidades, GPS

6. **Diário de Efeitos Colaterais (/diario-efeitos)**
   - ID sugerido: `side_effects_diary_page`
   - Foco: Registro rápido pós-dose, escalas 1-5, tags
   - HelpTooltips: correlação com medicamentos, gráficos para médicos

7. **Calendário Semanal (/calendario-semanal)**
   - ID sugerido: `weekly_calendar_page`
   - Foco: Visualização semanal, navegação entre semanas

8. **Análise de Saúde (/analise-saude)**
   - ID sugerido: `health_analysis_page`
   - Foco: Insights preditivos, padrões de adesão
   - HelpTooltips: como funciona a análise preditiva

### 🟢 Prioridade Baixa

9. **Configurações de Notificação (/configuracoes-notificacao)**
   - ID sugerido: `notification_settings_page`
   - Foco: Horários silenciosos, tipos de notificação, canais

10. **Planos (/planos)**
    - ID sugerido: `plans_page`
    - Foco: Recursos Premium vs Free, trial, preços

## Diretrizes de Conteúdo

### Para Idosos (Persona Principal)
1. **Linguagem simples:** Evite jargões técnicos
2. **Emojis contextuais:** Use emojis que reforcem o significado
3. **Instruções passo-a-passo:** Máximo 3 passos
4. **Explicação do VALOR:** "Isso ajuda você a..." ao invés de "Este recurso permite..."
5. **Ações claras:** "Toque em ✓", não "Clique no botão de confirmação"

### Boas Práticas
- **Título:** 4-8 palavras + emoji relevante
- **Mensagem:** 1-3 frases curtas, máximo 120 caracteres
- **ID único:** `page_name_specific_context` (snake_case)
- **Posicionamento:** `top` para hints acima do conteúdo, `bottom` para rodapés

## HelpTooltips Sugeridos para Componentes

### DoseCard
```tsx
<HelpTooltip content="Toque em ✓ para marcar como tomada, ⏰ para adiar 15min" />
```

### StockBadge
```tsx
<HelpTooltip content="Calculamos automaticamente quanto tempo seu medicamento vai durar" />
```

### AdherenceChart
```tsx
<HelpTooltip content="Acima de 80% é excelente! Continue assim!" />
```

### PrescriptionStatusBadge
```tsx
<HelpTooltip content="Receitas expiradas precisam ser renovadas com seu médico" />
```

## Implementação Técnica

### Adicionar TutorialHint em uma Página
```tsx
import TutorialHint from "@/components/TutorialHint";

// Dentro do componente, após o header/title
<TutorialHint
  id="page_unique_id"
  title="Título da Dica 🎯"
  message="Explicação clara e objetiva"
/>
```

### Adicionar HelpTooltip Inline
```tsx
import HelpTooltip from "@/components/HelpTooltip";

// Ao lado de labels ou campos complexos
<Label>
  Projeção de Estoque
  <HelpTooltip content="Baseado no seu uso real dos últimos 30 dias" />
</Label>
```

## Estados Persistidos
- Os tutoriais são salvos em `profiles.tutorial_flags` como JSON
- Cada hint só aparece uma vez por usuário
- Formato: `{ "page_id": true }` (true = já visto/dismissado)

## Métricas de Sucesso
- Redução em taxa de bounce em páginas-chave
- Aumento em D1/D7 retention
- Feedback positivo em pesquisas de UX
- Redução em solicitações de suporte

## Próximos Passos
1. Implementar hints nas páginas de prioridade alta
2. Adicionar HelpTooltips inline em componentes complexos
3. A/B test de conteúdo dos hints
4. Criar tour interativo para feature de Modo Viagem
5. Localização para outros idiomas (se necessário)

---
**Última atualização:** 2024
**Responsável:** Equipe de Produto HoraMed
