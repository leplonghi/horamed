# HoraMed - Configuração Android para Alarmes Confiáveis

## Visão Geral
Este documento descreve como configurar o projeto Android para garantir alarmes locais confiáveis, funcionando mesmo com o app fechado.

## 1. Pré-requisitos

```bash
# 1. Instalar dependências
npm install

# 2. Build do projeto
npm run build

# 3. Adicionar plataforma Android
npx cap add android

# 4. Sincronizar projeto
npx cap sync android
```

## 2. Configuração do AndroidManifest.xml

Após `npx cap add android`, edite `android/app/src/main/AndroidManifest.xml`:

### Permissões Necessárias
Adicione dentro de `<manifest>`, antes de `<application>`:

```xml
<!-- Notificações -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Alarmes em background -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />

<!-- Foreground Service para alarmes persistentes -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

<!-- Vibração -->
<uses-permission android:name="android.permission.VIBRATE" />
```

### Receiver para Boot
Adicione dentro de `<application>`:

```xml
<!-- Reagendar alarmes após reboot -->
<receiver 
    android:name="com.capacitorjs.plugins.localnotifications.LocalNotificationRestoreReceiver"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
    </intent-filter>
</receiver>
```

## 3. Notification Channel Dedicado

O channel é criado automaticamente pelo hook `useAndroidAlarm.ts`:

| Propriedade | Valor |
|-------------|-------|
| Channel ID | `horamed_alarm` |
| Nome | Alarmes de Medicamentos |
| Importância | HIGH (5) |
| Som | notification.wav |
| Vibração | ✓ Ativada |
| Visibilidade | PUBLIC (1) |
| Lights | ✓ Ativado |

## 4. Arquivos de Som

Adicione arquivos de som em:
```
android/app/src/main/res/raw/
├── notification.wav   (som padrão)
└── alarm.wav          (som crítico)
```

## 5. Ícones de Notificação

Adicione ícones em:
```
android/app/src/main/res/
├── drawable-hdpi/ic_stat_icon.png     (24x24)
├── drawable-mdpi/ic_stat_icon.png     (18x18)
├── drawable-xhdpi/ic_stat_icon.png    (36x36)
├── drawable-xxhdpi/ic_stat_icon.png   (48x48)
├── drawable-xxxhdpi/ic_stat_icon.png  (72x72)
```

## 6. FCM (Push Notifications) - Complementar

### 6.1 Configurar Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Crie projeto ou use existente
3. Adicione app Android com package `dev.horamed.app`
4. Baixe `google-services.json`
5. Coloque em `android/app/google-services.json`

### 6.2 Gradle
Em `android/app/build.gradle`, adicione:
```gradle
apply plugin: 'com.google.gms.google-services'
```

Em `android/build.gradle`, adicione:
```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
}
```

## 7. Economia de Bateria

### Problema
Android pode matar alarmes se o app não estiver na lista de exceções de bateria.

### Solução
O app detecta e avisa o usuário. Instrua-o a:
1. Configurações → Apps → HoraMed
2. Bateria → Sem restrições

### Fabricantes Problemáticos
- Xiaomi: MIUI mata apps agressivamente
- Samsung: One UI tem restrições
- Huawei/Honor: EMUI muito restritivo
- Oppo/Vivo: ColorOS/FuntouchOS

O componente `BatteryOptimizationPrompt.tsx` guia o usuário.

## 8. Teste Obrigatório

### Procedimento
1. Abra o app
2. Vá em **Configurações → Alarmes → Diagnóstico**
3. Clique em **Testar Alarme** (agenda para 2 min)
4. **Feche completamente o app**
5. **Ative modo avião**
6. **Bloqueie a tela**
7. Aguarde o alarme

### Critério de Sucesso
- ✅ Som toca
- ✅ Notificação aparece
- ✅ Funciona com app fechado

## 9. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      AGENDAMENTO                            │
├─────────────────────────────────────────────────────────────┤
│  1. Usuário cria dose                                       │
│  2. useAndroidAlarm.scheduleAlarm() agenda LocalNotification│
│  3. allowWhileIdle: true (funciona em Doze)                │
│  4. channelId: horamed_alarm (HIGH importance)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DISPARO                                │
├─────────────────────────────────────────────────────────────┤
│  • Android dispara notificação no horário exato             │
│  • Funciona offline (não depende de internet)               │
│  • Listener localNotificationReceived registra sucesso      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKUP (FCM)                           │
├─────────────────────────────────────────────────────────────┤
│  • Push notification como reforço (se tiver internet)       │
│  • Não é a solução principal                                │
│  • Serve como fallback                                      │
└─────────────────────────────────────────────────────────────┘
```

## 10. Comandos Úteis

```bash
# Build e rodar em device/emulador
npx cap run android

# Abrir no Android Studio
npx cap open android

# Sincronizar após mudanças
npx cap sync android

# Logs do Logcat
adb logcat | grep -i "horamed\|AndroidAlarm\|LocalNotification"
```

## 11. Checklist Final

- [ ] Permissões adicionadas no AndroidManifest.xml
- [ ] google-services.json configurado (para FCM)
- [ ] Sons adicionados em res/raw/
- [ ] Ícones adicionados em res/drawable-*/
- [ ] Testado com app fechado
- [ ] Testado em modo avião
- [ ] Testado após reboot
- [ ] Usuário orientado sobre economia de bateria
