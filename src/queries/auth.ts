import {
  getUserInfo,
  getUsersList,
  loginUser,
  signUpUser,
} from "@/services/auth";
import { TMutationOptions, TQueryOptions } from "@/types";
import { AuthFormValues, UserData, UsersDataList } from "@/types/auth";
import { useMutation, useQuery } from "@tanstack/react-query";

// get user info query
export const useGetUserInfoQuery = (queryOptions?: TQueryOptions<UserData>) => {
  return useQuery({
    queryKey: ["user-info"],
    queryFn: async () => {
      const response = await getUserInfo();
      return response.data;
    },
    ...queryOptions,
  });
};

// get users list query
export const useGetUsersListQuery = (
  queryOptions?: TQueryOptions<UsersDataList>
) => {
  return useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const response = await getUsersList();
      return response.data;
    },
    ...queryOptions,
  });
};

export const useAuthMutation = (
  formMode: "login" | "signUp",
  mutationOptions?: TMutationOptions<UserData, AuthFormValues>
) => {
  return useMutation({
    mutationFn: async (payload) => {
      const response =
        formMode === "login"
          ? await loginUser(payload)
          : await signUpUser(payload);
      return response.data;
    },
    ...mutationOptions,
  });
};
