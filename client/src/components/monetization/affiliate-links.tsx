import { ExternalLink, Heart, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AffiliateLinksProps {
  venue?: {
    name: string;
    website?: string;
    ticketingPartners?: string[];
  };
  event?: {
    title: string;
    ticketUrl?: string;
    venueAffiliateCode?: string;
  };
}

// Major ticketing platforms for affiliate partnerships
const TICKETING_PARTNERS = {
  dice: {
    name: 'DICE',
    baseUrl: 'https://dice.fm',
    affiliateParam: 'ref',
    description: 'Discover and buy tickets to the best live music events'
  },
  eventbrite: {
    name: 'Eventbrite',
    baseUrl: 'https://eventbrite.com',
    affiliateParam: 'aff',
    description: 'Find and book independent music events'
  },
  resident_advisor: {
    name: 'Resident Advisor',
    baseUrl: 'https://ra.co',
    affiliateParam: 'partner',
    description: 'Electronic music events and tickets'
  },
  bandsintown: {
    name: 'Bandsintown',
    baseUrl: 'https://bandsintown.com',
    affiliateParam: 'came_from',
    description: 'Track artists and discover concerts'
  }
};

// Generate affiliate URL with tracking
function generateAffiliateUrl(baseUrl: string, affiliateCode: string, platform: string): string {
  const partner = TICKETING_PARTNERS[platform as keyof typeof TICKETING_PARTNERS];
  if (!partner) return baseUrl;
  
  const url = new URL(baseUrl);
  url.searchParams.set(partner.affiliateParam, `tinyamp-${affiliateCode}`);
  url.searchParams.set('utm_source', 'tinyamp');
  url.searchParams.set('utm_medium', 'affiliate');
  url.searchParams.set('utm_campaign', 'venue_referral');
  
  return url.toString();
}

export default function AffiliateLinks({ venue, event }: AffiliateLinksProps) {
  // Track affiliate clicks for analytics
  const trackAffiliateClick = (platform: string, type: 'venue' | 'ticket') => {
    // Analytics tracking would go here
    console.log(`Affiliate click: ${platform} - ${type}`);
  };

  return (
    <div className="space-y-4">
      {/* Direct venue support */}
      {venue?.website && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Support {venue.name} Directly
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Visit their website to book directly and support independent venues
                </p>
                <Button 
                  asChild
                  variant="outline"
                  size="sm"
                  onClick={() => trackAffiliateClick('direct', 'venue')}
                >
                  <a 
                    href={generateAffiliateUrl(venue.website, 'direct', 'venue')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Visit {venue.name}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <Badge variant="secondary">Direct Support</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket purchasing options */}
      {event?.ticketUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-green-600" />
                  Get Tickets for {event.title}
                </h4>
                <p className="text-sm text-gray-600">
                  Secure your spot at this independent music event
                </p>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Button 
                asChild
                className="bg-green-600 hover:bg-green-700"
                onClick={() => trackAffiliateClick('primary', 'ticket')}
              >
                <a 
                  href={generateAffiliateUrl(event.ticketUrl, event.venueAffiliateCode || 'general', 'primary')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  Buy Tickets Now
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              
              {/* Alternative ticketing platforms */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(TICKETING_PARTNERS).slice(0, 2).map(([key, partner]) => (
                  <Button 
                    key={key}
                    asChild
                    variant="outline"
                    size="sm"
                    onClick={() => trackAffiliateClick(key, 'ticket')}
                  >
                    <a 
                      href={generateAffiliateUrl(`${partner.baseUrl}/search`, 'tinyamp', key)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs"
                    >
                      {partner.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General music discovery affiliate links */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3">Discover More Music</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TICKETING_PARTNERS).map(([key, partner]) => (
              <Button 
                key={key}
                asChild
                variant="ghost"
                size="sm"
                className="justify-start text-xs"
                onClick={() => trackAffiliateClick(key, 'discovery')}
              >
                <a 
                  href={generateAffiliateUrl(partner.baseUrl, 'discovery', key)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  {partner.name}
                </a>
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            TinyAmp may earn a commission from these affiliate links, helping us support independent music discovery.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}