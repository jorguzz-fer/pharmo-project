import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Proposal from "@/pages/proposal";
import ConsultantForm from "@/pages/form";
import AdminLayout from "@/pages/admin/AdminLayout";
import PropostasList from "@/pages/admin/PropostasList";
import PropostaWizard from "@/pages/admin/PropostaWizard";
import PropostasDashboard from "@/pages/admin/PropostasDashboard";
import PropostaDetails from "@/pages/admin/PropostaDetails";
import AdminConsultores from "@/pages/admin/AdminConsultores";
import AdminMetasProposta from "@/pages/admin/AdminMetasProposta";

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Existing routes */}
      <Route path="/" component={ConsultantForm} />
      <Route path="/proposta" component={Proposal} />

      {/* Admin routes */}
      <Route path="/admin/propostas">
        <AdminRoute component={PropostasList} />
      </Route>
      <Route path="/admin/propostas/nova">
        <AdminRoute component={PropostaWizard} />
      </Route>
      <Route path="/admin/propostas/dashboard">
        <AdminRoute component={PropostasDashboard} />
      </Route>
      <Route path="/admin/propostas/:id">
        <AdminRoute component={PropostaDetails} />
      </Route>
      <Route path="/admin/consultores">
        <AdminRoute component={AdminConsultores} />
      </Route>
      <Route path="/admin/metas">
        <AdminRoute component={AdminMetasProposta} />
      </Route>

      {/* 404 */}
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
