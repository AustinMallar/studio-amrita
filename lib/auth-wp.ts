import "server-only";

import { wpGraphQL } from "./wp-graphql";

export type WpViewer = {
  id?: string | null;
  databaseId?: number | null;
  username?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

/** WPGraphQL JWT Authentication — input type is `LoginInput` on many installs (not `LoginUserInput`). */
const LOGIN_MUTATION = `
  mutation StudioAmritaLogin($input: LoginInput!) {
    login(input: $input) {
      authToken
      refreshToken
      user {
        id
        databaseId
        username
        email
      }
    }
  }
`;

const REGISTER_MUTATION = `
  mutation StudioAmritaRegister($input: RegisterUserInput!) {
    registerUser(input: $input) {
      user {
        id
        jwtAuthToken
        jwtRefreshToken
        username
        email
      }
    }
  }
`;

const VIEWER_QUERY = `
  query StudioAmritaViewer {
    viewer {
      id
      databaseId
      username
      email
      firstName
      lastName
    }
  }
`;

export function firstGraphQLErrorMessage(
  errors?: Array<{ message?: string }> | null
): string | null {
  const msg = errors?.[0]?.message;
  return typeof msg === "string" && msg.trim().length > 0 ? msg.trim() : null;
}

type LoginPayload = {
  login?: {
    authToken?: string | null;
    refreshToken?: string | null;
    user?: WpViewer | null;
  } | null;
};

export async function wpLogin(username: string, password: string) {
  const input = {
    clientMutationId: `studio-amrita-login-${Date.now()}`,
    username: username.trim(),
    password,
  };

  const result = await wpGraphQL<LoginPayload>(LOGIN_MUTATION, { input }, null, null);

  const token = result.data?.login?.authToken?.trim() ?? null;
  const user = result.data?.login?.user ?? null;
  return { result, token, user };
}

type RegisterPayload = {
  registerUser?: {
    user?: {
      jwtAuthToken?: string | null;
      jwtRefreshToken?: string | null;
      username?: string | null;
      email?: string | null;
      id?: string | null;
    } | null;
  } | null;
};

export async function wpRegister(input: {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) {
  const payload = {
    clientMutationId: `studio-amrita-register-${Date.now()}`,
    username: input.username.trim(),
    email: input.email.trim(),
    password: input.password,
    ...(input.firstName?.trim() ? { firstName: input.firstName.trim() } : {}),
    ...(input.lastName?.trim() ? { lastName: input.lastName.trim() } : {}),
  };

  const result = await wpGraphQL<RegisterPayload>(
    REGISTER_MUTATION,
    { input: payload },
    null,
    null
  );

  const regUser = result.data?.registerUser?.user ?? null;
  const jwtFromRegister = regUser?.jwtAuthToken?.trim() ?? null;

  if (result.errors?.length && !regUser) {
    return {
      result,
      token: null,
      user: null,
      source: "register" as const,
    };
  }

  if (jwtFromRegister) {
    return {
      result,
      token: jwtFromRegister,
      user: regUser,
      source: "register" as const,
    };
  }

  const loginAttempt = await wpLogin(input.username, input.password);
  return {
    result: loginAttempt.result,
    token: loginAttempt.token,
    user: loginAttempt.user,
    source: "loginAfterRegister" as const,
  };
}

export async function wpFetchViewer(authToken: string) {
  const result = await wpGraphQL<{ viewer?: WpViewer | null }>(
    VIEWER_QUERY,
    undefined,
    null,
    authToken
  );
  return result;
}
