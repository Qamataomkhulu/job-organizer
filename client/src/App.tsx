import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { useEffect, useState } from "react";
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
import StaticDemo from "./pages/StaticDemo";

function useHashLocation(): [string, (path: string) => void] {
  const read = () => window.location.hash.replace(/^#/, "") || "/";
  const [location, setLocation] = useState(read);
  useEffect(() => {
    const onHashChange = () => setLocation(read());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return [location, path => { window.location.hash = path; setLocation(path); }];
}
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <WouterRouter hook={useHashLocation}>
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
    </WouterRouter>
  );
}

function StaticRouter() {
  return (
    <WouterRouter hook={useHashLocation}>
      <Switch>
        <Route path="/" component={PublicLanding} />
        <Route path="/demo" component={StaticDemo} />
        <Route path="/app" component={StaticDemo} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={PublicPrivacy} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  if (import.meta.env.VITE_STATIC_DEMO === "true") {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <StaticRouter />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }
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
