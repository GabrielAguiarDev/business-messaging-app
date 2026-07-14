import {delay} from '@utils';

import {UserAPI} from './UserTypes';

/** MOCK — diretório da empresa (usuários do protótipo). */
const MOCK_DIRECTORY: UserAPI[] = [
  {id: 'u2', full_name: 'Bruno Aguiar', role: 'Governança', department: 'Governança', email: 'bruno.aguiar@yago.com', avatar_color: '#3f9d8f', is_admin: false, is_online: true},
  {id: 'u3', full_name: 'Carla Nunes', role: 'Supervisão · Atendimento', department: 'Atendimento', email: 'carla.nunes@yago.com', avatar_color: '#c85c8e', is_admin: true, is_online: true},
  {id: 'u4', full_name: 'Diego Matos', role: 'Manutenção', department: 'Manutenção', email: 'diego.matos@yago.com', avatar_color: '#7a7f87', is_admin: false, is_online: false},
  {id: 'u5', full_name: 'Elisa Rocha', role: 'Mídia & Marketing', department: 'Marketing', email: 'elisa.rocha@yago.com', avatar_color: '#e0864f', is_admin: false, is_online: true},
  {id: 'u6', full_name: 'Fábio Lima', role: 'Recepção', department: 'Recepção', email: 'fabio.lima@yago.com', avatar_color: '#5b8def', is_admin: false, is_online: false},
  {id: 'u7', full_name: 'Gabriela Souza', role: 'Reservas', department: 'Reservas', email: 'gabriela.souza@yago.com', avatar_color: '#c9a227', is_admin: false, is_online: true},
  {id: 'u8', full_name: 'Heitor Alves', role: 'TI', department: 'TI', email: 'heitor.alves@yago.com', avatar_color: '#d15b5b', is_admin: false, is_online: false},
];

async function getList(): Promise<UserAPI[]> {
  await delay(400);
  return MOCK_DIRECTORY;
}

async function getById(id: string): Promise<UserAPI> {
  await delay(200);
  const user = MOCK_DIRECTORY.find(u => u.id === id);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
  return user;
}

export const userApi = {getList, getById};
