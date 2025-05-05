import { useLocation } from "wouter";
import { useEffect } from "react";
import MainNav from "@/components/ui/main-nav";
import Footer from "@/components/ui/footer";
import AuthForm from "@/components/ui/auth-form";
import { useAuth } from "@/context/auth-context";

export default function Auth() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  
  // Parse the query parameter to determine if we're in login or register mode
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const mode = searchParams.get("mode") === "register" ? "register" : "login";

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      
      <main className="flex-grow flex items-center justify-center bg-background py-12">
        <div className="w-full max-w-md px-4">
          <AuthForm initialMode={mode} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
