import {initialsOf, userAdapter} from '../UserAdapter';
import {UserAPI} from '../UserTypes';

describe('initialsOf', () => {
  it('usa primeira e última palavra do nome', () => {
    expect(initialsOf('Ana Prado')).toBe('AP');
    expect(initialsOf('Carla Nunes da Silva')).toBe('CS');
  });

  it('lida com nome único', () => {
    expect(initialsOf('Ana')).toBe('A');
  });
});

describe('userAdapter.toUser', () => {
  it('converte snake_case para o tipo de domínio', () => {
    const userAPI: UserAPI = {
      id: 'u2',
      full_name: 'Bruno Aguiar',
      role: 'Governança',
      department: 'Governança',
      email: 'bruno@yago.com',
      avatar_color: '#3f9d8f',
      is_admin: false,
      is_online: true,
    };

    expect(userAdapter.toUser(userAPI)).toEqual({
      id: 'u2',
      name: 'Bruno Aguiar',
      role: 'Governança',
      department: 'Governança',
      email: 'bruno@yago.com',
      initials: 'BA',
      avatarColor: '#3f9d8f',
      isAdmin: false,
      online: true,
    });
  });
});
