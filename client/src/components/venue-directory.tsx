import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import VenueCard from "./venue-card";
import type { Venue } from "@shared/schema";

export default function VenueDirectory() {
  const { data: venuesData = [], isLoading } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
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
    <section className="py-16 bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-white">Popular Venues</h3>
          <Link href="/venues">
            <span className="text-spotify-green hover:text-green-400 font-medium cursor-pointer flex items-center">
              Explore All <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card-bg rounded-xl p-4 animate-pulse">
                <div className="w-full h-32 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-5 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-2 w-2/3"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-text text-lg">No venues available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {venues.slice(0, 4).map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
