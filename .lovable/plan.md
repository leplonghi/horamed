
# Plano: Corrigir Erro de Build Android (Etapa 7)

## Diagnóstico

O erro de build acontece porque as **variáveis do Gradle** não estão definidas. O arquivo `build.gradle` que você mostrou usa variáveis como:
- `rootProject.ext.compileSdkVersion`
- `rootProject.ext.minSdkVersion`
- `rootProject.ext.targetSdkVersion`
- `$androidxAppCompatVersion`
- `$junitVersion`
- `$androidxJunitVersion`
- `$androidxEspressoCoreVersion`

Essas variáveis precisam estar definidas no arquivo `android/variables.gradle`, que é criado automaticamente pelo Capacitor.

---

## Solução Passo a Passo

### Passo 1: Verificar se o arquivo `variables.gradle` existe

Abra o terminal na pasta do projeto e verifique:

```bash
cd android
ls -la variables.gradle
```

Se o arquivo **não existir**, o Capacitor pode não ter sido sincronizado corretamente.

---

### Passo 2: Recriar o projeto Android (se necessário)

Se o arquivo não existir ou estiver corrompido, a forma mais segura é recriar:

```bash
# Na pasta raiz do projeto (onde está o package.json)
rm -rf android
npm run build
npx cap add android
npx cap sync android
```

---

### Passo 3: Verificar o conteúdo do `variables.gradle`

Após a sincronização, o arquivo `android/variables.gradle` deve existir e conter algo como:

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

---

### Passo 4: Verificar o `build.gradle` raiz

O arquivo `android/build.gradle` (na pasta `android/`, não em `android/app/`) deve incluir o `variables.gradle`:

```groovy
// No início do arquivo android/build.gradle
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
```

---

### Passo 5: Ajustar o `app/build.gradle` (seu arquivo)

O arquivo que você mostrou (`android/app/build.gradle`) precisa de alguns ajustes:

**Adicionar namespace** (obrigatório para Gradle 8+):

```groovy
android {
    namespace "dev.horamed.app"  // Adicionar esta linha
    compileSdkVersion rootProject.ext.compileSdkVersion
    // ... resto do código
}
```

**Corrigir o applicationId** (está diferente do `capacitor.config.ts`):

```groovy
defaultConfig {
    applicationId "dev.horamed.app"  // Era "com.horamed.app"
    // ...
}
```

---

### Passo 6: Rodar o build novamente

```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

---

## Resumo dos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `android/variables.gradle` | Define todas as variáveis (SDK versions, dependency versions) |
| `android/build.gradle` | Configuração raiz que importa o `variables.gradle` |
| `android/app/build.gradle` | Configuração do app que usa as variáveis |

---

## Seção Técnica

### Estrutura esperada do projeto Android

```text
android/
├── build.gradle              ← Importa variables.gradle
├── variables.gradle          ← Define ext { ... } com versões
├── settings.gradle
├── gradle.properties
├── capacitor.settings.gradle
├── app/
│   ├── build.gradle          ← Usa as variáveis
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml
│   │       └── ...
│   └── google-services.json  ← Se usar Firebase
└── gradle/
    └── wrapper/
        └── gradle-wrapper.properties
```

### Versões recomendadas para Capacitor 7

```groovy
ext {
    minSdkVersion = 23
    compileSdkVersion = 35
    targetSdkVersion = 35
    androidxAppCompatVersion = '1.6.1'
    androidxCoreVersion = '1.12.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.1.5'
    androidxEspressoCoreVersion = '3.5.1'
}
```

### Correção do `applicationId`

O arquivo `capacitor.config.ts` define `appId: 'dev.horamed.app'`, mas o `build.gradle` mostrado usa `applicationId "com.horamed.app"`. Esses valores **devem ser iguais**, caso contrário o app não funcionará corretamente.

---

## Próximos Passos

Após aprovar este plano, farei as seguintes ações:
1. Verificar a estrutura atual do projeto
2. Criar/atualizar documentação com as instruções completas
3. Garantir que o `applicationId` está correto em todos os arquivos
