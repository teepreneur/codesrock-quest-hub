import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, User, Video, Plus, ExternalLink, CheckCircle } from "lucide-react";
import { trainingService, TrainingSession } from "@/services/training.service";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Calendar() {
  const [upcomingSessions, setUpcomingSessions] = useState<TrainingSession[]>([]);
  const [pastSessions, setPastSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const [upcoming, past] = await Promise.all([
        trainingService.getUpcomingSessions(),
        trainingService.getPastSessions()
      ]);
      setUpcomingSessions(upcoming);
      setPastSessions(past);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load training calendar");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (session: TrainingSession) => {
    if (session.meeting_link) {
      window.open(session.meeting_link, '_blank');
      toast.success(`🎥 Joining session: ${session.title}`);
      try {
        await trainingService.attendSession(session.id);
        fetchSessions();
      } catch (error) {
        console.error("Failed to mark session attendance:", error);
      }
    } else {
      toast.error("Meeting link not available yet.");
    }
  };

  const handleRSVP = async (session: TrainingSession) => {
    try {
      await trainingService.rsvpToSession(session.id);
      toast.success(`✅ RSVP confirmed for ${session.title}`, {
        description: "We'll send you a reminder before the session starts",
      });
      fetchSessions(); // Refresh to show updated RSVP status
    } catch (error) {
      toast.error("Failed to RSVP. Please try again.");
    }
  };

  const handleAddToCalendar = (session: TrainingSession) => {
    // Simple way to add to Google Calendar
    const start = new Date(session.start_time).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(session.end_time).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(session.title)}&dates=${start}/${end}&details=${encodeURIComponent(session.description)}&location=${encodeURIComponent(session.meeting_link || 'Online')}`;
    window.open(url, '_blank');
    
    toast.success(`📅 Opening Google Calendar`, {
      description: session.title,
    });
  };

  const handleWatchRecording = (session: TrainingSession) => {
    if (session.recording_url) {
      window.open(session.recording_url, '_blank');
    } else {
      toast.info("Recording is still being processed.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Training Calendar 📅</h1>
        <p className="text-muted-foreground">
          Join live training sessions and access past recordings
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingSessions.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-secondary/10">
                <Video className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pastSessions.length}</p>
                <p className="text-sm text-muted-foreground">Available Recordings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {upcomingSessions.reduce((sum, s) => {
                    const duration = (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000;
                    return sum + duration;
                  }, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Live Minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Upcoming Sessions
          </CardTitle>
          <CardDescription>Live training sessions you can join</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <Card key={session.id} className="border-primary/20 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 text-center p-4 rounded-lg bg-primary/10 border border-primary/20 min-w-[80px]">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {new Date(session.start_time).getDate()}
                      </div>
                      <div className="text-sm text-muted-foreground uppercase">
                        {new Date(session.start_time).toLocaleDateString("en-US", { month: "short" })}
                      </div>
                    </div>

                    {/* Session Info */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{session.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{session.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            <span>{(new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000} mins</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{session.instructor}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {session.isLive ? (
                          <>
                            <Badge className="bg-green-500 hover:bg-green-600 animate-pulse px-3 py-1">
                              🔴 LIVE NOW
                            </Badge>
                            <Button
                              onClick={() => handleJoinSession(session)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Join Google Meet
                            </Button>
                          </>
                        ) : (
                          <>
                            {session.isRSVPed ? (
                              <Badge variant="outline" className="text-green-600 border-green-600 px-3 py-1">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Registered
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRSVP(session)}
                              >
                                RSVP Now
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddToCalendar(session)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add to Calendar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming sessions scheduled at the moment</p>
              <p className="text-sm">Check back soon for new training dates!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Sessions / Recordings */}
      {pastSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-secondary" />
              Past Session Recordings
            </CardTitle>
            <CardDescription>Watch recordings of previous training sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastSessions.map((session) => (
              <Card key={session.id} className="border-muted hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Video Icon */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <Video className="h-8 w-8 text-secondary" />
                    </div>

                    {/* Session Info */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{session.title}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span>Recorded: {new Date(session.start_time).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{session.instructor}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWatchRecording(session)}
                        className="mt-2"
                        disabled={!session.recording_url}
                      >
                        <Video className="mr-2 h-4 w-4" />
                        {session.recording_url ? "Watch Recording" : "Processing..."}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="border-muted bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Training Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • All live sessions are conducted via <strong>Google Meet</strong>. A link will appear when the session is live.
          </p>
          <p>
            • RSVP to sessions to receive reminders and ensure your spot.
          </p>
          <p>
            • Attending live sessions earns you <strong>XP</strong> towards your next level!
          </p>
          <p>
            • Technical issues? Contact <span className="text-primary font-medium">hello@codesrock.com</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
