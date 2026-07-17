import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

/*
 * Prevents React Strict Mode from starting two anonymous sign-in
 * requests at the same time during development.
 */
let initializationPromise: Promise<Session> | null = null;

async function getOrCreateSession(): Promise<Session> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const {
        data: { session: existingSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (existingSession) {
        return existingSession;
      }

      const {
        data: { session: anonymousSession },
        error: signInError,
      } = await supabase.auth.signInAnonymously();

      if (signInError) {
        throw signInError;
      }

      if (!anonymousSession) {
        throw new Error(
          "Supabase did not return an anonymous session.",
        );
      }

      return anonymousSession;
    })();
  }

  try {
    return await initializationPromise;
  } finally {
    initializationPromise = null;
  }
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    /*
     * Keep React synchronized with future sign-ins,
     * token refreshes, and sign-outs.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!isMounted) {
          return;
        }

        setSession(nextSession);

        if (nextSession) {
          setError(null);
        }
      },
    );

    const initializeAuth = async () => {
      try {
        const initializedSession =
          await getOrCreateSession();

        if (!isMounted) {
          return;
        }

        setSession(initializedSession);
        setError(null);

      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unknown authentication error";

        console.error(
          "Could not initialize Supabase authentication:",
          message,
        );

        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      error,
    }),
    [session, loading, error],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Starting Lurqer...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            Lurqer could not start
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Unable to establish an anonymous session. Refresh the
            page and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used inside an AuthProvider.",
    );
  }

  return context;
}