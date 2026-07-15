import {ChatAPI, MessageAPI} from './ChatTypes';

/**
 * "Banco" em memória do MOCK — fixtures do protótipo (design handoff).
 * Stateful: enviar mensagem/criar DM/marcar lida mutam este estado,
 * simulando o backend até o contrato real existir.
 */
interface MockDb {
  chats: ChatAPI[];
  /** Conversas abríveis que NÃO aparecem na lista de Chats (ex.: grupos de outros módulos) */
  hiddenChats: ChatAPI[];
  threads: Record<string, MessageAPI[]>;
}

export const mockDb: MockDb = {
  chats: [
    {id: 'dm-u2', type: 'dm', name: 'Bruno Aguiar', initials: 'BA', avatar_color: '#3f9d8f', avatar_url: 'https://picsum.photos/seed/bruno-aguiar/900', last_message: 'Perfeito, obrigado!', last_message_time: '09:20', unread_count: 0, is_muted: false, context: null, is_online: true},
    {id: 'grp-recepcao', type: 'group', name: 'Equipe Recepção', initials: 'ER', avatar_color: '#9079d7', last_message: 'Fábio: Alguém cobre o turno da noite?', last_message_time: '08:47', unread_count: 2, is_muted: false, context: 'Yago Colaborador'},
    {id: 'dm-u3', type: 'dm', name: 'Carla Nunes', initials: 'CN', avatar_color: '#c85c8e', last_message: 'Vejo em 5 min 👍', last_message_time: 'Ontem', unread_count: 0, is_muted: false, context: null, is_online: true},
    {id: 'grp-midia', type: 'group', name: 'Mídia', initials: 'MI', avatar_color: '#e0864f', avatar_url: 'https://picsum.photos/seed/grupo-midia/900', last_message: 'Elisa: Fotos da suíte master prontas', last_message_time: 'Ontem', unread_count: 0, is_muted: false, context: 'Yago Colaborador'},
    {id: 'dm-u7', type: 'dm', name: 'Gabriela Souza', initials: 'GS', avatar_color: '#c9a227', last_message: 'Reserva confirmada ✔', last_message_time: 'Ter', unread_count: 0, is_muted: true, context: null, is_online: true},
    {id: 'grp-governanca', type: 'group', name: 'Governança', initials: 'GO', avatar_color: '#3f9d8f', last_message: 'Bruno: Enxoval reposto no 3º andar.', last_message_time: 'Ter', unread_count: 0, is_muted: true, context: 'Yago Colaborador'},
  ],
  hiddenChats: [
    // atendimentos NUNCA aparecem na lista de Chats — vivem nas filas do canal
    {id: 'att-pedro', type: 'attendance', name: 'Pedro Antunes', initials: 'PA', avatar_color: '#e0864f', last_message: 'Consigo estender o checkout até 14h?', last_message_time: '09:05', unread_count: 1, is_muted: false, context: 'Yago · App do Hóspede', product: 'App do Hóspede', status: 'atendimento', assigned_to: 'Você'},
    {id: 'grp-storage-op', type: 'group', name: 'Operação yStorage', initials: 'OP', avatar_color: '#3f9d8f', last_message: 'Diego: Coleta agendada para as 15h.', last_message_time: '11:20', unread_count: 1, is_muted: false, context: 'yStorage'},
    {id: 'grp-storage-sup', type: 'group', name: 'Suporte Interno', initials: 'SI', avatar_color: '#7a7f87', last_message: 'Heitor: Deploy concluído', last_message_time: 'Ontem', unread_count: 0, is_muted: false, context: 'yStorage'},
  ],
  threads: {
    'dm-u2': [
      {id: '1', kind: 'text', text: 'Ana, consegue confirmar o late check-out do 512?', is_mine: false, time: '09:14'},
      {id: '2', kind: 'text', text: 'Confirmado até as 13h. Já avisei a governança.', is_mine: true, time: '09:18', ticks: 'read'},
      {id: '3', kind: 'text', text: 'Perfeito, obrigado!', is_mine: false, time: '09:20'},
    ],
    'grp-recepcao': [
      {id: '1', kind: 'system', text: 'Você entrou no grupo', is_mine: false, time: ''},
      {id: '2', kind: 'text', text: 'Bom dia! Alguém cobre o turno da noite?', is_mine: false, author_name: 'Fábio Lima', author_color: '#5b8def', time: '08:45'},
      {id: '3', kind: 'text', text: 'Eu consigo até as 22h.', is_mine: false, author_name: 'Gabriela Souza', author_color: '#c9a227', time: '08:46'},
      {id: '4', kind: 'text', text: 'Fecho o restante com o Diego 👍', is_mine: true, time: '08:47', ticks: 'read'},
    ],
    'att-pedro': [
      {id: '1', kind: 'system', text: 'Conversa assumida por Você', is_mine: false, time: ''},
      {id: '2', kind: 'text', text: 'Oi! Consigo estender o checkout até 14h?', is_mine: false, author_name: 'Pedro Antunes', author_color: '#e0864f', time: '09:05'},
      {id: '3', kind: 'text', text: 'Olá, Pedro! Deixa eu verificar a disponibilidade da suíte.', is_mine: true, time: '09:06', ticks: 'read'},
    ],
    'dm-u3': [
      {id: '1', kind: 'text', text: 'Passo aí na recepção já já.', is_mine: false, time: 'Ontem'},
      {id: '2', kind: 'text', text: 'Combinado. Vejo em 5 min 👍', is_mine: true, time: 'Ontem', ticks: 'read'},
    ],
    'grp-midia': [
      {id: '1', kind: 'text', text: 'Fotos da suíte master prontas 📸', is_mine: false, author_name: 'Elisa Rocha', author_color: '#e0864f', time: 'Ontem'},
      {id: '1b', kind: 'image', text: '', image_uri: 'https://picsum.photos/seed/suite-master/1200/800', is_mine: false, author_name: 'Elisa Rocha', author_color: '#e0864f', time: 'Ontem'},
    ],
    'dm-u7': [
      {id: '1', kind: 'text', text: 'Reserva confirmada ✔', is_mine: false, time: 'Ter'},
    ],
    'grp-governanca': [
      {id: '1', kind: 'text', text: 'Enxoval reposto no 3º andar.', is_mine: false, author_name: 'Bruno Aguiar', author_color: '#3f9d8f', time: 'Ter'},
    ],
    'grp-storage-op': [
      {id: '1', kind: 'text', text: 'Coleta agendada para as 15h.', is_mine: false, author_name: 'Diego Matos', author_color: '#7a7f87', time: '11:20'},
    ],
    'grp-storage-sup': [
      {id: '1', kind: 'text', text: 'Deploy concluído ✅', is_mine: false, author_name: 'Heitor Alves', author_color: '#d15b5b', time: 'Ontem'},
    ],
  },
};

let messageSeq = 100;
export function nextMessageId(): string {
  messageSeq += 1;
  return String(messageSeq);
}
