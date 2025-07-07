import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Incoming from "@/pages/incoming";
import Outgoing from "@/pages/outgoing";
import Reports from "@/pages/reports";
import Locations from "@/pages/locations";
import Layout from "@/components/layout";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <Layout><Dashboard /></Layout>} />
      <Route path="/dashboard" component={() => <Layout><Dashboard /></Layout>} />
      <Route path="/inventory" component={() => <Layout><Inventory /></Layout>} />
      <Route path="/incoming" component={() => <Layout><Incoming /></Layout>} />
      <Route path="/outgoing" component={() => <Layout><Outgoing /></Layout>} />
      <Route path="/reports" component={() => <Layout><Reports /></Layout>} />
      <Route path="/locations" component={() => <Layout><Locations /></Layout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
