import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Database, BarChart3, Wand2, Activity, ArrowLeft } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground">Events</Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/venues" className="text-sm text-muted-foreground hover:text-foreground">Venues</Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/artists" className="text-sm text-muted-foreground hover:text-foreground">Artists</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">
            Monitor venue data quality and scraping coverage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/data-quality">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Data Quality Wizard
                </CardTitle>
                <CardDescription>
                  Analyze and improve venue data quality with one-click automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Automated</Badge>
                  <Badge variant="outline">Quality Control</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/scraping-coverage">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Scraping Coverage Monitor
                </CardTitle>
                <CardDescription>
                  Track missing events and identify venues with poor scraping coverage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Critical</Badge>
                  <Badge variant="outline">Coverage Analysis</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Management
              </CardTitle>
              <CardDescription>
                Manage venue, artist, and event data directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>
                View platform usage and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Integrity Notice */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              Authentic Data Commitment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 dark:text-blue-200">
              TinyAmp maintains strict data integrity standards. All event information comes directly 
              from authentic venue sources. The platform never generates synthetic or placeholder 
              events, ensuring users can trust the accuracy of event listings and ticket purchase links.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}