import {User, UserAPI} from './UserTypes';

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function toUser(userAPI: UserAPI): User {
  return {
    id: userAPI.id,
    name: userAPI.full_name,
    role: userAPI.role,
    department: userAPI.department,
    email: userAPI.email,
    initials: initialsOf(userAPI.full_name),
    avatarColor: userAPI.avatar_color,
    isAdmin: userAPI.is_admin,
    online: userAPI.is_online,
  };
}

export const userAdapter = {toUser};
