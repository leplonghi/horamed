# HoraMed - Google Play Store Submission Guide

## ✅ Configurações Realizadas

### 1. Capacitor - Produção
- `capacitor.config.ts` atualizado
- `server.url` comentado (remover hot-reload)
- `webContentsDebuggingEnabled: false` para release
- Cores atualizadas para Ocean Theme (#0ea5e9)

### 2. Página "Sobre o App"
- Rota: `/sobre` ou `/about`
- Versão: 1.0.0 (Build 1)
- Links para Termos e Privacidade
- Contato: contato@horamed.net

### 3. Assets Gerados
- `public/playstore-icon-512.png` - Ícone 512x512
- `public/playstore-feature-graphic.png` - Feature Graphic 1024x500

---

## 📱 Build de Release

### Passo 1: Gerar Keystore
```bash
keytool -genkey -v -keystore horamed-release.keystore \
  -alias horamed -keyalg RSA -keysize 2048 -validity 10000
```

### Passo 2: Preparar Projeto
```bash
# Instalar dependências
npm install

# Build do frontend
npm run build

# Sincronizar com Android
npx cap sync android
```

### Passo 3: Build do AAB (Android App Bundle)
```bash
cd android
./gradlew bundleRelease
```

O arquivo AAB estará em: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 📝 Ficha da Play Store

### Título
```
HoraMed - Lembrete de Medicamentos
```

### Descrição Curta (80 caracteres)
```
Lembretes inteligentes de medicamentos para você e sua família
```

### Descrição Completa
```
HoraMed é seu assistente pessoal de saúde. Nunca mais esqueça de tomar seus medicamentos!

🔔 LEMBRETES CONFIÁVEIS
- Alarmes que funcionam mesmo com o celular bloqueado
- Notificações por push, email ou WhatsApp
- Horários flexíveis e personalizáveis

💊 GESTÃO COMPLETA DE MEDICAMENTOS
- Cadastro rápido por foto da receita
- Controle de estoque automático
- Alertas de reposição

👨‍👩‍👧‍👦 PARA TODA A FAMÍLIA
- Múltiplos perfis em uma conta
- Ideal para cuidadores de idosos
- Acompanhe a rotina de quem você ama

📋 CARTEIRA DE SAÚDE DIGITAL
- Guarde receitas, exames e vacinas
- Tudo organizado e acessível
- Exporte relatórios para consultas médicas

🤖 CLARA - ASSISTENTE DE IA
- Tire dúvidas sobre seus medicamentos
- Entenda interações medicamentosas
- Resumos inteligentes de exames

✅ PRIVACIDADE E SEGURANÇA
- Seus dados são criptografados
- Conformidade com a LGPD
- Seus dados nunca são vendidos

Baixe agora e tenha paz de espírito!
```

---

## ⚙️ Configurações da Play Console

### Categorização
- **Categoria**: Saúde e fitness
- **Tags**: medicamentos, lembretes, saúde, família, idosos

### Classificação de Conteúdo
- Preencher questionário IARC
- Classificação esperada: **Livre**

### Política de Privacidade
```
https://app.horamed.net/privacidade
```

### Data Safety (Declaração de Dados)
| Dado | Coletado | Compartilhado | Criptografado |
|------|----------|---------------|---------------|
| Email | ✓ | ✗ | ✓ |
| Nome | ✓ | ✗ | ✓ |
| Dados de saúde | ✓ | ✗ | ✓ |
| Dispositivo | ✓ | ✗ | ✓ |

- **Exclusão disponível**: Sim (via app em Perfil > Conta)

---

## ✅ Checklist Final

### Antes de Submeter
- [ ] Build de produção testado localmente
- [ ] AAB assinado com keystore
- [ ] Ícone 512x512 enviado
- [ ] Feature Graphic 1024x500 enviada
- [ ] Mínimo 2 screenshots de celular
- [ ] Política de privacidade online e acessível
- [ ] Termos de uso online e acessíveis
- [ ] Descrições em português (Brasil)
- [ ] Testado em dispositivo físico Android

### Screenshots Sugeridos (320-3840px)
1. Tela Hoje - Timeline de doses
2. Adicionar Medicamento - Wizard
3. Carteira de Saúde - Documentos
4. Perfis Familiares
5. Clara AI - Assistente

### Após Submeter
- [ ] Monitorar status da revisão (1-7 dias)
- [ ] Responder eventuais rejeições
- [ ] Configurar versões de teste interno/beta
- [ ] Configurar análise de crashes (Firebase Crashlytics)

---

## 🔗 Links Úteis

- [Google Play Console](https://play.google.com/console)
- [Política de Desenvolvedor](https://play.google.com/about/developer-content-policy/)
- [Requisitos de Listagem](https://support.google.com/googleplay/android-developer/answer/9859152)
- [Guia de Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
