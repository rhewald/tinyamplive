import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Users, Calendar, TrendingUp, ChevronRight } from "lucide-react";

export default function Cities() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const { data: cities } = useQuery({
    queryKey: ['/api/platform/cities'],
    initialData: [
      {
        id: 'san-francisco',
        name: 'San Francisco',
        status: 'active',
        venueCount: 8,
        eventCount: 282,
        userCount: 1247,
        topVenues: ['The Fillmore', 'Great American Music Hall', 'The Independent'],
        launchProgress: 100
      },
      {
        id: 'portland',
        name: 'Portland',
        status: 'coming-soon',
        venueCount: 12,
        eventCount: 0,
        userCount: 0,
        topVenues: ['Crystal Ballroom', 'Doug Fir Lounge', 'Hawthorne Theatre'],
        launchProgress: 75
      },
      {
        id: 'austin',
        name: 'Austin',
        status: 'coming-soon',
        venueCount: 15,
        eventCount: 0,
        userCount: 0,
        topVenues: ['Mohawk', 'Stubb\'s Bar-B-Q', 'The Continental Club'],
        launchProgress: 45
      },
      {
        id: 'nashville',
        name: 'Nashville',
        status: 'coming-soon',
        venueCount: 10,
        eventCount: 0,
        userCount: 0,
        topVenues: ['Ryman Auditorium', 'The Bluebird Cafe', 'Exit/In'],
        launchProgress: 30
      },
      {
        id: 'chicago',
        name: 'Chicago',
        status: 'requested',
        venueCount: 0,
        eventCount: 0,
        userCount: 0,
        topVenues: [],
        launchProgress: 0,
        requestCount: 89
      },
      {
        id: 'denver',
        name: 'Denver',
        status: 'requested',
        venueCount: 0,
        eventCount: 0,
        userCount: 0,
        topVenues: [],
        launchProgress: 0,
        requestCount: 67
      }
    ]
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'coming-soon': return 'bg-blue-500';
      case 'requested': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Live';
      case 'coming-soon': return 'Coming Soon';
      case 'requested': return 'Requested';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">TinyAmp Cities</h1>
          <p className="text-muted-text">
            Discover live music across multiple cities. Vote for your city to get it added next!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {cities?.map((city) => (
            <Card 
              key={city.id} 
              className={`bg-card-bg border-gray-700 hover:bg-card-hover hover:border-gray-600 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl ${
                selectedCity === city.id ? 'ring-2 ring-coral shadow-coral/25' : ''
              }`}
              onClick={() => setSelectedCity(city.id === selectedCity ? null : city.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">{city.name}</CardTitle>
                  <Badge 
                    className={`${getStatusColor(city.status)} text-white`}
                    variant="secondary"
                  >
                    {getStatusText(city.status)}
                  </Badge>
                </div>
                {city.status === 'coming-soon' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Launch Progress</span>
                      <span>{city.launchProgress}%</span>
                    </div>
                    <Progress value={city.launchProgress} className="h-2" />
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {city.status === 'active' && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-coral">{city.venueCount}</div>
                      <div className="text-xs text-gray-400">Venues</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-coral">{city.eventCount}</div>
                      <div className="text-xs text-gray-400">Events</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-coral">{city.userCount}</div>
                      <div className="text-xs text-gray-400">Users</div>
                    </div>
                  </div>
                )}

                {city.status === 'coming-soon' && (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium text-white">Top Venues:</span>
                      <div className="mt-1 text-gray-300">
                        {city.topVenues.slice(0, 2).map((venue, index) => (
                          <div key={index}>• {venue}</div>
                        ))}
                        {city.topVenues.length > 2 && (
                          <div>+ {city.topVenues.length - 2} more</div>
                        )}
                      </div>
                    </div>
                    <Button className="w-full" variant="outline" disabled>
                      <Calendar className="w-4 h-4 mr-2" />
                      Notify Me When Live
                    </Button>
                  </div>
                )}

                {city.status === 'requested' && (
                  <div className="space-y-3 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                        <Users className="w-4 h-4" />
                        {city.requestCount} people want this city
                      </div>
                      <div className="text-xs text-gray-400">
                        Help us reach 100 requests to prioritize this city
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Voting for ${city.name}`);
                      }}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Vote for {city.name}
                    </Button>
                  </div>
                )}

                {city.status === 'active' && (
                  <Button className="w-full bg-coral hover:bg-coral/80">
                    <MapPin className="w-4 h-4 mr-2" />
                    Explore {city.name}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-r from-coral/10 to-spotify-green/10 border-gray-700 hover:border-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl mb-8">
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="text-xl font-semibold text-white">Don't see your city?</h3>
            <p className="text-gray-300">
              Request a new city and help us understand where TinyAmp should expand next.
              We prioritize cities based on user demand and venue partnerships.
            </p>
            <Button size="lg" className="bg-coral hover:bg-coral/80">
              <MapPin className="w-4 h-4 mr-2" />
              Request Your City
            </Button>
          </CardContent>
        </Card>

        {selectedCity && (
          <Card className="bg-card-bg border-coral/30 shadow-lg shadow-coral/10">
            <CardHeader>
              <CardTitle className="text-white">
                {cities?.find(c => c.id === selectedCity)?.name} Expansion Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2 text-white">Launch Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Venue Partnerships</span>
                      <span className="text-green-400">✓ Complete</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Data Integration</span>
                      <span className="text-blue-400">In Progress</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Beta Testing</span>
                      <span className="text-gray-500">Planned</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Public Launch</span>
                      <span className="text-gray-500">Q2 2025</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-white">Key Venues</h4>
                  <div className="space-y-1 text-sm">
                    {cities?.find(c => c.id === selectedCity)?.topVenues.map((venue, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-3 h-3" />
                        {venue}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}