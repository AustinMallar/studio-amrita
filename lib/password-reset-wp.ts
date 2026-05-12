import "server-only";

import { wpGraphQL } from "@/lib/wp-graphql";

const SEND_PASSWORD_RESET_EMAIL = `
  mutation StudioSendPasswordResetEmail($input: SendPasswordResetEmailInput!) {
    sendPasswordResetEmail(input: $input) {
      clientMutationId
    }
  }
`;

const RESET_USER_PASSWORD = `
  mutation StudioResetUserPassword($input: ResetUserPasswordInput!) {
    resetUserPassword(input: $input) {
      clientMutationId
    }
  }
`;

type SendPasswordResetPayload = {
  sendPasswordResetEmail?: { clientMutationId?: string | null } | null;
};

type ResetUserPasswordPayload = {
  resetUserPassword?: { clientMutationId?: string | null } | null;
};

export async function wpSendPasswordResetEmail(username: string) {
  const input = {
    clientMutationId: `studio-amrita-send-pw-reset-${Date.now()}`,
    username: username.trim(),
  };
  return wpGraphQL<SendPasswordResetPayload>(
    SEND_PASSWORD_RESET_EMAIL,
    { input },
    null,
    null
  );
}

export async function wpResetUserPassword(key: string, login: string, password: string) {
  const input = {
    clientMutationId: `studio-amrita-reset-pw-${Date.now()}`,
    key: key.trim(),
    login: login.trim(),
    password,
  };
  return wpGraphQL<ResetUserPasswordPayload>(RESET_USER_PASSWORD, { input }, null, null);
}
