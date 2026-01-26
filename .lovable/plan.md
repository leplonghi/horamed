
# Guia Completo: Publicar HoraMed na Google Play Store

Este guia detalha todo o processo desde a preparação do ambiente até a publicação final do app.

---

## Parte 1: Preparação do Ambiente (No seu computador)

### 1.1 Requisitos de Software
Antes de começar, você precisa instalar:

| Software | Link | Descrição |
|----------|------|-----------|
| Node.js 18+ | nodejs.org | Para rodar npm |
| Android Studio | developer.android.com/studio | IDE para build Android |
| Java JDK 17 | adoptium.net | Necessário para assinar o app |
| Git | git-scm.com | Controle de versão |

### 1.2 Exportar o Projeto do Lovable
1. No Lovable, clique no nome do projeto (canto superior esquerdo)
2. Vá em **Settings** > **GitHub**
3. Clique em **"Export to GitHub"**
4. Escolha seu repositório ou crie um novo

### 1.3 Clonar o Projeto
```bash
git clone https://github.com/SEU_USUARIO/horamed.git
cd horamed
npm install
```

---

## Parte 2: Configurar o Projeto Android

### 2.1 Adicionar Plataforma Android
```bash
# Build do frontend
npm run build

# Adicionar Android (se ainda não existe)
npx cap add android

# Sincronizar
npx cap sync android
```

### 2.2 Abrir no Android Studio
```bash
npx cap open android
```

### 2.3 Configurar o AndroidManifest.xml
Abra `android/app/src/main/AndroidManifest.xml` e adicione as permissões antes de `<application>`:

```xml
<!-- Notificações -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### 2.4 Adicionar Arquivos de Som
Crie a pasta e copie os sons:
```
android/app/src/main/res/raw/
├── notification.wav
└── alarm.wav
```

### 2.5 Adicionar Ícones de Notificação
Copie os ícones para cada densidade:
```
android/app/src/main/res/
├── drawable-mdpi/ic_stat_icon.png   (18x18)
├── drawable-hdpi/ic_stat_icon.png   (24x24)
├── drawable-xhdpi/ic_stat_icon.png  (36x36)
├── drawable-xxhdpi/ic_stat_icon.png (48x48)
├── drawable-xxxhdpi/ic_stat_icon.png(72x72)
```

---

## Parte 3: Criar Conta de Desenvolvedor Google

### 3.1 Registrar Conta
1. Acesse: **play.google.com/console**
2. Clique em **"Criar conta de desenvolvedor"**
3. Pague a taxa única de **US$ 25**
4. Preencha seus dados pessoais ou da empresa
5. Aguarde verificação (pode levar 24-48h)

### 3.2 Verificação de Identidade
O Google exige:
- Documento de identidade válido
- Comprovante de endereço (para contas de empresa)
- Dados bancários para receber pagamentos (se for monetizar)

---

## Parte 4: Gerar Build de Produção

### 4.1 Criar Keystore (Chave de Assinatura)
Esta chave é ÚNICA e PERMANENTE. **Guarde-a em local seguro!**

```bash
keytool -genkey -v -keystore horamed-release.keystore \
  -alias horamed -keyalg RSA -keysize 2048 -validity 10000
```

Quando solicitado, preencha:
- **Senha**: Crie uma senha forte (anote!)
- **Nome**: Seu nome ou nome da empresa
- **Unidade organizacional**: Ex: "Desenvolvimento"
- **Organização**: Nome da empresa
- **Cidade**: Sua cidade
- **Estado**: Seu estado (sigla)
- **País**: BR

### 4.2 Configurar Assinatura no Gradle
Edite `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../horamed-release.keystore')
            storePassword 'SUA_SENHA'
            keyAlias 'horamed'
            keyPassword 'SUA_SENHA'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 4.3 Gerar o AAB (Android App Bundle)
```bash
cd android
./gradlew bundleRelease
```

O arquivo será gerado em:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Parte 5: Configurar na Google Play Console

### 5.1 Criar o App
1. Acesse **play.google.com/console**
2. Clique em **"Criar app"**
3. Preencha:
   - **Nome**: HoraMed - Lembrete de Medicamentos
   - **Idioma padrão**: Português (Brasil)
   - **App ou jogo**: App
   - **Gratuito ou pago**: Gratuito
4. Aceite as políticas

### 5.2 Configurar a Ficha da Loja

#### Detalhes do App
| Campo | Valor |
|-------|-------|
| Título | HoraMed - Lembrete de Medicamentos |
| Descrição curta | Lembretes inteligentes de medicamentos para você e sua família |
| Descrição completa | (Use o texto do PLAYSTORE_SUBMISSION.md) |

#### Elementos Gráficos
Faça upload dos arquivos já preparados:
- **Ícone**: `public/playstore-icon-512.png` (512x512)
- **Gráfico de recursos**: `public/playstore-feature-graphic.png` (1024x500)
- **Screenshots** (mínimo 2, máximo 8):
  - `public/screenshots/screenshot-1-hoje.png`
  - `public/screenshots/screenshot-2-medicamentos.png`
  - `public/screenshots/screenshot-3-perfis.png`
  - `public/screenshots/screenshot-4-carteira.png`

### 5.3 Categorização
- **Categoria**: Saúde e fitness
- **Tags**: medicamentos, lembretes, saúde, família, cuidadores

### 5.4 Informações de Contato
- **Email**: contato@horamed.net
- **Website**: https://horamed.net

---

## Parte 6: Preencher Declarações Obrigatórias

### 6.1 Política de Privacidade
1. Vá em **Política** > **Política de privacidade do app**
2. Cole a URL: `https://app.horamed.net/privacidade`

### 6.2 Declaração de Segurança de Dados (Data Safety)
Responda ao questionário:

| Pergunta | Resposta |
|----------|----------|
| O app coleta dados? | Sim |
| O app compartilha dados com terceiros? | Não |
| Dados coletados são criptografados? | Sim |
| Usuários podem solicitar exclusão? | Sim |

**Tipos de dados coletados**:
- Email (para autenticação)
- Nome (para personalização)
- Dados de saúde (medicamentos, lembretes)
- Identificadores de dispositivo (para notificações)

### 6.3 Classificação de Conteúdo (IARC)
1. Vá em **Política** > **Classificação de conteúdo**
2. Preencha o questionário IARC
3. Perguntas típicas:
   - Violência? Não
   - Conteúdo sexual? Não
   - Linguagem imprópria? Não
   - Compras no app? Sim (assinatura)
   - Publicidade? Não

**Resultado esperado**: Classificação **Livre** (L)

### 6.4 Público-Alvo e Conteúdo
- **Faixa etária**: 18+ (app de saúde)
- **Contém anúncios?**: Não
- **Atrai crianças?**: Não

### 6.5 Tipo de App
- **Categorias sensíveis**: Saúde (requer declaração adicional)
- Confirme que o app não oferece diagnóstico médico

---

## Parte 7: Fazer Upload do App

### 7.1 Configurar Trilha de Testes (Recomendado)
1. Vá em **Teste** > **Teste interno**
2. Crie uma lista de testadores (seu email)
3. Faça upload do AAB
4. Teste por alguns dias

### 7.2 Publicar em Produção
1. Vá em **Produção** > **Criar nova versão**
2. Faça upload do arquivo `app-release.aab`
3. Preencha as notas da versão:
```
Versão 1.0.0 - Lançamento inicial

Recursos:
- Lembretes inteligentes de medicamentos
- Gestão de múltiplos perfis familiares
- Carteira de saúde digital
- Assistente de IA Clara
- Notificações push confiáveis
```

### 7.3 Revisar e Publicar
1. Clique em **"Revisar versão"**
2. Verifique se todos os campos estão preenchidos
3. Clique em **"Iniciar lançamento para produção"**

---

## Parte 8: Após o Envio

### 8.1 Processo de Revisão
- **Tempo médio**: 3-7 dias úteis
- Apps novos podem levar mais tempo
- Você receberá email com o resultado

### 8.2 Possíveis Motivos de Rejeição
| Problema | Solução |
|----------|---------|
| Política de privacidade inacessível | Verificar se a URL está online |
| Permissões não justificadas | Adicionar texto explicativo no app |
| Crashes no teste | Corrigir bugs e reenviar |
| Metadados incorretos | Ajustar descrições |

### 8.3 Monitoramento Pós-Lançamento
- Configure **Firebase Crashlytics** para monitorar crashes
- Acompanhe avaliações na Play Console
- Responda reviews dos usuários

---

## Checklist Final

### Antes de Enviar
- [ ] Conta de desenvolvedor verificada
- [ ] Keystore gerada e guardada em local seguro
- [ ] Build AAB testado localmente
- [ ] Ícone 512x512 enviado
- [ ] Feature Graphic 1024x500 enviada
- [ ] Mínimo 4 screenshots
- [ ] Política de privacidade online
- [ ] Classificação IARC preenchida
- [ ] Data Safety configurado
- [ ] Descrições em português

### Após Aprovação
- [ ] Testar download na Play Store
- [ ] Verificar se notificações funcionam
- [ ] Monitorar primeiras avaliações
- [ ] Configurar atualizações automáticas

---

## Informações Técnicas do HoraMed

| Configuração | Valor |
|--------------|-------|
| App ID | `dev.horamed.app` |
| Versão | 1.0.0 |
| Min SDK | Android 6.0 (API 23) |
| Target SDK | Android 14 (API 34) |
| Política de Privacidade | https://app.horamed.net/privacidade |
| Termos de Uso | https://app.horamed.net/termos |
| Contato | contato@horamed.net |

---

## Custos Envolvidos

| Item | Valor | Frequência |
|------|-------|------------|
| Taxa de desenvolvedor Google | US$ 25 | Única |
| Servidor/Backend | Incluído no Lovable | Mensal |
| Domínio horamed.net | ~R$ 40 | Anual |

---

## Suporte

Se encontrar problemas durante o processo:
1. Consulte a documentação: support.google.com/googleplay/android-developer
2. Fórum de desenvolvedores: developer.android.com/community
3. Status da Play Console: status.play.google.com
