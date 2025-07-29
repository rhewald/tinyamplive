import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import EventCard from "./event-card";
import type { EventWithDetails } from "@shared/schema";

export default function FeaturedEvents() {
  const { data: events = [], isLoading } = useQuery<EventWithDetails[]>({
    queryKey: ['/api/events/featured'],
  });

  return (
    <section className="py-16 bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-white">Featured Events</h3>
          <Link href="/events">
            <span className="text-spotify-green hover:text-green-400 font-medium cursor-pointer flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card-bg rounded-xl p-6 animate-pulse">
                <div className="w-full h-48 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-text text-lg">No featured events at the moment.</p>
            <p className="text-muted-text mt-2">Check back soon for exciting shows!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
