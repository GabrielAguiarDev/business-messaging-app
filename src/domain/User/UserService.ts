import {userAdapter} from './UserAdapter';
import {userApi} from './UserApi';
import {User} from './UserTypes';

async function getList(): Promise<User[]> {
  const users = await userApi.getList();
  return users.map(userAdapter.toUser);
}

export const userService = {getList};
