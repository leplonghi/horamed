
# Plano de Correção: Textos Quebrados (Hardcoded sem Tradução)

## Diagnóstico do Problema

A análise do código revelou que existem **textos em português hardcoded** em vários componentes, que não estão utilizando o sistema de tradução centralizado (`t()` do LanguageContext). Isso causa:

1. **Textos misturados** entre PT e EN quando o idioma é alterado
2. **Inconsistência visual** quando textos não traduzidos aparecem junto com textos traduzidos
3. **Experiência de usuário fragmentada** para usuários de língua inglesa

### Componentes Afetados Identificados

| Componente | Textos Hardcoded |
|------------|------------------|
| `VoiceControlButton.tsx` | "Ouvindo... Toque para parar", "Dose marcada como tomada", "Dose pulada", "Comando não reconhecido" |
| `VoiceInputField.tsx` | "Ouvindo...", placeholder "Digite ou fale..." |
| `SubscriptionBadge.tsx` | "Trial", "Expirado", "Premium" |
| `AvatarUpload.tsx` | "Erro ao fazer upload da foto" |
| `HealthInsights.tsx` | "Erro ao executar análise" |
| `NotificationSetupWizard.tsx` | Múltiplas mensagens de erro em PT |
| `MedicalAppointments.tsx` | Múltiplas mensagens de erro em PT |
| `MyDoses.tsx` | Mensagens de erro em PT |
| `WeightBMICard.tsx` | "Todos os registros" |
| `MedicationQuickAddCard.tsx` | "Todos os remédios já foram adicionados" |

---

## Solução Proposta

### Fase 1: Adicionar chaves de tradução faltantes ao LanguageContext

Adicionar as seguintes chaves em `src/contexts/LanguageContext.tsx`:

```typescript
// Voice Control
'voice.listening': 'Ouvindo...' / 'Listening...'
'voice.listeningTapToStop': 'Ouvindo... Toque para parar' / 'Listening... Tap to stop'
'voice.doseMarked': 'Dose marcada como tomada' / 'Dose marked as taken'
'voice.doseSkipped': 'Dose pulada' / 'Dose skipped'
'voice.commandNotRecognized': 'Comando não reconhecido' / 'Command not recognized'
'voice.typeOrSpeak': 'Digite ou fale...' / 'Type or speak...'

// Subscription
'subscription.trial': 'Trial' / 'Trial'
'subscription.expired': 'Expirado' / 'Expired'
'subscription.premium': 'Premium' / 'Premium'

// Errors (genéricos)
'error.uploadPhoto': 'Erro ao fazer upload da foto' / 'Error uploading photo'
'error.runningAnalysis': 'Erro ao executar análise' / 'Error running analysis'
'error.savingData': 'Erro ao salvar' / 'Error saving'
'error.loadingData': 'Erro ao carregar' / 'Error loading'
'error.generic': 'Ocorreu um erro' / 'An error occurred'

// Weight/BMI
'weight.allRecords': 'Todos os registros' / 'All records'

// Medication Quick Add
'medication.allAdded': 'Todos os remédios já foram adicionados' / 'All medications have been added'
```

### Fase 2: Atualizar os componentes para usar traduções

#### 2.1 VoiceControlButton.tsx
- Linha 66: `toast.success('Dose marcada como tomada')` → `toast.success(t('voice.doseMarked'))`
- Linha 70: `toast.info('Dose pulada')` → `toast.info(t('voice.doseSkipped'))`
- Linha 87: `toast.error('Comando não reconhecido')` → `toast.error(t('voice.commandNotRecognized'))`
- Linha 212: `'Ouvindo... Toque para parar'` → `{t('voice.listeningTapToStop')}`

#### 2.2 VoiceInputField.tsx
- Linha 24: `placeholder = 'Digite ou fale...'` → receber `placeholder` via prop traduzida ou usar `t('voice.typeOrSpeak')`
- Linha 127: `'Ouvindo...'` → `{t('voice.listening')}`

#### 2.3 SubscriptionBadge.tsx
- Linha 25: `Trial {trialDaysLeft}d` → `{t('subscription.trial')} {trialDaysLeft}d`
- Linha 46: `'Expirado'` → `{t('subscription.expired')}`
- Linha 58: `'Premium'` → `{t('subscription.premium')}`

#### 2.4 Componentes com mensagens de erro
Atualizar todos os `toast.error()` com strings hardcoded para usar o sistema de tradução.

---

## Detalhes Técnicos

### Arquivos a serem modificados:

1. **`src/contexts/LanguageContext.tsx`**
   - Adicionar ~20 novas chaves de tradução (PT e EN)

2. **`src/components/VoiceControlButton.tsx`**
   - Importar `useLanguage`
   - Substituir 4 textos hardcoded

3. **`src/components/VoiceInputField.tsx`**
   - Importar `useLanguage`
   - Substituir 2 textos hardcoded

4. **`src/components/SubscriptionBadge.tsx`**
   - Importar `useLanguage`
   - Substituir 3 textos hardcoded

5. **`src/components/AvatarUpload.tsx`**
   - Substituir mensagem de erro

6. **`src/components/HealthInsights.tsx`**
   - Substituir mensagem de erro

7. **`src/components/WeightBMICard.tsx`**
   - Substituir "Todos os registros"

8. **`src/components/MedicationQuickAddCard.tsx`**
   - Substituir textos de sucesso

9. **`src/pages/MyDoses.tsx`**
   - Substituir mensagens de erro

10. **`src/pages/MedicalAppointments.tsx`**
    - Substituir mensagens de erro

11. **`src/components/NotificationSetupWizard.tsx`**
    - Substituir mensagens de status/erro

---

## Benefícios

1. **Experiência consistente** - Todos os textos respeitam o idioma selecionado
2. **Manutenção centralizada** - Todas as strings em um único arquivo
3. **Suporte a novos idiomas** - Facilita adicionar espanhol, francês, etc.
4. **Elderly-first** - Textos claros e consistentes para usuários idosos

---

## Estimativa de Esforço

- **Fase 1 (LanguageContext)**: 1 alteração
- **Fase 2 (Componentes)**: 10-12 alterações
- **Total de arquivos**: ~12 arquivos
- **Tempo estimado**: Uma única sessão de implementação
