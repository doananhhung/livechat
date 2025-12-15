import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
// FIX: Import new verify2FA function
import { verify2FA } from "../../services/authApi";
import AuthLayout from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/use-toast";
import { PinInput } from "../../components/ui/PinInput";

const Verify2faPage = () => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      // Call the imported verify2FA function
      const response = await verify2FA(code);
      // Save token and user information to store
      login(response.user, response.accessToken);
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "The code is incorrect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Two-Factor Authentication">
      <p className="text-center text-sm text-muted-foreground mb-4">
        Please enter the 6-digit code from your authenticator app.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PinInput length={6} onComplete={setCode} />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Verify"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Verify2faPage;
