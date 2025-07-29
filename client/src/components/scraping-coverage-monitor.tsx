import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ArrowLeft, 
  Calendar,
  Globe,
  TrendingDown,
  RefreshCw,
  Activity,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScrapingStats {
  venueId: number;
  venueName: string;
  slug: string;
  website: string | null;
  expectedEvents: number;
  actualEvents: number;
  coveragePercentage: number;
  lastSuccessfulScrape: Date | null;
  scrapingErrors: string[];
  isActive: boolean;
}

interface ScrapingReport {
  overallCoverage: number;
  totalMissedEvents: number;
  criticalVenues: string[];
  recommendations: string[];
}

interface DataQualityResults {
  duplicatesRemoved: number;
  ticketUrlsFixed: number;
  descriptionsAdded: number;
  doorTimesSet: number;
  artistLinksCreated: number;
  artistImagesAdded: number;
  qualityScoreImprovement: number;
  venuesImproved: number;
}

export function ScrapingCoverageMonitor() {
  const [selectedTimeframe, setSelectedTimeframe] = useState(3);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coverageStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/scraping/coverage', selectedTimeframe],
    queryFn: async () => {
      const response = await fetch(`/api/scraping/coverage?months=${selectedTimeframe}`);
      if (!response.ok) throw new Error('Failed to fetch coverage stats');
      return response.json() as Promise<ScrapingStats[]>;
    }
  });

  const { data: scrapingReport, isLoading: reportLoading } = useQuery({
    queryKey: ['/api/scraping/report'],
    queryFn: async () => {
      const response = await fetch('/api/scraping/report');
      if (!response.ok) throw new Error('Failed to fetch scraping report');
      return response.json() as Promise<ScrapingReport>;
    }
  });

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCoverageBadgeVariant = (percentage: number): "default" | "secondary" | "destructive" | "outline" => {
    if (percentage >= 80) return 'default';
    if (percentage >= 50) return 'secondary';
    return 'destructive';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/scraping/coverage'] });
    queryClient.invalidateQueries({ queryKey: ['/api/scraping/report'] });
    toast({
      title: "Data Refreshed",
      description: "Scraping coverage data has been updated."
    });
  };

  const closeGapsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/scrapers/close-coverage-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to close coverage gaps');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Coverage Gaps Closed",
        description: `Added ${data.results.totalAdded} events across critical venues`
      });
      refreshData();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to close coverage gaps. Please try again.",
        variant: "destructive"
      });
    }
  });

  const expandVenuesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/scrapers/expand-venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to expand venue events');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Venues Expanded",
        description: `Added ${data.results.totalAdded} events across all venues`
      });
      refreshData();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to expand venue events. Please try again.",
        variant: "destructive"
      });
    }
  });

  const comprehensiveExpansionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/scrapers/comprehensive-expansion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to perform comprehensive expansion');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Comprehensive Expansion Complete",
        description: `Added ${data.results.totalAdded} major artist events across all venues`
      });
      refreshData();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to perform comprehensive expansion. Please try again.",
        variant: "destructive"
      });
    }
  });

  const gamhAuthenticMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/scrapers/gamh-authentic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to run GAMH authentic scraper');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "GAMH Authentic Events Added",
        description: `Added ${data.eventsAdded} authentic events from Great American Music Hall`
      });
      refreshData();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add GAMH authentic events. Please try again.",
        variant: "destructive"
      });
    }
  });

  const gamhComprehensiveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/scrapers/gamh-comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to run GAMH comprehensive scraper');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "GAMH Comprehensive Events Added",
        description: `Added ${data.eventsAdded} events from full GAMH listing`
      });
      refreshData();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add GAMH comprehensive events. Please try again.",
        variant: "destructive"
      });
    }
  });

  const spotifyImagesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/enrichment/spotify-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to run Spotify image enrichment');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Spotify Images Added",
        description: `Enriched ${data.results.enriched} artists with authentic Spotify images`
      });
      refreshData();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to enrich artists with Spotify images. Please try again.",
        variant: "destructive"
      });
    }
  });

  if (statsLoading || reportLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Analyzing scraping coverage...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground">Events</Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/venues" className="text-sm text-muted-foreground hover:text-foreground">Venues</Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/data-quality" className="text-sm text-muted-foreground hover:text-foreground">Data Quality</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scraping Coverage Monitor</h1>
            <p className="text-muted-foreground mt-2">
              Track missing events and identify venues with poor scraping coverage
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedTimeframe} 
              onChange={(e) => setSelectedTimeframe(Number(e.target.value))}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value={1}>Last Month</option>
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last Year</option>
            </select>
            <Button onClick={refreshData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => closeGapsMutation.mutate()}
              disabled={closeGapsMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {closeGapsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Close Coverage Gaps
            </Button>
            <Button 
              onClick={() => expandVenuesMutation.mutate()}
              disabled={expandVenuesMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {expandVenuesMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Expand All Venues
            </Button>
            <Button 
              onClick={() => comprehensiveExpansionMutation.mutate()}
              disabled={comprehensiveExpansionMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {comprehensiveExpansionMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Comprehensive Expansion
            </Button>
            <Button 
              onClick={() => gamhAuthenticMutation.mutate()}
              disabled={gamhAuthenticMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {gamhAuthenticMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              GAMH Authentic Events
            </Button>
            <Button 
              onClick={() => gamhComprehensiveMutation.mutate()}
              disabled={gamhComprehensiveMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {gamhComprehensiveMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              GAMH Full Listing
            </Button>
            <Button 
              onClick={() => spotifyImagesMutation.mutate()}
              disabled={spotifyImagesMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {spotifyImagesMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Spotify Images
            </Button>
          </div>
        </div>

        {/* Critical Alert */}
        {scrapingReport && scrapingReport.overallCoverage < 70 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Critical Coverage Issue</AlertTitle>
            <AlertDescription className="text-red-700">
              Overall scraping coverage is only {scrapingReport.overallCoverage}%. 
              Estimated {scrapingReport.totalMissedEvents} events missing from platform.
            </AlertDescription>
          </Alert>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getCoverageColor(scrapingReport?.overallCoverage || 0)}`}>
                {scrapingReport?.overallCoverage || 0}%
              </div>
              <Progress value={scrapingReport?.overallCoverage || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Estimated Missing Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {scrapingReport?.totalMissedEvents || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In {selectedTimeframe} month{selectedTimeframe > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Venues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {scrapingReport?.criticalVenues.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Under 50% coverage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Venues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coverageStats?.filter(s => s.isActive).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recently scraped
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="coverage" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="coverage">Coverage Analysis</TabsTrigger>
            <TabsTrigger value="venues">Venue Details</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="coverage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Venue Coverage Overview</CardTitle>
                <CardDescription>
                  Expected vs actual events by venue over {selectedTimeframe} month{selectedTimeframe > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coverageStats?.map((stat: ScrapingStats) => (
                    <div key={stat.venueId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{stat.venueName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {stat.actualEvents} of {stat.expectedEvents} expected events
                          </p>
                        </div>
                        {stat.website && (
                          <a href={stat.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`font-medium ${getCoverageColor(stat.coveragePercentage)}`}>
                            {stat.coveragePercentage}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last: {formatDate(stat.lastSuccessfulScrape)}
                          </div>
                        </div>
                        <Progress value={stat.coveragePercentage} className="w-24" />
                        <Badge variant={getCoverageBadgeVariant(stat.coveragePercentage)}>
                          {stat.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="venues" className="space-y-4">
            {coverageStats?.map((stat: ScrapingStats) => (
              <Card key={stat.venueId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {stat.venueName}
                      {!stat.isActive && <XCircle className="h-5 w-5 text-red-500" />}
                    </CardTitle>
                    <Badge variant={getCoverageBadgeVariant(stat.coveragePercentage)}>
                      {stat.coveragePercentage}% Coverage
                    </Badge>
                  </div>
                  <CardDescription>
                    {stat.actualEvents} events found, {stat.expectedEvents} expected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Expected Events</div>
                      <div className="text-2xl font-bold">{stat.expectedEvents}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Actual Events</div>
                      <div className="text-2xl font-bold">{stat.actualEvents}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Missing Events:</span>
                      <span className="font-medium text-red-600">
                        {Math.max(0, stat.expectedEvents - stat.actualEvents)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Successful Scrape:</span>
                      <span>{formatDate(stat.lastSuccessfulScrape)}</span>
                    </div>
                  </div>

                  {stat.scrapingErrors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <div className="text-sm font-medium text-red-800 mb-2">Detected Issues:</div>
                      <ul className="text-sm text-red-700 space-y-1">
                        {stat.scrapingErrors.map((error, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scraping Improvement Recommendations</CardTitle>
                <CardDescription>
                  Actionable steps to improve event coverage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scrapingReport?.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-900">{rec}</p>
                    </div>
                  ))}
                  
                  {(!scrapingReport?.recommendations || scrapingReport.recommendations.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No specific recommendations at this time.</p>
                      <p className="text-sm">Coverage appears to be functioning well.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}