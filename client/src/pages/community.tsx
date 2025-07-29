import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, MessageCircle, Calendar, Share2, Heart, MapPin } from "lucide-react";

export default function Community() {
  const [activeTab, setActiveTab] = useState<'meetups' | 'discussions' | 'groups'>('meetups');

  const { data: communityEvents } = useQuery({
    queryKey: ['/api/community/events'],
    initialData: [
      {
        id: 1,
        title: "Indie Rock Meetup at The Independent",
        venue: "The Independent",
        date: "2025-06-20",
        attendeeCount: 12,
        isJoined: false,
        discussionCount: 8
      },
      {
        id: 2,
        title: "Solo Concert Goers - Beach House",
        venue: "The Warfield",
        date: "2025-06-22",
        attendeeCount: 6,
        isJoined: true,
        discussionCount: 3
      }
    ]
  });

  const { data: meetupGroups } = useQuery({
    queryKey: ['/api/community/groups'],
    initialData: [
      {
        id: 1,
        name: "SF Indie Music Lovers",
        description: "For fans of indie rock, dream pop, and alternative music in SF",
        memberCount: 245,
        upcomingEvents: 8,
        tags: ["indie", "rock", "alternative"]
      },
      {
        id: 2,
        name: "Solo Concert Adventures",
        description: "Going to shows alone? Find your concert buddy here!",
        memberCount: 189,
        upcomingEvents: 12,
        tags: ["solo", "meetup", "all-genres"]
      },
      {
        id: 3,
        name: "Electronic Music SF",
        description: "House, techno, and electronic music enthusiasts",
        memberCount: 156,
        upcomingEvents: 5,
        tags: ["electronic", "house", "techno"]
      }
    ]
  });

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Music Community</h1>
          <p className="text-muted-text">Connect with fellow music lovers and discover new shows together</p>
        </div>

        <div className="flex gap-4 mb-8">
          <Button
            variant={activeTab === 'meetups' ? 'default' : 'outline'}
            onClick={() => setActiveTab('meetups')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Meetups
          </Button>
          <Button
            variant={activeTab === 'groups' ? 'default' : 'outline'}
            onClick={() => setActiveTab('groups')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Groups
          </Button>
          <Button
            variant={activeTab === 'discussions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('discussions')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Discussions
          </Button>
        </div>

        {activeTab === 'meetups' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Upcoming Concert Meetups</h2>
              <Button>Create Meetup</Button>
            </div>
            <div className="grid gap-6">
              {communityEvents?.map((event) => (
                <Card key={event.id} className="bg-card-bg border-gray-700 hover:bg-card-hover hover:border-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <h3 className="text-xl font-semibold text-white hover:text-coral transition-colors cursor-pointer">{event.title}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-text">
                            <MapPin className="w-4 h-4 text-accent-blue" />
                            <span className="text-white">{event.venue}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-text">
                            <Calendar className="w-4 h-4 text-accent-purple" />
                            <span className="text-white">{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-text">
                            <Users className="w-4 h-4 text-spotify-green" />
                            <span className="text-white font-medium">{event.attendeeCount}</span> going
                          </div>
                          <div className="flex items-center gap-2 text-muted-text">
                            <MessageCircle className="w-4 h-4 text-warning-orange" />
                            <span className="text-white font-medium">{event.discussionCount}</span> comments
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" className="border-gray-600 hover:border-gray-500">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant={event.isJoined ? "default" : "outline"}
                          className={event.isJoined ? "bg-spotify-green hover:bg-spotify-green/90" : "border-gray-600 hover:border-spotify-green hover:text-spotify-green"}
                        >
                          {event.isJoined ? "Joined" : "Join"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Music Communities</h2>
              <Button>Create Group</Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {meetupGroups?.map((group) => (
                <Card key={group.id} className="bg-card-bg border-gray-700 hover:bg-card-hover hover:border-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white">{group.name}</CardTitle>
                        <p className="text-gray-300 mt-2">{group.description}</p>
                      </div>
                      <Button size="sm">Join</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-gray-300 mb-4">
                      <span>{group.memberCount} members</span>
                      <span>{group.upcomingEvents} upcoming events</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {group.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'discussions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Music Scene Discussions</h2>
              <Button>Start Discussion</Button>
            </div>
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  title: "Best new venues opening in SF this year?",
                  author: "MusicLover23",
                  replies: 12,
                  lastActive: "2 hours ago",
                  likes: 8
                },
                {
                  id: 2,
                  title: "Anyone else think The Independent has the best sound system?",
                  author: "AudioPhile",
                  replies: 18,
                  lastActive: "4 hours ago",
                  likes: 15
                },
                {
                  id: 3,
                  title: "Hidden gems for discovering new artists in the Bay Area",
                  author: "SceneStealer",
                  replies: 7,
                  lastActive: "1 day ago",
                  likes: 22
                }
              ].map((discussion) => (
                <Card key={discussion.id} className="bg-card-bg border-gray-700 hover:bg-card-hover hover:border-gray-600 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <h3 className="text-lg font-semibold text-white hover:text-coral transition-colors">
                          {discussion.title}
                        </h3>
                        <div className="flex items-center gap-4 text-gray-400">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {discussion.author.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {discussion.author}
                          </div>
                          <span>{discussion.replies} replies</span>
                          <span>{discussion.lastActive}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Heart className="w-4 h-4" />
                        {discussion.likes}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}