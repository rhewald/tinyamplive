import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ArtistCard from "@/components/artist-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Artist } from "@shared/schema";

export default function Artists() {
  const [search, setSearch] = useState("");

  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ['/api/artists', { search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/artists?${params}`);
      if (!response.ok) throw new Error('Failed to fetch artists');
      return response.json();
    }
  });

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Artists</h1>
          <p className="text-muted-text">Discover talented independent artists in the Bay Area</p>
        </div>

        {/* Search */}
        <div className="bg-card-bg rounded-lg p-6 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-text h-4 w-4" />
            <Input
              placeholder="Search artists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-dark-bg border-gray-600 text-white"
            />
          </div>
          
          <div className="mt-4 text-sm text-muted-text">
            {artists.length} artists found
          </div>
        </div>

        {/* Artists Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card-bg rounded-xl p-6 animate-pulse">
                <div className="w-full h-48 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-text text-lg">No artists found matching your search.</p>
            <p className="text-muted-text mt-2">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
