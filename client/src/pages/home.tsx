import Header from "@/components/header";
import Hero from "@/components/hero";
import QuickFilters from "@/components/quick-filters";
import UpcomingEvents from "@/components/upcoming-events";
import ArtistSpotlight from "@/components/artist-spotlight";
import VenueDirectory from "@/components/venue-directory";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <Hero />
      <QuickFilters />
      <UpcomingEvents />
      <ArtistSpotlight />
      <VenueDirectory />
      <Newsletter />
      <Footer />
    </div>
  );
}
