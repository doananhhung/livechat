// src/pages/auth/AuthCallbackPage.tsx
import { useEffect, useRef } from "react"; // 1. Import useRef
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { Spinner } from "../../components/ui/Spinner";
import { exchangeCodeForToken } from "../../services/authApi";
import { useToast } from "../../components/ui/use-toast";

export const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // 2. Get action from store in the correct React way
  const setAuthData = useAuthStore((state) => state.setAuthData);
  const { toast } = useToast();

  // 3. Use ref to ensure effect runs main logic only once
  const effectRan = useRef(false);

  useEffect(() => {
    // In dev environment with StrictMode, effect will run twice.
    // This ref will prevent API calls on the second run.
    if (effectRan.current === true) {
      return;
    }

    const code = searchParams.get("code");

    const handleExchangeCode = async (codeToExchange: string) => {
      try {
        const authData = await exchangeCodeForToken(codeToExchange);
        setAuthData(authData);
        toast({
          title: "Successfully authenticated!",
          description: "Welcome back.",
        });
        navigate("/inbox", { replace: true });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "The code is invalid or has expired. Please try again.",
        });
        navigate("/login", { replace: true });
      }
    };

    if (code) {
      handleExchangeCode(code);
    } else {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "No authentication code provided.",
      });
      navigate("/login", { replace: true });
    }

    // Mark that the effect has run the logic
    return () => {
      effectRan.current = true;
    };
    // 4. Dependency array is kept clean
  }, [searchParams, navigate, setAuthData, toast]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-10 w-10">
        <Spinner />
      </div>
      <p className="ml-4 text-muted-foreground">Authenticating...</p>
    </div>
  );
};
