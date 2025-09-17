import { Switch, Route } from "wouter";
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/ui/navigation";
import { Dashboard } from "@/pages/dashboard";
import { RegistrationForm } from "@/pages/registration-form";
import { PageBuilder } from "@/pages/page-builder";
import { exportToExcel } from "@/lib/excel";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Registration, Event } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import AuthPage from "./pages/auth-page";
import UserManagementPage from "./pages/user-management";
import { Loader2 } from "lucide-react";

function MainApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  
  // All hooks must be called before any early returns - Fix for hook order violation
  const ready = !isLoading && !!user;
  const { data: registrations = [] } = useQuery<Registration[]>({
    queryKey: ["/api/registrations"],
    enabled: ready,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: ready,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/export");
    },
    onSuccess: () => {
      toast({
        title: "Export Started",
        description: "Your registration data is being prepared for download.",
      });
    },
  });

  const handleExport = async () => {
    try {
      await exportToExcel(registrations, events);
      exportMutation.mutate();
      toast({
        title: "Export Successful",
        description: "Registration data has been exported to Excel successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export registration data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // No early returns - render loading spinner conditionally in JSX
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <Route path="/register/:eventId">
        <RegistrationForm />
      </Route>
      
      <Route path="/admin/users" component={UserManagementPage} />
      
      <Route path="/">
        {isLoading ? (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : user ? (
          <div className="min-h-screen bg-background">
            <Navigation 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
              onExport={handleExport}
            />
            <main className="container mx-auto px-4 py-8">
              <Dashboard activeTab={activeTab} onTabChange={setActiveTab} />
            </main>
          </div>
        ) : (
          <AuthPage />
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <MainApp />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
