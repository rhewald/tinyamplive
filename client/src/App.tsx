import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Events from "@/pages/events";
import Artists from "@/pages/artists";
import Venues from "@/pages/venues";
import EventDetail from "@/pages/event-detail";
import ArtistDetail from "@/pages/artist-detail";
import VenueDetail from "@/pages/venue-detail";
import AdminPage from "@/pages/admin";
import DataQualityPage from "@/pages/data-quality";
import ScrapingCoveragePage from "@/pages/scraping-coverage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/events" component={Events} />
      <Route path="/events/:slug" component={EventDetail} />
      <Route path="/artists" component={Artists} />
      <Route path="/artists/:slug" component={ArtistDetail} />
      <Route path="/venues" component={Venues} />
      <Route path="/venues/:slug" component={VenueDetail} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/data-quality" component={DataQualityPage} />
      <Route path="/scraping-coverage" component={ScrapingCoveragePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-dark-bg">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
