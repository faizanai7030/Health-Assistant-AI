import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Login from "@/pages/login";
import { AuthProvider, useAuth } from "@/lib/auth";

import Dashboard from "@/pages/dashboard";
import Doctors from "@/pages/doctors";
import Appointments from "@/pages/appointments";
import Conversations from "@/pages/conversations";
import Simulator from "@/pages/simulator";
import Reminders from "@/pages/reminders";
import DoctorPortal from "@/pages/doctor-portal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/doctor-portal/:token" component={DoctorPortal} />
      <Route>
        {!user ? (
          <Login />
        ) : (
          <Layout>
            <Switch>
              <Route path="/">
                <Redirect to="/dashboard" />
              </Route>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/doctors" component={Doctors} />
              <Route path="/appointments" component={Appointments} />
              <Route path="/reminders" component={Reminders} />
              <Route path="/conversations" component={Conversations} />
              <Route path="/simulator" component={Simulator} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
