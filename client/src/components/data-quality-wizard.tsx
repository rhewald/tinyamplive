import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, XCircle, Wand2, TrendingUp, Database, Home, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QualityIssue {
  type: 'duplicate' | 'missing_ticket_url' | 'missing_description' | 'missing_doors' | 'missing_artist_link';
  severity: 'high' | 'medium' | 'low';
  count: number;
  description: string;
  fixable: boolean;
}

interface QualityReport {
  venueId: number;
  venueName: string;
  totalEvents: number;
  issues: QualityIssue[];
  qualityScore: number;
  recommendations: string[];
}

interface WizardResults {
  duplicatesRemoved: number;
  ticketUrlsFixed: number;
  descriptionsAdded: number;
  doorTimesSet: number;
  artistLinksCreated: number;
  qualityScoreImprovement: number;
  venuesImproved: number;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'default';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'high': return <XCircle className="h-4 w-4" />;
    case 'medium': return <AlertTriangle className="h-4 w-4" />;
    case 'low': return <CheckCircle className="h-4 w-4" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
};

export function DataQualityWizard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch quality analysis
  const { data: qualityReports, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery<QualityReport[]>({
    queryKey: ['/api/data-quality/analyze'],
    enabled: isAnalyzing
  });

  // Execute quality improvements
  const improvementMutation = useMutation<{ success: boolean; message: string; results: WizardResults }>({
    mutationFn: async () => {
      const response = await fetch('/api/data-quality/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to improve data quality');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Quality Improvements Complete",
        description: `Enhanced ${data.results.venuesImproved} venues with ${data.results.qualityScoreImprovement}% improvement`
      });
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      refetchAnalysis();
    },
    onError: (error) => {
      toast({
        title: "Improvement Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const startAnalysis = () => {
    setIsAnalyzing(true);
    refetchAnalysis();
  };

  const executeImprovements = () => {
    improvementMutation.mutate();
  };

  const totalIssues = qualityReports?.reduce((sum: number, report: QualityReport) => 
    sum + report.issues.reduce((issueSum: number, issue: QualityIssue) => issueSum + issue.count, 0), 0
  ) || 0;

  const averageQualityScore = qualityReports && qualityReports.length > 0 
    ? Math.round(qualityReports.reduce((sum: number, report: QualityReport) => sum + report.qualityScore, 0) / qualityReports.length)
    : 0;

  const highSeverityIssues = qualityReports?.reduce((sum: number, report: QualityReport) =>
    sum + report.issues.filter((i: QualityIssue) => i.severity === 'high').reduce((issueSum: number, issue: QualityIssue) => issueSum + issue.count, 0), 0
  ) || 0;

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
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Quality Wizard</h1>
          <p className="text-muted-foreground mt-2">
            Analyze and improve your venue data quality with one-click automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={startAnalysis}
            disabled={analysisLoading}
            variant="outline"
          >
            <Database className="h-4 w-4 mr-2" />
            {analysisLoading ? 'Analyzing...' : 'Analyze Data'}
          </Button>
          <Button 
            onClick={executeImprovements}
            disabled={!qualityReports || totalIssues === 0 || improvementMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {improvementMutation.isPending ? 'Improving...' : 'Fix All Issues'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {qualityReports && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageQualityScore}%</div>
              <Progress value={averageQualityScore} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalIssues}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all venues</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{highSeverityIssues}</div>
              <p className="text-xs text-muted-foreground mt-1">Critical issues</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Venues Analyzed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qualityReports?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">With events</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Display */}
      {showResults && improvementMutation.data && (
        <Alert className="border-green-200 bg-green-50">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Quality Improvements Completed!</AlertTitle>
          <AlertDescription className="text-green-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div>
                <div className="font-semibold">{improvementMutation.data.results.duplicatesRemoved}</div>
                <div className="text-sm">Duplicates Removed</div>
              </div>
              <div>
                <div className="font-semibold">{improvementMutation.data.results.ticketUrlsFixed}</div>
                <div className="text-sm">Ticket URLs Fixed</div>
              </div>
              <div>
                <div className="font-semibold">{improvementMutation.data.results.descriptionsAdded}</div>
                <div className="text-sm">Descriptions Added</div>
              </div>
              <div>
                <div className="font-semibold">{improvementMutation.data.results.doorTimesSet}</div>
                <div className="text-sm">Door Times Set</div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {qualityReports && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="venues">Venue Details</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Score Distribution</CardTitle>
                <CardDescription>
                  Venue performance across quality metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qualityReports?.map((report: QualityReport) => (
                    <div key={report.venueId} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{report.venueName}</h4>
                        <p className="text-sm text-muted-foreground">{report.totalEvents} events</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={report.qualityScore} className="w-24" />
                        <span className="font-medium">{report.qualityScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="venues" className="space-y-4">
            {qualityReports?.map((report: QualityReport) => (
              <Card key={report.venueId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{report.venueName}</CardTitle>
                    <Badge variant={report.qualityScore > 90 ? 'default' : report.qualityScore > 70 ? 'secondary' : 'destructive'}>
                      {report.qualityScore}% Quality
                    </Badge>
                  </div>
                  <CardDescription>
                    {report.totalEvents} events • {report.issues.length} issue types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.issues.map((issue: QualityIssue, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <div className="flex items-center gap-3">
                          {getSeverityIcon(issue.severity)}
                          <div>
                            <p className="font-medium">{issue.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {issue.fixable ? 'Auto-fixable' : 'Manual review needed'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Venue-Specific Recommendations</CardTitle>
                <CardDescription>
                  Targeted improvements based on successful patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {qualityReports?.map((report: QualityReport) => (
                    <div key={report.venueId}>
                      <h4 className="font-medium mb-3">{report.venueName}</h4>
                      <div className="space-y-2">
                        {report.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-900">{rec}</p>
                          </div>
                        ))}
                      </div>
                      {qualityReports && report !== qualityReports[qualityReports.length - 1] && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Getting Started */}
      {!isAnalyzing && !qualityReports && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Analyze your venue data to identify quality issues and improvement opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">What We Check</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Duplicate events</li>
                    <li>• Missing ticket URLs</li>
                    <li>• Incomplete descriptions</li>
                    <li>• Missing door times</li>
                    <li>• Unlinked artists</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">What We Fix</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Remove duplicate entries</li>
                    <li>• Add venue-specific ticket URLs</li>
                    <li>• Generate event descriptions</li>
                    <li>• Set standard door times</li>
                    <li>• Create missing artist records</li>
                  </ul>
                </div>
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Safe Improvements</AlertTitle>
                <AlertDescription>
                  All improvements are based on proven patterns from successfully populated venues. 
                  No authentic data will be lost or modified.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}