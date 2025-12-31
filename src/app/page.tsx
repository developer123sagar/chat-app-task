"use client";

import { ChatContainer } from "@/components/chat/ChatContainer";
import { AuthenticationPage } from "@/components/auth/Authentication";
import { useAuth } from "@/context/AuthContext";
import LoadingPage from "@/components/loading";

export default function Home() {
  const { user, isLoading } = useAuth();

  // show loading state while checking authentication
  if (isLoading) return <LoadingPage />;

  return user ? <ChatContainer /> : <AuthenticationPage />;
}
