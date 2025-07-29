import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function DataSourceNotice() {
  return (
    <Alert className="mb-6 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
      <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription className="text-yellow-800 dark:text-yellow-300">
        <strong>Development Notice:</strong> Currently showing sample event data for demonstration. 
        To display real SF venue events, we need to implement web scraping or integrate with 
        ticketing APIs like Bandsintown, Ticketmaster, or venue management systems.
      </AlertDescription>
    </Alert>
  );
}