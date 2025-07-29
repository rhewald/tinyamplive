import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SiSpotify, SiYoutube, SiInstagram, SiX, SiTiktok } from "react-icons/si";

export default function ArtistSpotlight() {
  // Using Echo Rivers as the spotlight artist from our seed data
  const spotlightArtist = {
    name: "Echo Rivers",
    slug: "echo-rivers",
    genre: "Indie Folk",
    location: "Oakland, CA",
    description: "Known for ethereal vocals and intricate guitar work, Echo Rivers has been captivating Bay Area audiences with emotionally charged performances that blend folk traditions with modern indie sensibilities.",
    imageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
    monthlyListeners: 34700,
    followers: 12300,
    upcomingShows: 3,
    nextShow: {
      venue: "The Chapel",
      date: "Dec 22 • 8:00 PM"
    },
    socialLinks: {
      instagram: "@echorivers",
      twitter: "@echorivers",
      tiktok: "@echorivers"
    }
  };

  return (
    <section className="gradient-spotlight py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold mb-2 text-white">Artist Spotlight</h3>
          <p className="text-muted-text">Discover rising talents in the SF indie scene</p>
        </div>
        
        <div className="bg-card-bg rounded-2xl p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <img
                src={spotlightArtist.imageUrl}
                alt={spotlightArtist.name}
                className="w-full rounded-xl shadow-2xl"
              />
            </div>
            
            <div>
              <h4 className="text-4xl font-bold mb-4 text-white">{spotlightArtist.name}</h4>
              <p className="text-lg text-muted-text mb-6">{spotlightArtist.genre} • {spotlightArtist.location}</p>
              <p className="text-gray-300 mb-6">{spotlightArtist.description}</p>
              
              {/* Social Media & Streaming Links */}
              <div className="flex items-center space-x-4 mb-6">
                <a href="#" className="text-spotify-green hover:text-green-400 text-2xl">
                  <SiSpotify />
                </a>
                <a href="#" className="text-red-500 hover:text-red-400 text-2xl">
                  <SiYoutube />
                </a>
                <a href="#" className="text-pink-500 hover:text-pink-400 text-2xl">
                  <SiInstagram />
                </a>
                <a href="#" className="text-blue-400 hover:text-blue-300 text-2xl">
                  <SiX />
                </a>
                <a href="#" className="text-white hover:text-gray-300 text-2xl">
                  <SiTiktok />
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-spotify-green">
                    {spotlightArtist.monthlyListeners.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-text">Monthly Listeners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-coral">
                    {spotlightArtist.followers.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-text">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {spotlightArtist.upcomingShows}
                  </div>
                  <div className="text-sm text-muted-text">Upcoming Shows</div>
                </div>
              </div>

              {/* Next Performance */}
              <div className="bg-dark-bg rounded-lg p-4">
                <h5 className="font-semibold mb-2 text-white">Next Performance</h5>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{spotlightArtist.nextShow.venue}</p>
                    <p className="text-sm text-muted-text">{spotlightArtist.nextShow.date}</p>
                  </div>
                  <Button className="bg-spotify-green hover:bg-green-600 text-black">
                    Get Tickets
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
