"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User } from "@/types/chat";
import { useGetUserInfoQuery } from "@/queries/auth";

interface AuthContextType {
  user: User | null;
  setUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // get user info
  const {
    data: userData,
    isSuccess,
    isError: hasAuthError,
    isLoading: queryLoading,
  } = useGetUserInfoQuery();

  // handle auth error
  if (hasAuthError && typeof window !== "undefined") {
    localStorage.clear();
  }

  // derive user directly from query data
  const user = useMemo(() => {
    if (isSuccess && userData) {
      return {
        id: userData.id,
        name: userData.name,
        avatar: userData.avatar,
        isOnline: true,
      } as User;
    }
    return null;
  }, [isSuccess, userData]);

  // handle set user which updates the query cache
  const setUser = useCallback(
    (newUser: User) => {
      queryClient.setQueryData(["user-info"], {
        id: newUser.id,
        name: newUser.name,
        avatar: newUser.avatar,
      });
    },
    [queryClient]
  );

  // handle logout
  const logout = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    // invalidate and reset the user query
    queryClient.setQueryData(["user-info"], null);
    queryClient.invalidateQueries({ queryKey: ["user-info"] });
  }, [queryClient]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      setUser,
      isAuthenticated: !!user,
      isLoading: queryLoading,
      logout,
    }),
    [user, setUser, queryLoading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
