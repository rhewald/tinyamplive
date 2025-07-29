import { useState } from "react";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QuickFilters() {
  const [, setLocation] = useLocation();
  const [date, setDate] = useState("");
  const [genre, setGenre] = useState("");
  const [venue, setVenue] = useState("");

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams();
    
    let newDate = date;
    let newGenre = genre;
    let newVenue = venue;
    
    if (type === "date") newDate = value;
    if (type === "genre") newGenre = value;
    if (type === "venue") newVenue = value;

    // Update state
    setDate(newDate);
    setGenre(newGenre);
    setVenue(newVenue);

    // Build query params, excluding "all-*" values
    if (newDate && newDate !== "all-dates") params.append("date", newDate);
    if (newGenre && newGenre !== "all-genres") params.append("genre", newGenre);
    if (newVenue && newVenue !== "all-venues") params.append("venue", newVenue);

    // Navigate to events page with filters
    setLocation(`/events${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <section className="bg-card-bg py-6 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4 flex-wrap">
            <span className="text-sm font-medium text-muted-text">Filter by:</span>
            
            <Select value={date} onValueChange={(value) => handleFilterChange("date", value)}>
              <SelectTrigger className="bg-dark-bg border-gray-600 text-white w-32">
                <SelectValue placeholder="Today" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-dates">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="next-week">Next Week</SelectItem>
                <SelectItem value="weekend">This Weekend</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={genre} onValueChange={(value) => handleFilterChange("genre", value)}>
              <SelectTrigger className="bg-dark-bg border-gray-600 text-white w-40">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-genres">All Genres</SelectItem>
                <SelectItem value="Indie Rock">Indie Rock</SelectItem>
                <SelectItem value="Electronic">Electronic</SelectItem>
                <SelectItem value="Folk">Folk</SelectItem>
                <SelectItem value="Indie Folk">Indie Folk</SelectItem>
              </SelectContent>
            </Select>

            <Select value={venue} onValueChange={(value) => handleFilterChange("venue", value)}>
              <SelectTrigger className="bg-dark-bg border-gray-600 text-white w-40">
                <SelectValue placeholder="All Venues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-venues">All Venues</SelectItem>
                <SelectItem value="The Independent">The Independent</SelectItem>
                <SelectItem value="The Fillmore">The Fillmore</SelectItem>
                <SelectItem value="Cafe du Nord">Cafe du Nord</SelectItem>
                <SelectItem value="1015 Folsom">1015 Folsom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-text">
            Events available in San Francisco
          </div>
        </div>
      </div>
    </section>
  );
}
