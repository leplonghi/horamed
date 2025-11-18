# Sistema de Perfis Individualizados

## Objetivo
Garantir que cada perfil (usuário principal, familiares ou pessoas sob cuidado) tenha seus dados completamente individualizados e isolados.

## Estrutura de Dados

### Tabelas com suporte a profile_id
Todas as seguintes tabelas possuem a coluna `profile_id` para individualização:

1. **items** (medicamentos) - `profile_id`
2. **documentos_saude** (documentos) - `profile_id`  
3. **sinais_vitais** (pressão, peso, etc) - `profile_id`
4. **consultas_medicas** (consultas) - `profile_id`
5. **exames_laboratoriais** (exames) - `profile_id`
6. **eventos_saude** (eventos) - `profile_id`

### Tabelas relacionadas indiretamente
- **dose_instances** - filtradas via `items.profile_id`
- **schedules** - filtradas via `items.profile_id`
- **stock** - filtradas via `items.profile_id`

## Arquivos Corrigidos

### ✅ HealthDashboard.tsx
- Todas as queries agora filtram por `activeProfile.id`
- Métricas: medicamentos ativos, taxa de adesão, eventos, documentos
- Sinais vitais: peso, pressão, glicemia
- Exames laboratoriais alterados
- Comparação entre períodos (mês atual vs anterior)
- Correlação adesão x sinais vitais

### ✅ Charts.tsx
- Queries de doses filtradas por profile_id
- Estatísticas de adesão por perfil
- Histórico de saúde individualizado

### ✅ Medications.tsx  
- Lista de medicamentos filtrada por profile_id
- Cada perfil vê apenas seus medicamentos

### ✅ Today.tsx
- Doses do dia filtradas por perfil
- Consultas filtradas por perfil
- Calendário mensal por perfil

### ✅ AddItem.tsx
- Novos medicamentos criados com profile_id correto
- Atualização de medicamentos mantém profile_id

### ✅ CofreManualCreate.tsx
- Documentos manuais criados com profile_id correto

### ✅ Cofre.tsx
- Hook useDocumentos já filtra por profile_id

## Comportamento Esperado

### Ao selecionar um perfil diferente:
1. **useEffect em cada página recarrega dados** baseado em `activeProfile?.id`
2. **Queries adicionam filtro** `.eq("profile_id", activeProfile.id)` quando há perfil ativo
3. **Dados são completamente isolados** - nenhum dado de outro perfil é exibido

### Ao criar novos dados:
1. **Sempre salvar com** `profile_id: activeProfile?.id || null`
2. **Validar que há perfil ativo** antes de permitir criação (exceto casos especiais)

## Verificação

Para testar se está funcionando:
1. Criar perfil A e adicionar medicamento X
2. Criar perfil B e adicionar medicamento Y
3. Alternar entre perfis A e B
4. Verificar que:
   - Em perfil A: só aparece medicamento X
   - Em perfil B: só aparece medicamento Y
   - Dashboard mostra métricas corretas para cada perfil
   - Documentos são isolados por perfil
   - Sinais vitais são isolados por perfil

## RLS Policies

As políticas de RLS já permitem que:
- Usuários vejam dados onde `user_id = auth.uid()`
- Dados são filtrados adicionalmente por `profile_id` no código
- Cada perfil pertence ao usuário autenticado

## Próximos Passos (Opcional)

Se necessário implementar no futuro:
- [ ] MedicalReports.tsx - adicionar filtro por perfil
- [ ] HealthTimeline.tsx - verificar se filtra corretamente
- [ ] Outras páginas que ainda não usam perfis
