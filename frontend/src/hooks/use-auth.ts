import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginThunk, logout as logoutAction, selectCurrentUser, selectIsAuthenticated } from "@/store/authSlice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      await dispatch(loginThunk({ email, password })).unwrap();
    },
    [dispatch],
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  return { user, isAuthenticated, login, logout };
}
