"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { AuthFormValues } from "@/types/auth";
import { useAuthMutation } from "@/queries/auth";
import { useAuth } from "@/context/AuthContext";

type AuthMode = "login" | "signUp";

const initialState = {
  name: "",
  email: "",
  password: "",
};

export function AuthenticationPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const { setUser } = useAuth();

  // react hook form
  const { handleSubmit, register, reset } = useForm({
    mode: "onChange",
    defaultValues: initialState,
  });

  // auth mutation
  const { mutate: postAuthData, isPending: isFormDataSubmitting } =
    useAuthMutation(mode, {
      onSuccess: (res: Record<string, any>) => {
        localStorage.setItem("accessToken", res.token);
        setUser({
          id: res.user.id,
          name: res.user.name,
          avatar: res.user.avatar,
          isOnline: true,
        });
      },
      onError: (error) => {
        toast.error(error.response.data.error);
      },
    });

  // reset form when mode changes
  useEffect(() => {
    reset(initialState);
  }, [mode, reset]);

  // handle form submit
  const onSubmit = (values: AuthFormValues) => {
    const { name, ...loginPayload } = values;

    postAuthData(mode === "login" ? loginPayload : values);
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signUp" : "login");
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-background__gradient" />
        <div className="auth-background__pattern" />
      </div>

      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* logo */}
        <div className="auth-logo">
          <div className="auth-logo__icon">
            <MessageCircle size={28} />
          </div>
          <h1 className="auth-logo__title">ChatSpace</h1>
          <p className="auth-logo__subtitle">
            Connect with everyone in real-time
          </p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="auth-form__title">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="auth-form__description">
                {mode === "login"
                  ? "Enter your credentials to join the chat"
                  : "Sign up to start chatting"}
              </p>

              <div className="auth-form__fields">
                {mode === "signUp" && (
                  <div className="auth-input-group">
                    <User className="auth-input-group__icon" size={18} />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Username"
                      className="auth-input"
                      autoComplete="name"
                      {...register("name", { required: true })}
                    />
                  </div>
                )}

                <div className="auth-input-group">
                  <Mail className="auth-input-group__icon" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    className="auth-input"
                    autoComplete="email"
                    {...register("email", { required: true })}
                  />
                </div>

                <div className="auth-input-group">
                  <Lock className="auth-input-group__icon" size={18} />
                  <Input
                    id="password"
                    placeholder="*******"
                    type="password"
                    className="auth-input"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    {...register("password", { required: true })}
                  />
                </div>
              </div>

              {/* submit button */}
              <Button
                type="submit"
                className="auth-submit"
                disabled={isFormDataSubmitting}
              >
                {isFormDataSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : mode === "login" ? (
                  <LogIn size={18} />
                ) : (
                  <UserPlus size={18} />
                )}
                {isFormDataSubmitting
                  ? "Please wait..."
                  : mode === "login"
                  ? "Sign in"
                  : "Create account"}
              </Button>
            </motion.div>
          </AnimatePresence>
        </form>

        {/* toggle mode */}
        <div className="auth-toggle">
          <span className="auth-toggle__text">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>

          <Button onClick={toggleMode} className="auth-toggle__button">
            {mode === "login" ? "Sign up" : "Sign in"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
