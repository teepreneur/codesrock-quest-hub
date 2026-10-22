import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import {
  AlertCircle, AlertTriangle, ArrowRight, Award, BookOpen, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardList, Flame, GraduationCap, PlayCircle, Plus, Trophy, Users,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import { dashboardService, type DashboardData } from "@/services/dashboard.service";
import { trackingService, type MyClassSummary } from "@/services/tracking.service";
import { authService } from "@/services/auth.service";
import { FLAG_LABELS, formatDate } from "@/components/tracking/labels";

/** A class is due a lesson log when nothing was logged in the last week. */
const DUE_AFTER_DAYS = 7;
/** ...and is "quiet" (flagged) after two weeks. */
const QUIET_AFTER_DAYS = 14;

const daysSince = (iso: string | null) =>
  iso ? Math.floor((Date.now() - new Date(`${iso}T00:00:00`).getTime()) / 86_400_000) : null;

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const pct = (v: number | null) => (v === null ? "—" : `${v}%`);

const formatSessionTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const ACTIVITY_ICONS: Record<string, typeof Award> = {
  lesson_logged: ClipboardList,
  badge_earned: Award,
  level_up: Trophy,
  evaluation_completed: CheckCircle2,
  video_completed: PlayCircle,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = authService.getStoredUser();

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => dashboardService.getUserDashboard(user!.id),
    enabled: !!user?.id,
  });

  const classesQuery = useQuery({
    queryKey: ["my-classes", user?.id],
    queryFn: () => trackingService.getMyClasses(),
    enabled: !!user?.id,
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (dashboardQuery.error || !dashboardQuery.data) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" /> We couldn't load your dashboard
          </CardTitle>
          <CardDescription>Check your connection and try again.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => dashboardQuery.refetch()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  const data = dashboardQuery.data;
  const classes = classesQuery.data?.classes || [];
  const attention = classesQuery.data?.needsAttention || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <Header data={data} />
      <TodayStrip data={data} classes={classes} classesLoading={classesQuery.isLoading} />
      <MyClasses classes={classes} loading={classesQuery.isLoading} />
      <div className="grid gap-6 lg:grid-cols-2">
        <NeedsAttention items={attention} loading={classesQuery.isLoading} hasClasses={classes.length > 0} />
        <MyTraining data={data} />
      </div>
      <RecentActivity items={data.recentActivities} />
    </div>
  );
}

function Header({ data }: { data: DashboardData }) {
  const { progress } = data;
  return (
    <section className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border bg-gradient-to-r from-secondary/15 via-background to-primary/15 p-4 sm:p-5">
      <img
        src="/assets/rocky/idea-transparent.webp"
        alt=""
        aria-hidden
        className="h-16 w-16 object-contain shrink-0 hidden sm:block"
      />
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl md:text-3xl font-heading font-black text-deep-purple dark:text-white">
          {greeting()}, Teacher {data.user.firstName}
        </h1>
        <p className="text-muted-foreground">Here's what needs you today.</p>
      </div>
      <Link
        to="/achievements"
        className="flex items-center gap-3 rounded-xl border bg-background/70 px-3 py-2 hover:bg-muted/60 transition-colors"
      >
        <Trophy className="h-5 w-5 text-secondary" aria-hidden />
        <div className="text-sm leading-tight">
          <p className="font-bold">Level {progress.currentLevel} · {progress.levelName}</p>
          <p className="text-muted-foreground text-xs flex items-center gap-1">
            {progress.currentXP} XP
            {progress.streak > 0 && (
              <><span aria-hidden>·</span><Flame className="h-3 w-3 text-secondary" aria-hidden /> {progress.streak}-day streak</>
            )}
          </p>
        </div>
      </Link>
    </section>
  );
}

function TodayCard({
  icon: Icon, label, title, detail, action, onAction, tone = "default",
}: {
  icon: typeof Award;
  label: string;
  title: string;
  detail?: string;
  action: string;
  onAction: () => void;
  tone?: "default" | "warning";
}) {
  return (
    <Card className={`flex flex-col ${tone === "warning" ? "border-amber-400/60" : ""}`}>
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <Icon className={`h-4 w-4 ${tone === "warning" ? "text-amber-500" : "text-primary"}`} aria-hidden />
          {label}
        </div>
        <div className="flex-1">
          <p className="font-heading font-black text-lg leading-tight">{title}</p>
          {detail && <p className="text-sm text-muted-foreground mt-1">{detail}</p>}
        </div>
        <Button variant={tone === "warning" ? "default" : "outline"} onClick={onAction} className="self-start">
          {action} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function TodayStrip({ data, classes, classesLoading }: { data: DashboardData; classes: MyClassSummary[]; classesLoading: boolean }) {
  const navigate = useNavigate();

  // The class that has gone longest without a lesson being logged
  const due = classes
    .filter((c) => {
      const d = daysSince(c.lastLessonDate);
      return d === null || d >= DUE_AFTER_DAYS;
    })
    .sort((a, b) => (daysSince(b.lastLessonDate) ?? Infinity) - (daysSince(a.lastLessonDate) ?? Infinity))[0];

  const nextSession = data.upcomingSessions[0];
  const course = data.courseProgress.find((c) => !c.completed) || data.courseProgress[0];

  return (
    <section aria-label="Today" className="grid gap-4 md:grid-cols-3">
      {classesLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : classes.length === 0 ? (
        <TodayCard
          icon={Users}
          label="Your classes"
          title="Set up your first class"
          detail="Add the children you teach, then log each CodesRock lesson to track their progress."
          action="Create a class"
          onAction={() => navigate("/classes")}
          tone="warning"
        />
      ) : due ? (
        <TodayCard
          icon={ClipboardList}
          label="Log a lesson"
          title={due.name}
          detail={due.lastLessonDate ? `Last lesson logged ${daysSince(due.lastLessonDate)} days ago` : "No lessons logged yet"}
          action="Log lesson"
          onAction={() => navigate(`/classes/${due.classId}/lessons/new`)}
          tone="warning"
        />
      ) : (
        <TodayCard
          icon={CheckCircle2}
          label="Lessons"
          title="All classes up to date"
          detail="Every class has a lesson logged this week."
          action="My classes"
          onAction={() => navigate("/classes")}
        />
      )}

      {nextSession ? (
        <TodayCard
          icon={CalendarDays}
          label="Next live training"
          title={nextSession.session.title}
          detail={`${formatSessionTime(nextSession.session.start_time)}${nextSession.isRegistered ? " · You're registered" : ""}`}
          action={nextSession.isRegistered ? "View in calendar" : "Register"}
          onAction={() => navigate("/calendar")}
        />
      ) : (
        <TodayCard
          icon={CalendarDays}
          label="Live training"
          title="No live sessions scheduled"
          detail="New sessions appear in your calendar."
          action="Open calendar"
          onAction={() => navigate("/calendar")}
        />
      )}

      {course?.nextVideo ? (
        <TodayCard
          icon={PlayCircle}
          label="Continue training"
          title={course.nextVideo.title}
          detail={`${course.course.title.trim()} · ${course.videosCompleted} of ${course.videosTotal} videos done`}
          action="Continue"
          onAction={() => navigate("/videos")}
        />
      ) : (
        <TodayCard
          icon={GraduationCap}
          label="Training"
          title={course ? "Course complete!" : "Start your training"}
          detail={course ? "Browse the learning path for your next course." : "Short videos that prepare you to teach CodesRock."}
          action="Learning path"
          onAction={() => navigate("/videos")}
        />
      )}
    </section>
  );
}

function Sparkline({ points }: { points: { date: string; independentRate: number | null }[] }) {
  const data = points.filter((p) => p.independentRate !== null);
  if (data.length < 2) return <p className="text-xs text-muted-foreground">Trend appears after two lessons</p>;
  return (
    <div className="h-12" aria-label="On their own, lesson by lesson">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-md border bg-popover px-2 py-1 text-xs shadow">
                  {formatDate((payload[0].payload as { date: string }).date)}: {payload[0].value}% on their own
                </div>
              ) : null
            }
          />
          <Line type="monotone" dataKey="independentRate" stroke="var(--chart-series)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MyClasses({ classes, loading }: { classes: MyClassSummary[]; loading: boolean }) {
  const navigate = useNavigate();
  if (loading) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (classes.length === 0) return null;

  return (
    <section aria-labelledby="my-classes-title" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="my-classes-title" className="text-xl font-heading font-black text-deep-purple dark:text-white">My classes</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate("/classes")}>
          All classes <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((c) => {
          const quiet = (daysSince(c.lastLessonDate) ?? Infinity) > QUIET_AFTER_DAYS;
          return (
            <Card key={c.classId} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-heading">
                    <Link to={`/classes/${c.classId}`} className="hover:underline">{c.name}</Link>
                  </CardTitle>
                  {c.needsAttention.length > 0 && (
                    <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400 shrink-0">
                      <AlertTriangle className="h-3 w-3 mr-1" aria-hidden /> {c.needsAttention.length}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {c.learnerCount} children ·{" "}
                  {quiet ? (
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">
                      {c.lastLessonDate ? `no lesson logged for ${daysSince(c.lastLessonDate)} days` : "no lessons logged yet"}
                    </span>
                  ) : (
                    <>last lesson {formatDate(c.lastLessonDate)}</>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Book covered</p>
                    <p className="text-2xl font-heading font-black">{pct(c.coveragePercent)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">On their own</p>
                    <p className="text-2xl font-heading font-black">{pct(c.independentRate)}</p>
                  </div>
                </div>
                <Progress value={c.coveragePercent ?? 0} className="h-1.5" aria-label={`${c.name} book coverage`} />
                <Sparkline points={c.trend} />
                <div className="flex gap-2 mt-auto pt-1">
                  <Button size="sm" onClick={() => navigate(`/classes/${c.classId}/lessons/new`)} disabled={c.learnerCount === 0}>
                    <Plus className="h-4 w-4 mr-1" /> Log lesson
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/classes/${c.classId}`)}>
                    Progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function NeedsAttention({
  items, loading, hasClasses,
}: {
  items: { learnerId: string; name: string; flags: (keyof typeof FLAG_LABELS)[]; classId: string; className: string }[];
  loading: boolean;
  hasClasses: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-heading flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden /> Children who need you
        </CardTitle>
        <CardDescription>
          {hasClasses ? "Flagged from the lessons you log." : "Appears once you log lessons for a class."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <Skeleton className="h-24 w-full" />}
        {!loading && hasClasses && items.length === 0 && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden /> No child is flagged right now.
          </p>
        )}
        {items.map((l) => (
          <Link
            key={`${l.classId}-${l.learnerId}`}
            to={`/classes/${l.classId}/learners/${l.learnerId}`}
            className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                {l.name} <span className="text-xs font-normal text-muted-foreground">· {l.className}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {l.flags.filter((f) => f !== "not_yet_assessed").map((f) => FLAG_LABELS[f]).join(" · ")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function MyTraining({ data }: { data: DashboardData }) {
  const navigate = useNavigate();
  const { progress, courseProgress, stats } = data;
  const next = progress.levelDetails.next;
  const course = courseProgress.find((c) => !c.completed) || courseProgress[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-heading flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" aria-hidden /> My training
        </CardTitle>
        <CardDescription>Your own CodesRock teacher training</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">Level {progress.currentLevel} · {progress.levelName}</span>
            <span className="text-muted-foreground tabular-nums">
              {next ? `${progress.currentXP} / ${next.minXP} XP` : `${progress.currentXP} XP`}
            </span>
          </div>
          <Progress value={next ? progress.levelDetails.progressToNextLevel : 100} className="h-2" aria-label="Progress to next level" />
          {next && <p className="text-xs text-muted-foreground mt-1">{next.minXP - progress.currentXP} XP to {next.name}</p>}
        </div>

        {course ? (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold truncate pr-2">{course.course.title.trim()}</span>
              <span className="text-muted-foreground tabular-nums shrink-0">{course.videosCompleted} / {course.videosTotal} videos</span>
            </div>
            <Progress value={course.progressPercentage} className="h-2" aria-label={`${course.course.title} progress`} />
            {course.nextVideo && (
              <p className="text-xs text-muted-foreground mt-1">
                Next: {course.nextVideo.title}{course.nextVideo.topicTitle ? ` (${course.nextVideo.topicTitle})` : ""}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">You haven't started a training course yet.</p>
        )}

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="text-xl font-heading font-black">{stats.evaluationsPassed}</p>
            <p className="text-[11px] text-muted-foreground">quizzes passed</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="text-xl font-heading font-black">{progress.badgeCount}</p>
            <p className="text-[11px] text-muted-foreground">badges</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="text-xl font-heading font-black">{progress.streak}</p>
            <p className="text-[11px] text-muted-foreground">day streak</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate("/videos")}>
            <BookOpen className="h-4 w-4 mr-1" /> Learning path
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/certificates")}>
            <Award className="h-4 w-4 mr-1" /> Certificates
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity({ items }: { items: DashboardData["recentActivities"] }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-heading">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {items.map((a, i) => {
            const Icon = ACTIVITY_ICONS[a.type] || CheckCircle2;
            return (
              <li key={i} className="flex items-center gap-3 py-2.5">
                <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
                <span className="flex-1 text-sm">{a.description}</span>
                {a.xpEarned > 0 && <span className="text-xs font-semibold text-secondary">+{a.xpEarned} XP</span>}
                <span className="text-xs text-muted-foreground w-24 text-right">
                  {new Date(a.timestamp).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
