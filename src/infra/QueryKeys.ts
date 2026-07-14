/**
 * Enum central de query keys — sem strings mágicas espalhadas.
 * Adicionar uma chave por operação de leitura conforme os domínios crescem.
 */
export enum QueryKeys {
  ChannelList = 'ChannelList',
  ChannelQueues = 'ChannelQueues',
  ChatList = 'ChatList',
  ChatDetails = 'ChatDetails',
  ChatMessages = 'ChatMessages',
  ModuleContent = 'ModuleContent',
  ModuleList = 'ModuleList',
  UserList = 'UserList',
}
