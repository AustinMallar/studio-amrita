import "server-only";

import { wpGraphQL } from "./wp-graphql";

const UPDATE_CUSTOMER_MUTATION = `
  mutation StudioAmritaUpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      customer {
        databaseId
        email
      }
    }
  }
`;

export async function updateCustomerMutation(
  authToken: string,
  input: Record<string, unknown>
) {
  const payload = {
    clientMutationId: `studio-amrita-account-${Date.now()}`,
    ...input,
  };

  return wpGraphQL<{
    updateCustomer?: { customer?: { databaseId?: number | null; email?: string | null } | null };
  }>(UPDATE_CUSTOMER_MUTATION, { input: payload }, null, authToken);
}
