# Sistema de Ações Rápidas para Doses - HoraMend

## 📋 Visão Geral

Este documento descreve o sistema de ações rápidas implementado no HoraMend para reduzir o atrito na interação diária do usuário ao marcar doses como tomadas.

## 🎯 Objetivos Alcançados

### 1. Ações Diretas em Notificações ✅
- ✅ Notificações incluem botões "✓ Tomei" e "⏰ Mais tarde"
- ✅ Usuário pode marcar dose diretamente da notificação sem abrir o app
- ✅ Suporte para Android (action buttons) e iOS (rich notifications)
- ✅ Feedback imediato após cada ação

### 2. Widget Rápido ✅
- ✅ Componente `QuickDoseWidget` exibe próxima dose nas próximas 2 horas
- ✅ Botão "✓ Tomei agora" para marcar dose com um clique
- ✅ Exibe "Sem doses pendentes" quando não há doses próximas
- ✅ Atualiza automaticamente a cada minuto

### 3. Redirecionamento Inteligente ✅
- ✅ Hook `useSmartRedirect` detecta doses pendentes
- ✅ Redireciona automaticamente para `/hoje` se há dose nos próximos 30min
- ✅ Evita navegação manual desnecessária

### 4. Sugestões Adaptativas ✅
- ✅ Hook `useAdaptiveSuggestions` analisa comportamento do usuário
- ✅ Detecta atrasos consistentes e sugere ajuste de horário
- ✅ Identifica esquecimentos frequentes e oferece lembretes extras
- ✅ Celebra streaks de 7+ dias seguidos

### 5. Feedback Motivacional ✅
- ✅ Mensagens personalizadas para cada ação
- ✅ Celebração de streaks e metas
- ✅ Emojis e animações visuais
- ✅ Feedback imediato via toast

## 🏗️ Arquitetura

### Backend (Edge Functions)

#### `handle-dose-action`
**Caminho:** `supabase/functions/handle-dose-action/index.ts`

**Função:** Processa ações de dose enviadas de notificações ou widgets

**Ações Suportadas:**
- `taken`: Marca dose como tomada, atualiza estoque, calcula streak
- `snooze`: Adia dose por 15 minutos

**Resposta:**
```json
{
  "success": true,
  "message": "✅ [Nome do medicamento] tomado!",
  "streak": 5,
  "medicationName": "Losartana"
}
```

**Configuração:**
```toml
[functions.handle-dose-action]
verify_jwt = false  # Permite chamadas de notificações
```

#### `send-dose-notification` (Atualizado)
**Modificação:** Agora inclui `actions` no payload da notificação

```typescript
actions: [
  {
    action: 'taken',
    title: '✓ Tomei',
    icon: 'check_circle',
  },
  {
    action: 'snooze',
    title: '⏰ Mais tarde',
    icon: 'schedule',
  },
]
```

### Frontend

#### Componentes

##### `QuickDoseWidget`
**Caminho:** `src/components/QuickDoseWidget.tsx`

**Props:**
```typescript
interface Props {
  className?: string;
}
```

**Funcionalidades:**
- Carrega próxima dose nas próximas 2 horas
- Atualiza a cada minuto
- Botão de ação rápida "✓ Tomei agora"
- Feedback visual quando não há doses

**Integração:**
```tsx
import QuickDoseWidget from '@/components/QuickDoseWidget';

<QuickDoseWidget className="mb-4" />
```

#### Hooks

##### `useSmartRedirect`
**Caminho:** `src/hooks/useSmartRedirect.ts`

**Função:** Redireciona automaticamente para `/hoje` quando há dose pendente

**Lógica:**
1. Verifica se há doses nos próximos 30 minutos ou atrasadas
2. Ignora se já está em `/hoje` ou `/medicamentos`
3. Redireciona com `navigate('/hoje', { replace: true })`

**Uso:**
```tsx
import { useSmartRedirect } from '@/hooks/useSmartRedirect';

export default function MyPage() {
  useSmartRedirect(); // Chama no início do componente
  
  // ... resto do código
}
```

##### `useAdaptiveSuggestions`
**Caminho:** `src/hooks/useAdaptiveSuggestions.ts`

**Função:** Gera sugestões baseadas no comportamento do usuário

**Tipos de Sugestão:**
```typescript
type SuggestionType = 
  | 'reschedule'      // Atrasos consistentes
  | 'extra_reminder'  // Esquecimentos frequentes
  | 'streak_motivation' // Celebração de streaks
```

**Retorno:**
```typescript
{
  suggestions: [
    {
      type: 'reschedule',
      message: 'Você costuma tomar Losartana com 2h de atraso. Quer ajustar o horário?',
      itemId: 'uuid-item',
      itemName: 'Losartana',
      suggestedTime: '08:00'
    }
  ]
}
```

**Uso:**
```tsx
import { useAdaptiveSuggestions } from '@/hooks/useAdaptiveSuggestions';

export default function MyPage() {
  const { suggestions } = useAdaptiveSuggestions();
  
  return (
    <>
      {suggestions.map((s, idx) => (
        <Alert key={idx}>
          <AlertDescription>{s.message}</AlertDescription>
        </Alert>
      ))}
    </>
  );
}
```

##### `usePushNotifications` (Atualizado)
**Caminho:** `src/hooks/usePushNotifications.ts`

**Modificação:** Agora processa ações de notificação

**Handler de Ações:**
```typescript
PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
  const actionId = action.actionId;
  const doseId = action.notification.data?.doseId;

  if (actionId === 'taken' && doseId) {
    // Chama handle-dose-action
    await supabase.functions.invoke('handle-dose-action', {
      body: { doseId, action: 'taken' }
    });
    // Mostra feedback
    toast.success('✅ Dose marcada!');
  } else if (actionId === 'snooze' && doseId) {
    // Similar para snooze
  }
});
```

## 📱 Fluxo de Uso

### Cenário 1: Marcar Dose da Notificação

1. **Notificação aparece:** "⏰ Hora do remédio! Losartana 50mg"
2. **Usuário clica "✓ Tomei"** (sem abrir app)
3. **Sistema:**
   - Chama `handle-dose-action` com `action: 'taken'`
   - Atualiza dose para `status: 'taken'`
   - Decrementa estoque
   - Calcula streak
4. **Feedback:** Toast "✅ Losartana tomado! 🔥 5 dias seguidos"

### Cenário 2: Marcar Dose do Widget

1. **Usuário abre app**
2. **`useSmartRedirect` detecta dose pendente** → Redireciona para `/hoje`
3. **`QuickDoseWidget` exibe:** "Próxima dose: Losartana 50mg às 08:00"
4. **Usuário clica "✓ Tomei agora"**
5. **Sistema:** Mesmo fluxo do cenário 1
6. **Widget atualiza:** "Sem doses pendentes - você está em dia! 🎉"

### Cenário 3: Sugestão Adaptativa

1. **Usuário atrasa dose 3 dias seguidos**
2. **`useAdaptiveSuggestions` detecta padrão**
3. **Sugestão aparece em `/hoje`:**
   > "Você costuma tomar Losartana com 2h de atraso. Quer ajustar o horário?"
4. **Usuário pode aceitar ou ignorar**

## 🔧 Configuração

### 1. Edge Functions

Certifique-se de que `supabase/config.toml` contém:

```toml
[functions.handle-dose-action]
verify_jwt = false

[functions.send-dose-notification]
verify_jwt = true

[functions.schedule-dose-notifications]
verify_jwt = false
```

### 2. Notificações Push

Para Android (FCM) e iOS (APNs), configure:

1. **Firebase:**
   - Criar projeto no Firebase Console
   - Baixar `google-services.json` (Android) e `GoogleService-Info.plist` (iOS)
   - Adicionar ao projeto Capacitor

2. **Apple Developer:**
   - Criar APNs Key
   - Configurar Push Notification capability

3. **Secrets (Edge Functions):**
   ```bash
   # Adicionar via Supabase CLI ou Dashboard
   supabase secrets set FIREBASE_SERVER_KEY=your_key_here
   ```

### 3. Capacitor

```bash
# Sync native projects
npx cap sync

# Run on device
npx cap run android
npx cap run ios
```

## 📊 Métricas de Sucesso

Para avaliar o sucesso do sistema, monitore:

1. **Taxa de marcação via notificação:**
   ```sql
   SELECT 
     COUNT(CASE WHEN metadata->>'source' = 'notification' THEN 1 END) as from_notification,
     COUNT(*) as total
   FROM dose_instances
   WHERE status = 'taken';
   ```

2. **Taxa de uso do widget:**
   - Adicionar tracking no `QuickDoseWidget`

3. **Redução de doses perdidas:**
   ```sql
   SELECT 
     DATE_TRUNC('week', due_at) as week,
     COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed
   FROM dose_instances
   GROUP BY week
   ORDER BY week DESC;
   ```

4. **Aumento de streak médio:**
   ```sql
   SELECT 
     AVG(current_streak) as avg_streak
   FROM user_streaks;
   ```

## 🚀 Próximos Passos

### Melhorias Futuras

1. **Swipe Actions em Cards de Dose:**
   - Swipe direita = Tomei
   - Swipe esquerda = Mais opções

2. **Modo Correção Rápida:**
   - Botão no topo para marcar doses de dias anteriores

3. **Widget Nativo (iOS/Android):**
   - Widget na tela inicial do dispositivo
   - Atualização em tempo real

4. **Notificações Adaptativas:**
   - Enviar lembrete extra se usuário costuma esquecer
   - Ajustar horário automaticamente se sempre atrasa

5. **Gamificação:**
   - Badges por streaks
   - Desafios mensais
   - Comparação com comunidade (opt-in)

## 📝 Notas Técnicas

### Limitações Atuais

1. **Push Notifications:**
   - Requer integração completa com FCM/APNs
   - Atualmente usa placeholder (log apenas)
   - Para produção, descomentar código FCM em `send-dose-notification`

2. **Widget Nativo:**
   - `QuickDoseWidget` é componente web
   - Widget verdadeiramente nativo requer código iOS/Android específico

3. **Offline:**
   - Ações requerem conexão
   - Implementar queue para sincronização offline

### Performance

- `QuickDoseWidget`: Atualiza a cada 60s (pode otimizar para menos frequência)
- `useAdaptiveSuggestions`: Analisa histórico de 7 dias (limitado para performance)
- `useSmartRedirect`: Verifica apenas em páginas de entrada (evita verificações excessivas)

## 🐛 Troubleshooting

### Notificações não aparecem
1. Verificar permissões do dispositivo
2. Verificar `push_enabled` em `notification_preferences`
3. Verificar logs do edge function `send-dose-notification`

### Widget não atualiza
1. Verificar console do navegador
2. Verificar query em `QuickDoseWidget.loadNextDose()`
3. Verificar RLS policies na tabela `dose_instances`

### Sugestões não aparecem
1. Verificar histórico de doses (mínimo 7 dias)
2. Verificar console do navegador
3. Verificar query em `useAdaptiveSuggestions`

## 📚 Referências

- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
