import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import CareerDirection from "./pages/CareerDirection";
import Home from "./pages/Home";
import Outputs from "./pages/Outputs";
import Privacy from "./pages/Privacy";
import Shortlist from "./pages/Shortlist";
import Sources from "./pages/Sources";
import PublicPrivacy from "./pages/PublicPrivacy";
import PublicLanding from "./pages/PublicLanding";
import Terms from "./pages/Terms";
import Pricing from "./pages/Pricing";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={PublicLanding} />
      <Route path={"/app"} component={Home} />
      <Route path={"/shortlist"} component={Shortlist} />
      <Route path={"/outputs"} component={Outputs} />
      <Route path={"/privacy"} component={PublicPrivacy} />
      <Route path={"/terms"} component={Terms} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/data-privacy"} component={Privacy} />
      <Route path={"/sources"} component={Sources} />
      <Route path={"/direction"} component={CareerDirection} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <DashboardLayout><Router /></DashboardLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
