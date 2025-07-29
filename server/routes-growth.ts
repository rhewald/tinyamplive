import type { Express } from "express";

export function registerGrowthRoutes(app: Express) {
  // Community events endpoint
  app.get("/api/community/events", async (req, res) => {
    try {
      // Mock community events data
      const communityEvents = [
        {
          id: 1,
          title: "Pre-show meetup for The Strokes",
          venue: "The Independent",
          date: "2025-01-15",
          attendeeCount: 23,
          discussionCount: 8,
          isJoined: false
        },
        {
          id: 2,
          title: "Indie rock listening party",
          venue: "Bottom of the Hill",
          date: "2025-01-20",
          attendeeCount: 15,
          discussionCount: 12,
          isJoined: true
        }
      ];
      res.json(communityEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch community events" });
    }
  });

  // Meetup groups endpoint
  app.get("/api/community/groups", async (req, res) => {
    try {
      const groups = [
        {
          id: 1,
          name: "SF Indie Music Lovers",
          description: "Weekly meetups for indie music enthusiasts",
          members: 156,
          nextEvent: "2025-01-18",
          isJoined: true
        },
        {
          id: 2,
          name: "Concert Buddies SF",
          description: "Find people to attend concerts with",
          members: 89,
          nextEvent: "2025-01-22",
          isJoined: false
        }
      ];
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meetup groups" });
    }
  });

  // Cities expansion endpoint
  app.get("/api/cities", async (req, res) => {
    try {
      const cities = [
        {
          id: "los-angeles",
          name: "Los Angeles",
          status: "coming-soon",
          progress: 75,
          venues: 45,
          estimatedLaunch: "Q2 2025"
        },
        {
          id: "new-york",
          name: "New York",
          status: "research",
          progress: 30,
          venues: 89,
          estimatedLaunch: "Q3 2025"
        },
        {
          id: "seattle",
          name: "Seattle",
          status: "planning",
          progress: 15,
          venues: 23,
          estimatedLaunch: "Q4 2025"
        }
      ];
      res.json(cities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });
}