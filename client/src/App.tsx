import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import Dashboard from "@/pages/dashboard";
import Auth from "@/pages/auth";
import Profile from "@/pages/profile";
import Checkout from "@/pages/checkout";
import EnrollmentSuccess from "@/pages/enrollment-success";
import { AuthProvider } from "./context/auth-context";
import { PageTransitionWrapper } from "@/components/ui/page-transition";
import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Global loading indicator for initial page load
const GlobalLoadingIndicator = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center"
    >
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </motion.div>
  </div>
);

// Route component with built-in loading state
const RouteWithTransition = ({ component: Component, ...rest }: { component: React.ComponentType<any>, [x: string]: any }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate a minimum loading time for smoother transitions
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen flex items-center justify-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen"
        >
          <Component {...rest} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function Router() {
  return (
    <PageTransitionWrapper>
      <Switch>
        <Route path="/" component={(props) => <RouteWithTransition component={Home} {...props} />} />
        <Route path="/courses" component={(props) => <RouteWithTransition component={Courses} {...props} />} />
        <Route path="/courses/:id" component={(props) => <RouteWithTransition component={CourseDetail} {...props} />} />
        <Route path="/checkout/:courseId" component={(props) => <RouteWithTransition component={Checkout} {...props} />} />
        <Route path="/enrollment-success" component={(props) => <RouteWithTransition component={EnrollmentSuccess} {...props} />} />
        <Route path="/dashboard" component={(props) => <RouteWithTransition component={Dashboard} {...props} />} />
        <Route path="/auth" component={(props) => <RouteWithTransition component={Auth} {...props} />} />
        <Route path="/profile" component={(props) => <RouteWithTransition component={Profile} {...props} />} />
        <Route component={(props) => <RouteWithTransition component={NotFound} {...props} />} />
      </Switch>
    </PageTransitionWrapper>
  );
}

// Navigation controls have been moved to MainNav and MobileNav components
// function NavigationControls() {
//   // This component is no longer used
// }

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AnimatePresence mode="wait">
          {isInitialLoading ? (
            <GlobalLoadingIndicator key="global-loader" />
          ) : (
            <Router key="router" />
          )}
        </AnimatePresence>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
