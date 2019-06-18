export interface FirebaseAuthResponse {
  kind: string;
  localId: string;
  email: string;
  idToken: string;
  registered?: boolean;
  refreshToken: string;
  expiresIn: string;
}

// registered?: = means its optional, we dont get this when we sign up, we only get it when we registers
// example

// {
//     "kind": "identitytoolkit#SignupNewUserResponse",
//     "idToken": "[ID_TOKEN]",
//     "email": "[user@example.com]",
//     "refreshToken": "[REFRESH_TOKEN]",
//     "expiresIn": "3600",
//     "localId": "tRcfmLH7..."
// }
