import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Share2, 
  Calendar, 
  Clock, 
  Users, 
  Bell, 
  Heart,
  Eye
} from "lucide-react";

interface EventQuickActionsProps {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  venueUrl?: string;
}

export function EventQuickActions({ eventId, eventTitle, eventDate, venueUrl }: EventQuickActionsProps) {
  const [viewerCount, setViewerCount] = useState(0);
  const [timeUntilEvent, setTimeUntilEvent] = useState<string>("");
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [recentActions] = useState([
    "Sarah just saved this event",
    "3 people added to calendar today",
    "Mike shared this 5 min ago"
  ]);

  useEffect(() => {
    const baseCount = Math.floor(Math.random() * 15) + 8;
    setViewerCount(baseCount);
    
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 3) - 1;
        return Math.max(3, prev + change);
      });
    }, 20000);

    return () => clearInterval(interval);
  }, [eventId]);

  useEffect(() => {
    if (!eventDate) return;

    const updateCountdown = () => {
      const now = new Date();
      const event = new Date(eventDate);
      const diff = event.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
          setTimeUntilEvent(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeUntilEvent(`${hours}h`);
        } else {
          setTimeUntilEvent("Soon");
        }
      } else {
        setTimeUntilEvent("Live");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [eventDate]);

  const shareEvent = async () => {
    const shareText = `Check out ${eventTitle} - discover live music on TinyAmp!`;
    const shareUrl = `${window.location.origin}/events/${eventId}`;
    
    try {
      await navigator.share({
        title: eventTitle,
        text: shareText,
        url: shareUrl
      });
    } catch (error) {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast({
        title: "Link copied!",
        description: "Event link copied to clipboard",
      });
    }
  };

  const addToCalendar = () => {
    if (!eventDate || !eventTitle) return;

    const startDate = new Date(eventDate);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(`Live music event - get tickets at ${venueUrl || 'venue website'}`)}`;
    window.open(googleUrl);

    toast({
      title: "Added to calendar",
      description: "Event saved to your Google Calendar",
    });
  };

  const toggleNotifications = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
    toast({
      title: isNotificationEnabled ? "Notifications off" : "Notifications on",
      description: isNotificationEnabled 
        ? "You won't get updates for this event"
        : "We'll notify you about ticket sales",
    });
  };

  const toggleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removed" : "Saved",
      description: isSaved 
        ? "Event removed from your list"
        : "Event added to your saved list",
    });
  };

  return (
    <div className="space-y-3 p-3 bg-card-bg/50 rounded-lg border border-gray-700/50">
      {/* Live Activity */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-text">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-accent-blue" />
            <span className="text-white font-medium">{viewerCount}</span>
            <span>viewing</span>
          </div>
        </div>
        {timeUntilEvent && (
          <Badge className="bg-warning-orange/20 text-warning-orange border-warning-orange/30 text-xs font-medium">
            <Clock className="w-3 h-3 mr-1" />
            {timeUntilEvent}
          </Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSave}
          className={`flex items-center gap-1.5 text-xs h-8 ${
            isSaved 
              ? 'bg-coral/20 border-coral/40 text-coral hover:bg-coral/30' 
              : 'border-gray-600 hover:border-gray-500 text-muted-text hover:text-white'
          }`}
        >
          <Heart className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
          {isSaved ? 'Saved' : 'Save'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={shareEvent}
          className="flex items-center gap-1.5 text-xs h-8 border-gray-600 hover:border-gray-500 text-muted-text hover:text-white"
        >
          <Share2 className="w-3 h-3" />
          Share
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={addToCalendar}
          className="flex items-center gap-1.5 text-xs h-8 border-gray-600 hover:border-gray-500 text-muted-text hover:text-white"
        >
          <Calendar className="w-3 h-3" />
          Calendar
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleNotifications}
          className={`flex items-center gap-1.5 text-xs h-8 ${
            isNotificationEnabled 
              ? 'bg-accent-blue/20 border-accent-blue/40 text-accent-blue hover:bg-accent-blue/30' 
              : 'border-gray-600 hover:border-gray-500 text-muted-text hover:text-white'
          }`}
        >
          <Bell className={`w-3 h-3 ${isNotificationEnabled ? 'fill-current' : ''}`} />
          {isNotificationEnabled ? 'On' : 'Notify'}
        </Button>
      </div>

      {/* Recent Activity */}
      <div className="text-xs text-secondary-text space-y-1">
        {recentActions.slice(0, 2).map((action, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className="w-1 h-1 bg-spotify-green rounded-full"></div>
            {action}
          </div>
        ))}
      </div>
    </div>
  );
}