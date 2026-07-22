# Business Messaging

**Central de Mensagens Corporativas** — app mobile de mensageria para equipes de empresas (estilo "WhatsApp corporativo"), construído em React Native.

O app é organizado em três pilares:

- **Módulos / Communities** — grupos internos por comunidade, com quadro de anúncios, meus grupos e grupos para entrar.
- **Atendimento** — canais por produto com filas de conversas de clientes (aguardando → em atendimento → resolvidas), com ações de assumir, resolver e transferir.
- **Chats** — conversas diretas (DM) e grupos, com diretório da empresa para iniciar novas conversas.

Autenticação por e-mail corporativo, tema claro/escuro e visual "liquid glass" no iOS.

---

## Índice

- [Stack e tecnologias](#stack-e-tecnologias)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar o projeto](#como-rodar-o-projeto)
- [Scripts disponíveis](#scripts-disponíveis)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Convenções](#convenções)
- [Estado atual do projeto](#estado-atual-do-projeto)

---

## Stack e tecnologias

| Categoria | Tecnologia |
|---|---|
| **Core** | React Native 0.86 (bare) · React 19 · TypeScript (strict) · Node ≥ 22 · Yarn 4 (Berry) |
| **Navegação** | `@react-navigation/native` v7 · native-stack · **native bottom-tabs** (`createNativeBottomTabNavigator`) |
| **Estado servidor** | `@tanstack/react-query` v5 (+ infra própria de hooks) |
| **Estado local** | Zustand (toast, settings, playback) · Context API (credenciais de auth) |
| **HTTP** | Axios (instância única) |
| **Formulários** | React Hook Form + Zod (`@hookform/resolvers`) |
| **UI / Design System** | `@shopify/restyle` (tema tipado light/dark) · `react-native-svg` · `@callstack/liquid-glass` · `@gorhom/bottom-sheet` · `react-native-reanimated` v4 + worklets · `react-native-gesture-handler` v3 |
| **Storage** | `react-native-mmkv` v4 (+ `react-native-nitro-modules`) |
| **Mídia** | `react-native-vision-camera` v4 · `@react-native-camera-roll/camera-roll` · `react-native-image-picker` · `react-native-nitro-sound` (áudio) · `react-native-view-shot` |
| **Animações** | `@rive-app/react-native` (Rive) · Reanimated |
| **Utilidades** | `date-fns` · `react-native-config` (+ validação Zod) · `react-native-haptic-feedback` · `rn-emoji-keyboard` |
| **Qualidade** | ESLint (`@react-native` + `import/order`) · Prettier · Jest |

## Arquitetura

O projeto segue uma arquitetura **em camadas orientada a domínio**, com forte separação entre acesso a dados, regras de negócio e UI. O fluxo de dados é sempre:

```
API (fetch/mock) → Adapter (API → modelo do app) → Service (regra de negócio) → useCase (React Query) → Screen/Component
```

Cada **domínio** (`Auth`, `User`, `Chat`, `Module`, `Attendance`) encapsula seus próprios tipos, API, adapter, service e use cases (hooks). Isso mantém a UI desacoplada da fonte de dados.

### Camada de dados (Api / Adapter / Service)

- **Api** — responsável por buscar dados. Hoje serve **fixtures mockadas** (derivadas do protótipo de design), estruturadas de forma que a troca `mock → axios` aconteça **sem tocar em Service ou useCases** quando o backend existir.
- **Adapter** — converte a forma da API (`snake_case`, campos crus) para o modelo do app (`camelCase`, campos derivados como `initials`).
- **Service** — orquestra regras de negócio (ex.: assumir/resolver um atendimento).
- **useCase** — hooks baseados em React Query (`useChatList`, `useAuthSignIn`, etc.), com invalidação de cache centralizada via `QueryKeys`.

### Infra própria (`src/infra`)

Camada fina sobre o React Query padronizando o consumo em toda a app:

- `useMutation` — wrapper de mutação com tratamento de erro consistente.
- `usePaginatedList` — listas paginadas (`Page` / `MetaDataPage`).
- `QueryKeys` — enum central de chaves de cache.

### Tratamento de erros

`src/utils/apiError` normaliza qualquer erro (`ApiError` + `toApiError`) com mensagens em português por status HTTP, consumidas pelos componentes `ErrorState` / `Toast`.

### Tema

`@shopify/restyle` com tema tipado. `src/theme` define paleta bruta + cores semânticas (`lightColors` / `darkColors`), spacing, border radii e variantes de texto. O tema ativo é resolvido em runtime por `useResolvedTheme` (preferência manual > sistema).

### Navegação

- **Guarda de sessão** em `Routes.tsx`: `Splash → AuthStack ⭤ AppStack` conforme credenciais.
- **AppStack**: `AppTabs` (bottom-tabs **nativa** — liquid glass real no iOS 26, Material no Android) com as 4 telas raiz (Módulos, Atendimento, Chats, Configurações) + telas de detalhe empurradas por cima (sem tab bar), como no protótipo.
- Tipos de rota totalmente tipados (`AuthScreenProps`, `AppTabScreenProps`, `AppStackScreenProps`).

## Estrutura de pastas

```
src/
├── api/          # Axios (instância única), tipos de paginação, adapter base
├── config/       # env validado com Zod (env.schema.ts + env.ts)
├── domain/       # Regras de negócio por domínio
│   ├── Auth/     #   cada domínio: Types · Api · Adapter · Service · useCases
│   ├── User/
│   ├── Chat/
│   ├── Module/
│   └── Attendance/
├── infra/        # useMutation, usePaginatedList, QueryKeys (React Query)
├── routes/       # Routes (guarda), AuthStack, AppStack, navigationTypes
├── screens/      # Telas por área: public/ · auth/ · app/
├── components/   # Design system (Box, Text, Button, Avatar, Toast, BottomSheet...)
├── services/     # Serviços transversais (storage, toast, settings, camera, authCredentials, audioPlayback)
├── theme/        # Restyle: colors, theme (spacing/radii/textVariants), darkTheme
├── hooks/        # Hooks utilitários (useAppTheme...)
├── types/        # Tipos globais (Page, MetaDataPage...)
├── utils/        # apiError e helpers
└── assets/       # Imagens, Rive, etc.
```

Aliases de import (`@api`, `@components`, `@domain`, `@theme`, …) configurados em `tsconfig.json` e `babel.config.js` (`babel-plugin-module-resolver`).

## Funcionalidades

- **Autenticação** por e-mail corporativo (login + recuperação de senha) com persistência de credenciais em MMKV.
- **Chats** — DMs e grupos, lista com busca, swipe actions (silenciar/apagar), perfil de conversa, badges de não lidas.
- **Mensagens** — texto, **áudio** (gravação press-and-hold estilo WhatsApp: arrastar para cancelar / travar), **imagem** (câmera própria in-app + galeria customizada + preview com legenda), mensagens de sistema e ticks de entrega/leitura.
- **Menu de contexto** em mensagens (long-press) com barra de reações e ações (responder, encaminhar, copiar, favoritar, apagar).
- **Módulos/Communities** — anúncios, meus grupos e grupos para entrar.
- **Atendimento** — filas por canal (aguardando / em atendimento / resolvidas) com assumir/resolver e banner de status no chat.
- **Configurações** — perfil, tema claro/escuro/sistema, switches de notificações, sair.
- **Câmera in-app** (VisionCamera) com layout estilo WhatsApp (flash, zoom, virar câmera, galeria).
- Animações **Rive** e tema claro/escuro em toda a app.

> **Nota:** atualmente todos os domínios operam com dados **mockados em memória** (stateful) — enviar mensagens, criar DMs, assumir atendimentos etc. mutam o mock. A integração com backend real está preparada mas ainda não conectada.

## Pré-requisitos

- **Node.js** ≥ 22.11.0
- **Yarn** 4 (Berry) — o repositório usa `nodeLinker: node-modules`
- **Watchman** (recomendado no macOS)
- **iOS**: macOS + Xcode (Xcode 26 para o liquid glass nativo) + CocoaPods + Ruby/Bundler
- **Android**: Android Studio + JDK 17 + um emulador ou device configurado

Se ainda não configurou o ambiente nativo, siga o guia oficial: [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment).

## Como rodar o projeto

### 1. Instalar dependências JS

```sh
yarn install
```

### 2. Criar o arquivo `.env`

Na raiz do projeto:

```sh
API_URL=https://api.message.mock/v1
```

Ver [Variáveis de ambiente](#variáveis-de-ambiente).

### 3. Instalar pods (apenas iOS)

Na primeira vez e sempre que dependências nativas mudarem:

```sh
bundle install          # primeira vez apenas (instala o CocoaPods via Bundler)
bundle exec pod install --project-directory=ios
```

### 4. Iniciar o Metro

```sh
yarn start
```

### 5. Rodar o app

Em outro terminal, com o Metro rodando:

```sh
# iOS
yarn ios

# Android
yarn android
```

> ⚠️ Como o projeto usa vários módulos nativos (VisionCamera, MMKV/Nitro, nitro-sound, Rive, gesture-handler, reanimated), um **rebuild nativo** (`yarn ios` / `yarn android`) é obrigatório após instalar novas dependências — um reload do Metro não basta.

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `yarn start` | Inicia o Metro (bundler) |
| `yarn ios` | Compila e roda no simulador/dispositivo iOS |
| `yarn android` | Compila e roda no emulador/dispositivo Android |
| `yarn lint` | Roda o ESLint em todo o projeto |
| `yarn test` | Roda a suíte de testes (Jest) |
| `yarn tsc --noEmit` | Type-check (TypeScript strict) |

## Variáveis de ambiente

Definidas em um arquivo `.env` na raiz, carregadas por `react-native-config` e **validadas via Zod** em `src/config/env.schema.ts`. Se alguma variável obrigatória estiver ausente ou inválida, o app falha no boot com uma mensagem descritiva.

| Variável | Descrição |
|---|---|
| `API_URL` | URL base da API (hoje aponta para o mock) |

> Não há secrets por ora. Quando houver, o `.env` deve entrar no `.gitignore`.

## Convenções

- **Import order** (ESLint `import/order`): react/react-native primeiro, depois libs externas, depois aliases `@`, cada grupo separado por linha em branco e ordenado alfabeticamente.
- **Aliases** sempre para imports entre camadas (`@domain`, `@components`, …), nunca caminhos relativos longos.
- **Componentes-base** `Box` e `Text` (via `createBox`/`createText` do Restyle) em vez de `View`/`Text` crus.
- **TypeScript strict** — sem `any` implícito.
- Cada domínio segue o mesmo padrão de arquivos: `XxxTypes` · `XxxApi` · `XxxAdapter` · `XxxService` · `useCases/`.

## Estado atual do projeto

O desenvolvimento é feito por **fases**, documentadas em detalhe em [`DEVELOPMENT.md`](./DEVELOPMENT.md) — leia esse arquivo antes de continuar o desenvolvimento. Ele contém o mapa de progresso, decisões de arquitetura, gotchas de bibliotecas nativas e o histórico de cada fase.

Principais decisões registradas lá:

- **Sem backend por ora** — tudo no padrão Api/Adapter/Service com dados mockados; troca para axios sem tocar em Service/useCases.
- **Bottom-tabs nativa** para obter o liquid glass real do iOS.
- Bibliotecas de mídia escolhidas e fixadas (ex.: VisionCamera **v4** fixado, `nitro-sound` no lugar do deprecated `audio-recorder-player`).
