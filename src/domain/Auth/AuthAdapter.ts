import {userAdapter} from '../User';
import {AuthCredentials, AuthCredentialsAPI} from './AuthTypes';

function toAuthCredentials(
  credentialsAPI: AuthCredentialsAPI,
): AuthCredentials {
  return {
    token: credentialsAPI.token,
    user: userAdapter.toUser(credentialsAPI.user),
  };
}

export const authAdapter = {toAuthCredentials};
