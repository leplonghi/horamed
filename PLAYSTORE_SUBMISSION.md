# 📱 HoraMed - Guia Completo de Publicação na Play Store

> **Tempo estimado:** 1-2 horas para primeira publicação  
> **Dificuldade:** Intermediário  
> **Última atualização:** Janeiro 2025

Este guia irá te ajudar a publicar o HoraMed na Google Play Store, passo a passo. Mesmo que você nunca tenha publicado um app Android antes, conseguirá seguir este tutorial.

---

## 📋 Índice

1. [Parte 1: Preparação do Ambiente](#parte-1-preparação-do-ambiente)
2. [Parte 2: Criar Keystore de Assinatura](#parte-2-criar-keystore-de-assinatura)
3. [Parte 3: Preparar o Projeto](#parte-3-preparar-o-projeto)
4. [Parte 4: Configurar Arquivos do Gradle](#parte-4-configurar-arquivos-do-gradle)
5. [Parte 5: Gerar o Build de Release](#parte-5-gerar-o-build-de-release)
6. [Parte 6: Testar Antes de Enviar](#parte-6-testar-antes-de-enviar)
7. [Parte 7: Publicar na Play Store](#parte-7-publicar-na-play-store)
8. [Troubleshooting](#-troubleshooting)

---

## Parte 1: Preparação do Ambiente

### 1.1 Requisitos de Software

Antes de começar, certifique-se de ter instalado:

| Software | Versão Mínima | Como Instalar |
|----------|---------------|---------------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Android Studio | 2024+ | [developer.android.com](https://developer.android.com/studio) |
| Java (JDK) | 17+ | Vem com Android Studio |
| Git | Qualquer | [git-scm.com](https://git-scm.com) |

### 1.2 Verificar Instalações

Abra o terminal e execute cada comando abaixo. Cada um deve retornar uma versão:

```bash
# 📍 Verificar Node.js (deve mostrar v18.x.x ou superior)
node --version

# 📍 Verificar npm (deve mostrar 9.x.x ou superior)
npm --version

# 📍 Verificar Java (deve mostrar 17.x.x ou superior)
java --version

# 📍 Verificar Git
git --version
```

**✅ Checkpoint:** Todos os comandos retornaram uma versão? Continue para o próximo passo.

### 1.3 Configurar Variáveis de Ambiente

> **Por que isso?** O Gradle (sistema de build do Android) precisa saber onde estão o Java e o Android SDK.

#### No macOS/Linux:

Adicione ao seu `~/.zshrc` ou `~/.bashrc`:

```bash
# Java (geralmente vem com Android Studio)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

# Android SDK
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools"
```

Depois execute:
```bash
source ~/.zshrc  # ou source ~/.bashrc
```

#### No Windows:

1. Pressione `Win + R`, digite `sysdm.cpl` e pressione Enter
2. Vá em "Avançado" → "Variáveis de Ambiente"
3. Adicione novas variáveis de sistema:
   - `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`
   - `ANDROID_HOME` = `C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk`
4. Edite a variável `Path` e adicione:
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\platform-tools`

### 1.4 Verificar Configuração do Android Studio

1. Abra o Android Studio
2. Vá em **Settings/Preferences** → **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Na aba **SDK Platforms**, verifique se **Android 14 (API 35)** está instalado
4. Na aba **SDK Tools**, verifique se estão instalados:
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android SDK Platform-Tools

**✅ Checkpoint:** O comando `adb devices` funciona no terminal? Continue para o próximo passo.

---

## Parte 2: Criar Keystore de Assinatura

### 2.1 O que é um Keystore?

> **Explicação simples:** Um keystore é como uma "assinatura digital" do seu app. A Google Play usa isso para garantir que só VOCÊ pode publicar atualizações do seu app. **Se você perder o keystore, não poderá mais atualizar o app!**

⚠️ **AVISOS IMPORTANTES:**
- **NUNCA** perca o arquivo keystore
- **NUNCA** esqueça a senha
- **NUNCA** commite o keystore no Git
- **SEMPRE** faça backup em local seguro (Google Drive, Dropbox, etc.)

### 2.2 Gerar o Keystore

Execute o comando abaixo na **pasta raiz do projeto**:

```bash
keytool -genkey -v -keystore horamed-release.keystore \
  -alias horamed \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Explicação de cada parâmetro:**
| Parâmetro | Significado |
|-----------|-------------|
| `-keystore horamed-release.keystore` | Nome do arquivo que será criado |
| `-alias horamed` | Apelido da chave (você vai usar isso depois) |
| `-keyalg RSA` | Algoritmo de criptografia (RSA é o padrão) |
| `-keysize 2048` | Tamanho da chave (2048 é seguro e rápido) |
| `-validity 10000` | Validade em dias (~27 anos) |

**Durante a execução, você será perguntado:**

```
Enter keystore password: [DIGITE UMA SENHA FORTE]
Re-enter new password: [REPITA A SENHA]

What is your first and last name?
  [Unknown]: Seu Nome Completo

What is the name of your organizational unit?
  [Unknown]: Desenvolvimento

What is the name of your organization?
  [Unknown]: HoraMed

What is the name of your City or Locality?
  [Unknown]: Sua Cidade

What is the name of your State or Province?
  [Unknown]: Seu Estado

What is the two-letter country code for this unit?
  [Unknown]: BR

Is CN=..., OU=..., O=..., L=..., ST=..., C=BR correct?
  [no]: yes
```

### 2.3 Guardar Credenciais com Segurança

Após gerar o keystore, anote as seguintes informações em um **local seguro**:

```
📁 Arquivo: horamed-release.keystore
🔑 Alias: horamed
🔒 Senha do Keystore: [sua senha]
🔒 Senha da Chave: [geralmente igual à do keystore]
```

**Sugestões de onde guardar:**
- Gerenciador de senhas (1Password, Bitwarden, LastPass)
- Documento criptografado
- Cofre digital da empresa

### 2.4 Mover o Keystore para o Local Correto

```bash
# Mover para a pasta android/ (será criada no próximo passo)
# Por enquanto, mantenha na raiz do projeto
ls -la horamed-release.keystore
```

**✅ Checkpoint:** O arquivo `horamed-release.keystore` existe na pasta raiz? Continue.

---

## Parte 3: Preparar o Projeto

### 3.1 Entendendo o Processo

> **Por que isso?** O Capacitor "empacota" seu site React como um app Android nativo. Primeiro precisamos gerar o site (build), depois criar o projeto Android.

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Código React  │ ──▶ │  npm build   │ ──▶ │   Pasta dist/   │
│  (src/*.tsx)    │     │              │     │  (HTML/JS/CSS)  │
└─────────────────┘     └──────────────┘     └─────────────────┘
                                                      │
                                                      ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   App Android   │ ◀── │  cap sync    │ ◀── │   Capacitor     │
│  (android/*.*)  │     │              │     │  empacota dist  │
└─────────────────┘     └──────────────┘     └─────────────────┘
```

### 3.2 Instalar Dependências

```bash
# 📍 Na pasta raiz do projeto
npm install
```

**O que esperar:** Várias linhas de output, terminando sem erros.

**✅ Checkpoint:** Não apareceu nenhum `ERR!` em vermelho? Continue.

### 3.3 Build do Frontend

```bash
npm run build
```

**O que esperar:**
```
vite v5.x.x building for production...
✓ 1234 modules transformed.
dist/index.html                   1.23 kB
dist/assets/index-abc123.css      45.67 kB
dist/assets/index-def456.js      234.56 kB
✓ built in 12.34s
```

**✅ Checkpoint:** A pasta `dist/` foi criada e contém arquivos? Execute:
```bash
ls dist/
# Deve mostrar: index.html, assets/, etc.
```

### 3.4 Criar Projeto Android

#### Primeira vez (nunca criou a pasta android):

```bash
npx cap add android
```

**O que esperar:**
```
✔ Adding native android project in android in 5.23s
✔ Syncing Gradle in 2.34s
✔ add in 7.57s
```

#### Já existe a pasta android:

```bash
npx cap sync android
```

**O que esperar:**
```
✔ Copying web assets from dist to android/app/src/main/assets/public in 1.23s
✔ Creating capacitor.config.json in android/app/src/main/assets in 0.01s
✔ copy android in 1.24s
✔ update android in 0.45s
```

### 3.5 Verificar Estrutura do Projeto

Execute o comando abaixo para verificar se tudo foi criado:

```bash
ls -la android/
```

**Deve mostrar:**

```
android/
├── app/                          ← Código do app
│   ├── build.gradle              ← Configuração do app
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml
│   │       ├── assets/           ← Seu site está aqui!
│   │       └── res/              ← Ícones e recursos
│   └── ...
├── build.gradle                  ← Configuração raiz
├── variables.gradle              ← Variáveis de versão (IMPORTANTE!)
├── settings.gradle
├── gradle.properties
└── gradle/
    └── wrapper/
```

**✅ Checkpoint:** O arquivo `android/variables.gradle` existe? Se não, veja o [Troubleshooting](#-troubleshooting).

---

## Parte 4: Configurar Arquivos do Gradle

### 4.1 Entendendo a Estrutura

> **Por que isso?** O Gradle é o sistema de build do Android. Ele precisa saber quais versões do SDK usar, como assinar o app, etc.

```
android/
├── variables.gradle      ← Define as versões (minSdk, targetSdk, etc.)
├── build.gradle          ← Configuração RAIZ (importa variables.gradle)
└── app/
    └── build.gradle      ← Configuração do APP (usa as variáveis)
```

### 4.2 Verificar variables.gradle

📍 **Arquivo:** `android/variables.gradle`

Este arquivo é **criado automaticamente** pelo Capacitor. Verifique se ele contém:

```groovy
ext {
    minSdkVersion = 23
    compileSdkVersion = 35
    targetSdkVersion = 35
    androidxActivityVersion = '1.8.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.12.0'
    androidxFragmentVersion = '1.6.2'
    coreSplashScreenVersion = '1.0.1'
    androidxWebkitVersion = '1.9.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.1.5'
    androidxEspressoCoreVersion = '3.5.1'
    cordovaAndroidVersion = '10.1.1'
}
```

**⚠️ Se o arquivo não existir ou estiver vazio:** Veja [Troubleshooting - Erro: Could not find property](#erro-could-not-find-property-compilesdkversion).

### 4.3 Verificar build.gradle (raiz)

📍 **Arquivo:** `android/build.gradle`

Verifique se a **primeira linha** importa o `variables.gradle`:

```groovy
// ⬇️ ESTA LINHA DEVE SER A PRIMEIRA!
apply from: "variables.gradle"

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.1'
        classpath 'com.google.gms:google-services:4.4.0'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// ... resto do arquivo
```

### 4.4 Configurar app/build.gradle

📍 **Arquivo:** `android/app/build.gradle`

Este é o arquivo mais importante. Aqui está a versão **completa** com todas as configurações necessárias:

```groovy
apply plugin: 'com.android.application'

android {
    // ⬇️ OBRIGATÓRIO para Gradle 8+ (sem isso, dá erro!)
    namespace "dev.horamed.app"
    
    compileSdkVersion rootProject.ext.compileSdkVersion

    defaultConfig {
        // ⬇️ DEVE ser igual ao appId em capacitor.config.ts
        applicationId "dev.horamed.app"
        
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    // 🔐 CONFIGURAÇÃO DE ASSINATURA
    signingConfigs {
        release {
            storeFile file('../horamed-release.keystore')
            storePassword 'SUA_SENHA_AQUI'  // ⚠️ Substitua pela sua senha!
            keyAlias 'horamed'
            keyPassword 'SUA_SENHA_AQUI'    // ⚠️ Substitua pela sua senha!
        }
    }

    buildTypes {
        debug {
            debuggable true
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

repositories {
    flatDir {
        dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs'
    }
}

dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation project(':capacitor-android')
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-cordova-android-plugins')
}

apply from: 'capacitor.build.gradle'

try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.warn("google-services.json not found, google-services plugin not applied.")
}
```

### 4.5 Mover o Keystore

Agora mova o keystore para a pasta `android/`:

```bash
mv horamed-release.keystore android/
```

Verifique:
```bash
ls android/horamed-release.keystore
# Deve mostrar o arquivo
```

### 4.6 Tabela de Verificação

Antes de continuar, verifique cada item:

| Arquivo | O que verificar | ✅ |
|---------|-----------------|---|
| `android/variables.gradle` | Existe e contém `ext { ... }` | ☐ |
| `android/build.gradle` | Primeira linha é `apply from: "variables.gradle"` | ☐ |
| `android/app/build.gradle` | Contém `namespace "dev.horamed.app"` | ☐ |
| `android/app/build.gradle` | Contém `applicationId "dev.horamed.app"` | ☐ |
| `android/app/build.gradle` | Contém bloco `signingConfigs { release { ... } }` | ☐ |
| `android/horamed-release.keystore` | Arquivo existe | ☐ |
| `capacitor.config.ts` | Contém `appId: 'dev.horamed.app'` | ☐ |

**✅ Checkpoint:** Todos os itens marcados? Continue para o build!

---

## Parte 5: Gerar o Build de Release

### 5.1 Limpar Builds Anteriores

> **Por que isso?** Remove arquivos de builds anteriores que podem causar conflitos.

```bash
cd android
./gradlew clean
```

**No Windows:**
```bash
cd android
gradlew.bat clean
```

**O que esperar:**
```
> Task :clean
> Task :app:clean

BUILD SUCCESSFUL in 3s
2 actionable tasks: 2 executed
```

### 5.2 Gerar o AAB (Android App Bundle)

```bash
./gradlew bundleRelease
```

**No Windows:**
```bash
gradlew.bat bundleRelease
```

**O que esperar (pode demorar 2-5 minutos na primeira vez):**
```
> Task :app:bundleRelease
...
BUILD SUCCESSFUL in 2m 34s
42 actionable tasks: 42 executed
```

### 5.3 Localizar o Arquivo Final

O AAB foi gerado em:
```
android/app/build/outputs/bundle/release/app-release.aab
```

Verifique:
```bash
ls -lh android/app/build/outputs/bundle/release/
# Deve mostrar: app-release.aab (aproximadamente 5-15 MB)
```

**✅ Checkpoint:** O arquivo `app-release.aab` existe e tem mais de 1 MB? Sucesso!

---

## Parte 6: Testar Antes de Enviar

### 6.1 Verificar Tamanho do AAB

```bash
ls -lh android/app/build/outputs/bundle/release/app-release.aab
```

**Tamanhos esperados:**
- ✅ Normal: 5-20 MB
- ⚠️ Atenção: 20-50 MB (verifique se há assets muito grandes)
- ❌ Problema: >50 MB (otimização necessária)

### 6.2 Testar em Dispositivo (Opcional)

Se quiser testar o app antes de enviar à Play Store:

#### Opção A: Gerar APK de Debug

```bash
cd android
./gradlew assembleDebug
```

O APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

Transfira para o celular e instale.

#### Opção B: Usar bundletool (mais preciso)

1. Baixe o bundletool: https://github.com/google/bundletool/releases
2. Gere APKs do AAB:
```bash
java -jar bundletool.jar build-apks \
  --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=horamed.apks \
  --ks=android/horamed-release.keystore \
  --ks-key-alias=horamed
```
3. Instale no dispositivo conectado:
```bash
java -jar bundletool.jar install-apks --apks=horamed.apks
```

---

## Parte 7: Publicar na Play Store

### 7.1 Criar Conta de Desenvolvedor

1. Acesse: https://play.google.com/console
2. Faça login com sua conta Google
3. Pague a taxa única de **US$ 25** (aproximadamente R$ 125)
4. Preencha os dados da conta

### 7.2 Criar Novo App

1. Clique em **"Criar app"**
2. Preencha:
   - **Nome do app:** HoraMed - Lembrete de Medicamentos
   - **Idioma padrão:** Português (Brasil)
   - **App ou jogo:** App
   - **Gratuito ou pago:** Gratuito
3. Aceite as políticas
4. Clique em **"Criar app"**

### 7.3 Preencher Ficha do App

#### Descrição Curta (80 caracteres):
```
Lembretes inteligentes de medicamentos para você e sua família
```

#### Descrição Completa:
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

### 7.4 Upload dos Assets

#### Ícone (obrigatório)
- Arquivo: `public/playstore-icon-512.png`
- Dimensão: 512x512 pixels

#### Feature Graphic (obrigatório)
- Arquivo: `public/playstore-feature-graphic.png`
- Dimensão: 1024x500 pixels

#### Screenshots (mínimo 2)
- Arquivos em `public/screenshots/`
- Dimensão: 320-3840 pixels (largura)

### 7.5 Enviar o AAB

1. Vá em **"Produção"** → **"Criar nova versão"**
2. Arraste o arquivo `app-release.aab`
3. Preencha as notas da versão:
```
Versão 1.0.0 - Lançamento Inicial

✨ Novidades:
- Lembretes de medicamentos com alarmes
- Perfis para toda a família
- Carteira de saúde digital
- Assistente Clara com IA
```

### 7.6 Preencher Data Safety

A Play Store exige declarar quais dados o app coleta:

| Dado | Coletado | Compartilhado | Criptografado |
|------|----------|---------------|---------------|
| Email | ✓ | ✗ | ✓ |
| Nome | ✓ | ✗ | ✓ |
| Dados de saúde | ✓ | ✗ | ✓ |
| Dispositivo | ✓ | ✗ | ✓ |

**Exclusão de dados:** Sim, disponível em Perfil > Conta

### 7.7 Classificação de Conteúdo

1. Preencha o questionário IARC
2. Responda honestamente
3. Classificação esperada: **Livre**

### 7.8 Políticas e Links

| Campo | URL |
|-------|-----|
| Política de Privacidade | https://app.horamed.net/privacidade |
| Termos de Uso | https://app.horamed.net/termos |

### 7.9 Submeter para Revisão

1. Verifique se todos os itens estão ✅
2. Clique em **"Enviar para revisão"**
3. Aguarde 1-7 dias úteis

---

## 🔧 Troubleshooting

### Erro: Could not find property 'compileSdkVersion'

**Mensagem completa:**
```
Could not find property 'compileSdkVersion' on project ':app'
```

**Causa:** O arquivo `variables.gradle` não existe ou não foi importado.

**Solução:**

1. Verifique se o arquivo existe:
```bash
cat android/variables.gradle
```

2. Se não existir, recrie o projeto Android:
```bash
rm -rf android
npm run build
npx cap add android
npx cap sync android
```

3. Verifique se `android/build.gradle` começa com:
```groovy
apply from: "variables.gradle"
```

---

### Erro: Namespace not specified

**Mensagem completa:**
```
Namespace not specified. Specify a namespace in the module's build file.
```

**Causa:** O Gradle 8+ exige que o `namespace` seja declarado explicitamente.

**Solução:**

Adicione a linha abaixo no arquivo `android/app/build.gradle`:

```groovy
android {
    namespace "dev.horamed.app"  // ⬅️ Adicione esta linha
    compileSdkVersion rootProject.ext.compileSdkVersion
    // ...
}
```

---

### Erro: applicationId diferente do appId

**Mensagem completa:**
```
Warning: The applicationId 'com.example.app' is different from the appId 'dev.horamed.app'
```

**Causa:** O `applicationId` no build.gradle não corresponde ao `appId` no capacitor.config.ts.

**Solução:**

Ambos devem ser iguais. Verifique:

1. `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'dev.horamed.app',  // ⬅️ Este valor
  // ...
}
```

2. `android/app/build.gradle`:
```groovy
defaultConfig {
    applicationId "dev.horamed.app"  // ⬅️ Deve ser igual
    // ...
}
```

---

### Erro: Keystore file not found

**Mensagem completa:**
```
Keystore file '/path/to/android/horamed-release.keystore' not found
```

**Causa:** O arquivo keystore não está no local especificado.

**Solução:**

1. Verifique onde está o keystore:
```bash
find . -name "*.keystore"
```

2. Mova para a pasta `android/`:
```bash
mv horamed-release.keystore android/
```

3. Verifique o caminho no `android/app/build.gradle`:
```groovy
signingConfigs {
    release {
        storeFile file('../horamed-release.keystore')  // ⬅️ Caminho relativo à pasta app/
        // ...
    }
}
```

---

### Erro: Java version incompatible

**Mensagem completa:**
```
Unsupported class file major version 65
```

**Causa:** Versão do Java incompatível com o Gradle.

**Solução:**

1. Verifique a versão do Java:
```bash
java --version
```

2. O Gradle 8.2 requer Java 17. Atualize se necessário.

3. No macOS, aponte para o Java do Android Studio:
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

---

### Erro: Build muito lento ou travando

**Causa:** Pouca memória alocada para o Gradle.

**Solução:**

Edite `android/gradle.properties` e adicione:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
org.gradle.parallel=true
org.gradle.caching=true
```

---

### Erro: INSTALL_FAILED_UPDATE_INCOMPATIBLE

**Causa:** Você está tentando instalar uma versão com assinatura diferente.

**Solução:**

Desinstale o app do dispositivo primeiro:
```bash
adb uninstall dev.horamed.app
```

---

## 🔗 Links Úteis

- [Google Play Console](https://play.google.com/console)
- [Política de Desenvolvedor](https://play.google.com/about/developer-content-policy/)
- [Requisitos de Listagem](https://support.google.com/googleplay/android-developer/answer/9859152)
- [Guia de Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [Documentação do Capacitor](https://capacitorjs.com/docs/android)
- [Bundletool](https://github.com/google/bundletool)

---

## ✅ Checklist Final

### Antes de Submeter
- [ ] Build de produção testado localmente
- [ ] AAB assinado com keystore
- [ ] Backup do keystore em local seguro
- [ ] Ícone 512x512 enviado
- [ ] Feature Graphic 1024x500 enviada
- [ ] Mínimo 2 screenshots de celular
- [ ] Política de privacidade online e acessível
- [ ] Termos de uso online e acessíveis
- [ ] Descrições em português (Brasil)
- [ ] Testado em dispositivo físico Android

### Após Submeter
- [ ] Monitorar status da revisão (1-7 dias)
- [ ] Responder eventuais rejeições
- [ ] Configurar versões de teste interno/beta
- [ ] Configurar análise de crashes (Firebase Crashlytics)

---

**🎉 Parabéns!** Se você chegou até aqui, seu app está pronto para a Play Store!
