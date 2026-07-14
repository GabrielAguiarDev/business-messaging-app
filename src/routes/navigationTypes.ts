import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

// ── Auth ──────────────────────────────────────────────────────────
export type AuthStackParamList = {
  LoginScreen: undefined;
  ForgotPasswordScreen: undefined;
};

export type AuthScreenProps<RouteName extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, RouteName>;

// ── App ───────────────────────────────────────────────────────────
// Tabs mostram SOMENTE as 4 telas raiz (design). Telas de detalhe
// (Community, Fila, Nova conversa, Chat) são empurradas no AppStack,
// POR CIMA das tabs — a tab bar some automaticamente.
export type AppTabParamList = {
  ModulosTab: undefined;
  AtendimentoTab: undefined;
  ChatsTab: undefined;
  ConfigTab: undefined;
};

export type AppStackParamList = {
  AppTabs: NavigatorScreenParams<AppTabParamList>;
  CommunityScreen: {moduleId: string};
  AttendanceQueueScreen: {channelId: string};
  NewConversationScreen: undefined;
  ChatScreen: {chatId: string};
  ChatProfileScreen: {chatId: string};
};

/** Telas de detalhe (sem tab bar) */
export type AppStackScreenProps<RouteName extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, RouteName>;

/** Telas raiz de tab (com tab bar) — enxergam também o AppStack */
export type AppTabScreenProps<RouteName extends keyof AppTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<AppTabParamList, RouteName>,
    NativeStackScreenProps<AppStackParamList>
  >;
