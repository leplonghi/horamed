
# Plano: Atualizar Landing Page e FOMO com Novidades do App

## Resumo

Este plano atualiza a landing page e elementos FOMO (Fear Of Missing Out) para refletir as novas funcionalidades do HoraMed, incluindo:
- Controle por voz
- Desafios semanais e gamificação
- Leaderboard familiar
- Resumo semanal com IA (Clara)
- Preparação de consultas com IA
- Comparação de preços de farmácias
- Sistema de XP e conquistas

---

## Parte 1: Novas Funcionalidades a Destacar

### 1.1 Features Identificadas no App

| Feature | Componente | Tipo |
|---------|-----------|------|
| Controle por Voz | `VoiceControlButton.tsx` | Premium |
| Desafios Semanais | `WeeklyChallenges.tsx` | Gamificação |
| Leaderboard Familiar | `FamilyLeaderboard.tsx` | Premium |
| Resumo Semanal IA | `ClaraWeeklySummary.tsx` | Premium |
| Preparação de Consultas | `ClaraConsultationPrep.tsx` | Premium |
| Comparação de Farmácias | `PharmacyPriceCard.tsx` | Premium |
| Sistema XP | `XPSystem.tsx` | Gamificação |

### 1.2 Priorização para Landing Page

**Alta prioridade (destacar):**
1. Controle por voz - diferencial competitivo
2. Relatório para consultas - valor tangível para usuários
3. Comparação de preços de farmácias - economia real
4. Gamificação com XP e desafios - engajamento

**Média prioridade (mencionar):**
- Leaderboard familiar
- Resumo semanal com insights

---

## Parte 2: Alterações na Landing Page

### 2.1 Seção "Novidades" (New Features)

**Atual (3 features):**
1. Escaneie sua Receita
2. Clara, Sua Assistente IA
3. Onboarding em 2 Minutos

**Proposta (expandir para 6 features):**
1. Escaneie sua Receita (manter)
2. Clara, Sua Assistente IA (manter)
3. **Controle por Voz** (NOVO)
4. **Relatórios para Consultas** (NOVO)
5. **Compare Preços de Farmácias** (NOVO)
6. **Desafios e Conquistas** (NOVO)

### 2.2 Seção de Benefícios

Atualizar `benefit5` (Assistente Inteligente) para incluir menção ao controle por voz:
- PT: "Assistente com voz e IA"
- EN: "Voice & AI Assistant"

### 2.3 Novas Traduções Necessárias

```text
# Português
landing.newFeature4Title: 'Controle por Voz'
landing.newFeature4Desc: 'Navegue pelo app usando comandos de voz. Diga "adicionar medicamento" ou "quero ajuda" e pronto.'

landing.newFeature5Title: 'Relatório para Consultas'
landing.newFeature5Desc: 'Gere relatórios completos para levar ao médico com seu histórico de adesão e medicamentos.'

landing.newFeature6Title: 'Compare Preços'
landing.newFeature6Desc: 'Veja preços de medicamentos em diferentes farmácias e economize na hora de comprar.'

landing.newFeature7Title: 'Desafios e XP'
landing.newFeature7Desc: 'Ganhe pontos de experiência a cada dose tomada. Complete desafios semanais e suba de nível.'

# Inglês
landing.newFeature4Title: 'Voice Control'
landing.newFeature4Desc: 'Navigate the app using voice commands. Say "add medication" or "I need help" and you\'re done.'

landing.newFeature5Title: 'Consultation Reports'
landing.newFeature5Desc: 'Generate complete reports to take to your doctor with your adherence history and medications.'

landing.newFeature6Title: 'Compare Prices'
landing.newFeature6Desc: 'See medication prices at different pharmacies and save when buying.'

landing.newFeature7Title: 'Challenges & XP'
landing.newFeature7Desc: 'Earn experience points with each dose taken. Complete weekly challenges and level up.'
```

---

## Parte 3: Alterações no FOMO (PaywallDialog)

### 3.1 Atualizar Lista de Features Perdidas

**Arquivo:** `src/components/PaywallDialog.tsx`

**Atual:**
```typescript
[
  "Medicamentos ilimitados",
  "IA liberada sem limites",
  "Relatório mensal para consultas",
  "WhatsApp + Push + Alarme"
]
```

**Proposta:**
```typescript
[
  "Medicamentos ilimitados",
  "Clara IA sem limites + controle por voz",
  "Relatórios para o médico",
  "Desafios semanais e XP",
  "Comparação de preços de farmácias"
]
```

### 3.2 Atualizar Mensagens de FOMO por Feature

Adicionar novo case para `active_items`:
```typescript
case "active_items":
  return {
    title: "Você precisa de mais medicamentos",
    desc: "Usuários Premium gerenciam em média 5 medicamentos e ganham 2x mais XP com os desafios semanais.",
    stat: "5x",
    statLabel: "mais organização"
  };
```

---

## Parte 4: FOMO no Cancelamento

### 4.1 Atualizar SubscriptionManagement.tsx

**Arquivo:** `src/pages/SubscriptionManagement.tsx`

Atualizar a lista de "Você perderá acesso a:" no step 'fomo':

**Atual:**
```text
• Medicamentos ilimitados
• OCR de receitas médicas
• Assistente de saúde com IA
• Relatórios mensais detalhados
```

**Proposta:**
```text
• Medicamentos ilimitados
• Clara IA + controle por voz
• OCR de receitas médicas
• Desafios semanais e sistema de XP
• Comparação de preços de farmácias
• Relatórios para consultas
```

### 4.2 Adicionar Estatística de Gamificação

No card de estatística, adicionar referência ao XP:
```text
"Você já ganhou X pontos de XP e completou Y desafios. Perderia todo esse progresso."
```

---

## Parte 5: Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/contexts/LanguageContext.tsx` | Adicionar 8 novas chaves de tradução (PT + EN) |
| `src/pages/Landing.tsx` | Expandir array `newFeatures` de 3 para 6+ items |
| `src/components/PaywallDialog.tsx` | Atualizar lista de features e stats |
| `src/pages/SubscriptionManagement.tsx` | Atualizar lista no dialog de cancelamento |

---

## Parte 6: Layout Proposto

### 6.1 Seção New Features (Grid 2x3)

```text
┌─────────────────────┬─────────────────────┐
│  📸 Escaneie        │  🎙️ Controle por   │
│  Receitas           │  Voz                │
├─────────────────────┼─────────────────────┤
│  💬 Clara IA        │  📋 Relatórios      │
│                     │  para Consultas     │
├─────────────────────┼─────────────────────┤
│  💊 Compare         │  🏆 Desafios        │
│  Preços             │  e XP               │
└─────────────────────┴─────────────────────┘
```

### 6.2 Ícones Propostos (Lucide)

- Controle por Voz: `Mic`
- Relatórios: `FileText` ou `ClipboardList`
- Compare Preços: `DollarSign` ou `TrendingDown`
- Desafios/XP: `Trophy` ou `Target`

---

## Seção Técnica

### Novas Importações em Landing.tsx

```typescript
import { 
  // existentes...
  Mic,
  Trophy,
  DollarSign,
  ClipboardList
} from "lucide-react";
```

### Estrutura do Array newFeatures

```typescript
const newFeatures = [
  {
    icon: Camera,
    title: t('landing.newFeature1Title'),
    description: t('landing.newFeature1Desc')
  },
  {
    icon: MessageCircle,
    title: t('landing.newFeature2Title'),
    description: t('landing.newFeature2Desc')
  },
  {
    icon: Mic,
    title: t('landing.newFeature4Title'),
    description: t('landing.newFeature4Desc')
  },
  {
    icon: ClipboardList,
    title: t('landing.newFeature5Title'),
    description: t('landing.newFeature5Desc')
  },
  {
    icon: DollarSign,
    title: t('landing.newFeature6Title'),
    description: t('landing.newFeature6Desc')
  },
  {
    icon: Trophy,
    title: t('landing.newFeature7Title'),
    description: t('landing.newFeature7Desc')
  }
];
```

### Grid Responsivo Atualizado

Alterar de `md:grid-cols-3` para grid 2x3:
```tsx
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## Resultados Esperados

1. **Landing mais completa**: Visitantes verão mais valor no produto
2. **FOMO mais efetivo**: Usuários free entenderão melhor o que estão perdendo
3. **Cancelamentos reduzidos**: Lista expandida de features aumenta percepção de perda
4. **Consistência**: Todas as traduções PT/EN sincronizadas

---

## Ordem de Implementação

1. Adicionar traduções em `LanguageContext.tsx`
2. Atualizar `Landing.tsx` com novas features
3. Atualizar `PaywallDialog.tsx` com novo FOMO
4. Atualizar `SubscriptionManagement.tsx` com lista expandida
