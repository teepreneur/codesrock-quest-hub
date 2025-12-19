import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, User, Video, Plus } from "lucide-react";
import { trainingSessions } from "@/lib/mockData";
import { toast } from "sonner";

export default function Calendar() {
  const upcomingSessions = trainingSessions.filter((session) => !session.isPast);
  const pastSessions = trainingSessions.filter((session) => session.isPast);

  const handleJoinSession = (session: typeof trainingSessions[0]) => {
    if (session.isLive) {
      toast.success(`🎥 Joining session: ${session.title}`);
    } else {
      toast.info(`📅 This session starts on ${session.date} at ${session.time}`);
    }
  };

  const handleRSVP = (session: typeof trainingSessions[0]) => {
    toast.success(`✅ RSVP confirmed for ${session.title}`, {
      description: "We'll send you a reminder before the session starts",
    });
  };

  const handleAddToCalendar = (session: typeof trainingSessions[0]) => {
    toast.success(`📅 Added to your calendar`, {
      description: session.title,
    });
  };

  const handleWatchRecording = (session: typeof trainingSessions[0]) => {
    toast.success(`🎥 Opening recording: ${session.title}`);
  };

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
                  {trainingSessions.reduce((sum, s) => sum + s.duration, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Minutes</p>
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
                    <div className="flex-shrink-0 text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {new Date(session.date).getDate()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(session.date).toLocaleDateString("en-US", { month: "short" })}
                      </div>
                    </div>

                    {/* Session Info */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{session.title}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{session.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            <span>{session.duration} minutes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{session.trainer}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {session.isLive ? (
                          <>
                            <Badge className="bg-green-500 hover:bg-green-600 animate-pulse">
                              🔴 LIVE NOW
                            </Badge>
                            <Button
                              onClick={() => handleJoinSession(session)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              Join Session
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRSVP(session)}
                            >
                              RSVP
                            </Button>
                            <Button
                              variant="outline"
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
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming sessions scheduled</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Sessions / Recordings */}
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
                        <span>Recorded: {session.date}</span>
                        <span>•</span>
                        <span>{session.duration} minutes</span>
                        <span>•</span>
                        <span>{session.trainer}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWatchRecording(session)}
                      className="mt-2"
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Watch Recording
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            If you can't attend a live session, don't worry! All sessions are recorded and available
            to watch at your convenience.
          </p>
          <p>
            For technical issues or questions, contact our support team at{" "}
            <span className="text-primary font-medium">support@codesrock.edu</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
