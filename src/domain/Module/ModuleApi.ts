import {delay} from '@utils';

import {ModuleAPI, ModuleContentAPI} from './ModuleTypes';

/** MOCK — communities e conteúdo por módulo (fixtures do protótipo). */
const MOCK_MODULES: ModuleAPI[] = [
  {id: 'm1', name: 'Yago Colaborador', initials: 'YC', avatar_color: '#9079d7', unread_count: 3},
  {id: 'm2', name: 'yStorage', initials: 'yS', avatar_color: '#3f9d8f', unread_count: 0},
];

const MOCK_CONTENT: Record<string, ModuleContentAPI> = {
  m1: {
    announcement: {
      last_message: 'Carla Nunes: Novo protocolo de check-in a partir de segunda.',
      date: '09:12',
    },
    my_groups: [
      {id: 'grp-recepcao', name: 'Equipe Recepção', initials: 'ER', avatar_color: '#9079d7', last_message: 'Fábio: Alguém cobre o turno da noite?', time: '08:47', unread_count: 2, is_muted: false},
      {id: 'grp-midia', name: 'Mídia', initials: 'MI', avatar_color: '#e0864f', avatar_url: 'https://picsum.photos/seed/grupo-midia/900', last_message: 'Elisa: Fotos da suíte master prontas', time: 'Ontem', unread_count: 0, is_muted: false},
      {id: 'grp-governanca', name: 'Governança', initials: 'GO', avatar_color: '#3f9d8f', last_message: 'Bruno: Enxoval reposto no 3º andar.', time: 'Ter', unread_count: 0, is_muted: true},
    ],
    joinable_groups: [
      {id: 'jn-manut', name: 'Manutenção', initials: 'MA', avatar_color: '#7a7f87', members_count: 12},
      {id: 'jn-reservas', name: 'Reservas', initials: 'RE', avatar_color: '#c9a227', members_count: 8},
    ],
  },
  m2: {
    announcement: {
      last_message: 'Diego Matos: Inventário do galpão atualizado.',
      date: 'Ontem',
    },
    my_groups: [
      {id: 'grp-storage-op', name: 'Operação yStorage', initials: 'OP', avatar_color: '#3f9d8f', last_message: 'Diego: Coleta agendada para as 15h.', time: '11:20', unread_count: 1, is_muted: false},
      {id: 'grp-storage-sup', name: 'Suporte Interno', initials: 'SI', avatar_color: '#7a7f87', last_message: 'Heitor: Deploy concluído', time: 'Ontem', unread_count: 0, is_muted: false},
    ],
    joinable_groups: [
      {id: 'jn-fin', name: 'Financeiro', initials: 'FI', avatar_color: '#5b8def', members_count: 5},
    ],
  },
};

async function getModules(): Promise<ModuleAPI[]> {
  await delay(400);
  return MOCK_MODULES;
}

async function getModuleContent(moduleId: string): Promise<ModuleContentAPI> {
  await delay(350);
  const content = MOCK_CONTENT[moduleId];
  if (!content) {
    throw new Error('Módulo não encontrado');
  }
  return content;
}

export const moduleApi = {getModules, getModuleContent};
