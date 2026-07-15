import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

import {Message, MessageForward} from '@domain';

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
  EditProfileScreen: undefined;
  ChatScreen: {chatId: string};
  ChatProfileScreen: {chatId: string};
  /** Escolher a conversa de destino ao encaminhar uma mensagem. */
  ForwardMessageScreen: {
    message: Message;
    /** Referência ao autor original — ausente ao encaminhar mensagem própria. */
    forward?: MessageForward;
  };
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
