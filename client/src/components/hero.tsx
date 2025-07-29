import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative gradient-hero py-20">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-30">
        <img
          src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=800"
          alt="Concert stage with colorful lights"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Discover <span className="text-spotify-green">Independent</span><br />
            Music in <span className="text-coral">San Francisco</span>
          </h2>
          
          <p className="text-xl text-muted-text mb-8 max-w-2xl mx-auto">
            Find hidden gems, support local artists, and experience the vibrant indie music scene across SF's best venues.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events">
              <Button size="lg" className="bg-spotify-green hover:bg-green-600 text-black font-semibold">
                Browse Upcoming Shows
              </Button>
            </Link>
            <Link href="/artists">
              <Button size="lg" variant="outline" className="border-white hover:bg-white hover:text-black text-white font-semibold">
                Discover Artists
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
