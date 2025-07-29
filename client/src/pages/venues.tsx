import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import VenueCard from "@/components/venue-card";
import type { Venue } from "@shared/schema";

export default function Venues() {
  const { data: venuesData = [], isLoading } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
    queryFn: async () => {
      const response = await fetch('/api/venues');
      if (!response.ok) throw new Error('Failed to fetch venues');
      return response.json();
    }
  });

  // Function to get sortable name (removing common prepositions)
  const getSortableName = (name: string) => {
    const prepositions = ['The', 'A', 'An'];
    for (const prep of prepositions) {
      if (name.startsWith(prep + ' ')) {
        return name.substring(prep.length + 1);
      }
    }
    return name;
  };

  // Sort venues alphabetically, ignoring prepositions
  const venues = venuesData.sort((a, b) => 
    getSortableName(a.name).localeCompare(getSortableName(b.name))
  );

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Venues</h1>
          <p className="text-muted-text">Explore the best independent music venues in San Francisco</p>
        </div>

        {/* Venues Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card-bg rounded-xl p-6 animate-pulse">
                <div className="w-full h-32 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-text text-lg">No venues found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
