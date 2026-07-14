import {ChannelQueuesAPI} from './AttendanceTypes';

/** "Banco" em memória do MOCK de atendimento (fixtures do protótipo). */
interface ChannelBaseAPI {
  id: string;
  name: string;
  initials: string;
  avatar_color: string;
  product: string;
}

interface AttendanceMockDb {
  channels: ChannelBaseAPI[];
  queues: Record<string, ChannelQueuesAPI>;
}

export const attendanceMockDb: AttendanceMockDb = {
  channels: [
    {id: 'c1', name: 'Yago', initials: 'Y', avatar_color: '#e0864f', product: 'App do Hóspede'},
    {id: 'c2', name: 'Porto Seguro Shopping', initials: 'PS', avatar_color: '#5b8def', product: 'App / Totem'},
  ],
  queues: {
    c1: {
      aguardando: [
        {id: 'w1', name: 'Marina Costa', initials: 'MC', avatar_color: '#c85c8e', preview: 'A chave digital não abriu o quarto 207.', time: '09:31'},
        {id: 'w2', name: 'Rafael Dias', initials: 'RD', avatar_color: '#5b8def', preview: 'Tem estacionamento para vans grandes?', time: '09:28'},
        {id: 'w3', name: 'Sofia Meireles', initials: 'SM', avatar_color: '#c9a227', preview: 'Consigo early check-in amanhã?', time: '09:15'},
      ],
      atendimento: [
        {id: 'att-pedro', name: 'Pedro Antunes', initials: 'PA', avatar_color: '#e0864f', preview: 'Consigo estender o checkout até 14h?', time: '09:05', assigned_to: 'Você'},
        {id: 'att-joao', name: 'João Pádua', initials: 'JP', avatar_color: '#3f9d8f', preview: 'Ok, vou verificar a disponibilidade.', time: '09:02', assigned_to: 'Carla Nunes'},
      ],
      resolvidas: [
        {id: 'att-lucia', name: 'Lúcia Faria', initials: 'LF', avatar_color: '#9079d7', preview: 'Obrigada, resolvido!', time: 'Ontem', assigned_to: 'Fábio Lima'},
      ],
    },
    c2: {
      aguardando: [],
      atendimento: [],
      resolvidas: [
        {id: 'att-totem', name: 'Cliente Totem 04', initials: 'T4', avatar_color: '#7a7f87', preview: 'Onde fica a loja âncora?', time: 'Ontem', assigned_to: 'Carla Nunes'},
      ],
    },
  },
};
