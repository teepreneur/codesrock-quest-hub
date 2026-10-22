import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Loader2, Sparkles, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  trackingService, type CurriculumActivity, type CurriculumUnit, type Learner, type Level, type Mode,
} from "@/services/tracking.service";
import { LEVELS, MODE_LABELS, UNIT_TYPE_LABELS, todayIso } from "@/components/tracking/labels";

type Step = "activities" | "attendance" | "ratings";
const STEPS: { id: Step; label: string }[] = [
  { id: "activities", label: "What you covered" },
  { id: "attendance", label: "Who was there" },
  { id: "ratings", label: "How each child did" },
];

/** One thing to rate: an activity in one mode (mat and robot missions have two). */
interface Slot {
  activity: CurriculumActivity;
  unit: CurriculumUnit;
  mode: Mode;
}

const ratingKey = (learnerId: string, activityId: string, mode: Mode) => `${learnerId}|${activityId}|${mode}`;

export default function LogLesson() {
  const { id: classId, sessionId } = useParams<{ id: string; sessionId?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(sessionId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [className, setClassName] = useState("");
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [suggested, setSuggested] = useState<string[]>([]);

  const [step, setStep] = useState<Step>("activities");
  const [date, setDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [absent, setAbsent] = useState<Set<string>>(new Set());
  const [childNotes, setChildNotes] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, Level>>({});
  const [slotIndex, setSlotIndex] = useState(0);

  useEffect(() => {
    if (!classId) return;
    (async () => {
      try {
        const [curriculum, roster, progress, lesson] = await Promise.all([
          trackingService.getCurriculum(classId),
          trackingService.getLearners(classId),
          trackingService.getClassProgress(classId),
          sessionId ? trackingService.getLesson(classId, sessionId) : Promise.resolve(null),
        ]);
        setUnits(curriculum.units);
        setLearners(roster);
        setClassName(progress.class.name);
        setSuggested(progress.nextActivityIds);

        if (lesson) {
          setDate(lesson.date);
          setNotes(lesson.notes || "");
          setSelected(new Set(lesson.activityIds));
          setAbsent(new Set(lesson.attendance.filter((a) => !a.present).map((a) => a.learnerId)));
          setChildNotes(Object.fromEntries(lesson.attendance.filter((a) => a.note).map((a) => [a.learnerId, a.note!])));
          setRatings(Object.fromEntries(lesson.results.map((r) => [ratingKey(r.learnerId, r.activityId, r.mode), r.level])));
        } else {
          // Start with the next few activities in the book ticked
          setSelected(new Set(progress.nextActivityIds.slice(0, 3)));
        }
      } catch (error: any) {
        toast.error(error.message || "Could not load this class");
        navigate(`/classes/${classId}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [classId, sessionId]);

  const slots: Slot[] = useMemo(
    () =>
      units.flatMap((unit) =>
        unit.activities
          .filter((a) => selected.has(a.id))
          .flatMap((activity) => activity.modes.map((mode) => ({ activity, unit, mode })))
      ),
    [units, selected]
  );

  const presentLearners = learners.filter((l) => !absent.has(l.id));
  const totalCells = slots.length * presentLearners.length;
  const ratedCells = slots.reduce(
    (n, s) => n + presentLearners.filter((l) => ratings[ratingKey(l.id, s.activity.id, s.mode)]).length,
    0
  );

  const toggleActivity = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const setRating = (learnerId: string, slot: Slot, level: Level) =>
    setRatings((prev) => ({ ...prev, [ratingKey(learnerId, slot.activity.id, slot.mode)]: level }));

  const rateEveryone = (level: Level, onlySlot?: Slot) => {
    setRatings((prev) => {
      const next = { ...prev };
      for (const s of onlySlot ? [onlySlot] : slots) {
        for (const l of presentLearners) next[ratingKey(l.id, s.activity.id, s.mode)] = level;
      }
      return next;
    });
  };

  const goTo = (target: Step) => {
    if (target !== "activities" && selected.size === 0) {
      toast.warning("Choose at least one activity first");
      return;
    }
    if (target === "ratings") setSlotIndex((i) => Math.min(i, Math.max(slots.length - 1, 0)));
    setStep(target);
    // The app scrolls inside <main>, not the window
    document.querySelector("main")?.scrollTo({ top: 0 });
  };

  const handleSave = async () => {
    if (!classId) return;
    if (selected.size === 0) {
      toast.warning("Choose at least one activity first");
      setStep("activities");
      return;
    }
    const activityIds = [...selected];
    const results = slots.flatMap((s) =>
      presentLearners
        .map((l) => ({ learnerId: l.id, activityId: s.activity.id, mode: s.mode, level: ratings[ratingKey(l.id, s.activity.id, s.mode)] }))
        .filter((r): r is { learnerId: string; activityId: string; mode: Mode; level: Level } => Boolean(r.level))
    );
    try {
      setSaving(true);
      await trackingService.saveLesson(
        classId,
        {
          date,
          notes: notes.trim() || undefined,
          activityIds,
          attendance: learners.map((l) => ({ learnerId: l.id, present: !absent.has(l.id), note: childNotes[l.id]?.trim() || undefined })),
          results,
        },
        sessionId
      );
      toast.success(isEdit ? "Lesson updated" : "Lesson saved. Great work!");
      navigate(`/classes/${classId}?tab=progress`);
    } catch (error: any) {
      toast.error(error.message || "Could not save the lesson");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!classId || !sessionId) return;
    try {
      await trackingService.deleteLesson(classId, sessionId);
      toast.success("Lesson deleted");
      navigate(`/classes/${classId}?tab=lessons`);
    } catch (error: any) {
      toast.error(error.message || "Could not delete the lesson");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const slot = slots[slotIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(`/classes/${classId}?tab=lessons`)} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to {className || "class"}
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-deep-purple dark:text-white">
            {isEdit ? "Edit lesson" : "Log a lesson"}
          </h1>
          <p className="text-muted-foreground">{className}</p>
        </div>
        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Lesson date
          <Input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} className="w-44 rounded-xl" />
        </label>
      </div>

      {/* Steps */}
      <nav aria-label="Lesson steps" className="grid grid-cols-3 gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(s.id)}
            aria-current={step === s.id ? "step" : undefined}
            className={`rounded-xl border-2 px-3 py-2 text-left transition-colors ${
              step === s.id ? "border-primary bg-primary/10" : i < stepIndex ? "border-primary/30" : "border-muted"
            }`}
          >
            <span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Step {i + 1}</span>
            <span className="block text-sm font-bold leading-tight">{s.label}</span>
          </button>
        ))}
      </nav>

      {step === "activities" && (
        <Card>
          <CardHeader>
            <CardTitle>What did you cover today?</CardTitle>
            <CardDescription>
              Tick the activities from the CodesRock activity book. The next ones in the book are marked “Next up”.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion
              type="multiple"
              defaultValue={units.filter((u) => u.activities.some((a) => selected.has(a.id) || suggested.includes(a.id))).map((u) => u.id)}
            >
              {units.map((unit) => {
                const count = unit.activities.filter((a) => selected.has(a.id)).length;
                return (
                  <AccordionItem key={unit.id} value={unit.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-1 flex-wrap items-center gap-2 text-left pr-2">
                        <span className="font-bold">
                          {unit.position}. {unit.title}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{UNIT_TYPE_LABELS[unit.unit_type]}</Badge>
                        {unit.book_pages && <span className="text-xs text-muted-foreground">pp. {unit.book_pages}</span>}
                        {count > 0 && <Badge className="ml-auto bg-primary text-primary-foreground">{count} chosen</Badge>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex justify-end gap-2 mb-2">
                        <Button size="sm" variant="ghost" onClick={() => unit.activities.forEach((a) => toggleActivity(a.id, true))}>
                          Select all
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => unit.activities.forEach((a) => toggleActivity(a.id, false))}>
                          Clear
                        </Button>
                      </div>
                      <ul className="space-y-1">
                        {unit.activities.map((a) => (
                          <li key={a.id}>
                            <label className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 cursor-pointer min-h-[44px]">
                              <Checkbox checked={selected.has(a.id)} onCheckedChange={(v) => toggleActivity(a.id, v === true)} />
                              <span className="flex-1 text-sm">{a.title}</span>
                              {suggested.includes(a.id) && (
                                <Badge variant="outline" className="border-primary text-primary text-[10px]">
                                  <Sparkles className="h-3 w-3 mr-1" /> Next up
                                </Badge>
                              )}
                              {a.modes.length === 2 && (
                                <Badge variant="secondary" className="text-[10px]">Practical + book</Badge>
                              )}
                              {a.book_page && <span className="text-xs text-muted-foreground w-12 text-right">p. {a.book_page}</span>}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {step === "attendance" && (
        <Card>
          <CardHeader>
            <CardTitle>Who was in class?</CardTitle>
            <CardDescription>Everyone is marked present. Tap a child who was absent. You can add a short note for anyone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {learners.length === 0 && (
              <p className="text-muted-foreground text-sm">
                This class has no children yet. Add them in the Roster tab first.
              </p>
            )}
            {learners.map((l) => {
              const isAbsent = absent.has(l.id);
              return (
                <div key={l.id} className="rounded-xl border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`font-semibold ${isAbsent ? "text-muted-foreground line-through" : ""}`}>
                      {l.first_name} {l.last_name}
                    </span>
                    <Button
                      size="sm"
                      variant={isAbsent ? "default" : "outline"}
                      aria-pressed={isAbsent}
                      onClick={() =>
                        setAbsent((prev) => {
                          const next = new Set(prev);
                          if (isAbsent) next.delete(l.id);
                          else next.add(l.id);
                          return next;
                        })
                      }
                      className="min-w-[110px]"
                    >
                      {isAbsent ? <><UserX className="h-4 w-4 mr-1" /> Absent</> : "Present"}
                    </Button>
                  </div>
                  <Input
                    placeholder="Note (optional), e.g. needed extra help with turning"
                    value={childNotes[l.id] || ""}
                    onChange={(e) => setChildNotes((prev) => ({ ...prev, [l.id]: e.target.value }))}
                    maxLength={500}
                    className="h-9 text-sm"
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {step === "ratings" && (
        <div className="space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <p className="font-bold">Quick start</p>
                <p className="text-sm text-muted-foreground">
                  Set every child to “On their own” for every activity, then change only the children who needed help.
                </p>
              </div>
              <Button onClick={() => rateEveryone(3)} className="shrink-0">
                <Check className="h-4 w-4 mr-1" /> Everyone on their own
              </Button>
            </CardContent>
          </Card>

          {slot ? (
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Previous activity"
                    disabled={slotIndex === 0}
                    onClick={() => setSlotIndex((i) => i - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <select
                    aria-label="Choose activity to rate"
                    className="flex-1 min-w-0 rounded-xl border bg-background px-3 py-2 text-sm font-semibold"
                    value={slotIndex}
                    onChange={(e) => setSlotIndex(Number(e.target.value))}
                  >
                    {slots.map((s, i) => {
                      const done = presentLearners.every((l) => ratings[ratingKey(l.id, s.activity.id, s.mode)]);
                      return (
                        <option key={`${s.activity.id}-${s.mode}`} value={i}>
                          {done ? "✓ " : ""}{s.activity.title}
                          {s.activity.modes.length === 2 ? ` (${MODE_LABELS[s.mode]})` : ""}
                        </option>
                      );
                    })}
                  </select>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Next activity"
                    disabled={slotIndex >= slots.length - 1}
                    onClick={() => setSlotIndex((i) => i + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <CardTitle className="text-xl">{slot.activity.title}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                    <span>{slot.unit.title}</span>
                    {slot.activity.book_page && <span>· page {slot.activity.book_page}</span>}
                    {slot.activity.modes.length === 2 && (
                      <Badge className="text-white" style={{ backgroundColor: slot.mode === "practical" ? "var(--chart-practical)" : "var(--chart-book)" }}>
                        {slot.mode === "practical" ? "Practical: with the mats or robot" : "In the book: writing the code"}
                      </Badge>
                    )}
                    <span className="ml-auto text-xs">
                      Activity {slotIndex + 1} of {slots.length}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Set everyone:</span>
                  {LEVELS.map((lv) => (
                    <Button key={lv.level} size="sm" variant="outline" onClick={() => rateEveryone(lv.level, slot)}>
                      {lv.label}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {learners.map((l) => {
                  if (absent.has(l.id)) {
                    return (
                      <div key={l.id} className="flex items-center justify-between rounded-xl border border-dashed p-3 text-muted-foreground">
                        <span>{l.first_name} {l.last_name}</span>
                        <span className="text-xs font-bold uppercase">Absent</span>
                      </div>
                    );
                  }
                  const current = ratings[ratingKey(l.id, slot.activity.id, slot.mode)];
                  return (
                    <div key={l.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border p-3">
                      <span className="font-semibold sm:w-44 shrink-0">{l.first_name} {l.last_name}</span>
                      <div role="radiogroup" aria-label={`Rating for ${l.first_name}`} className="grid grid-cols-3 gap-2 flex-1">
                        {LEVELS.map((lv) => {
                          const on = current === lv.level;
                          return (
                            <button
                              key={lv.level}
                              type="button"
                              role="radio"
                              aria-checked={on}
                              onClick={() => setRating(l.id, slot, lv.level)}
                              className={`min-h-[44px] rounded-lg border-2 px-2 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                                on ? "text-foreground" : "border-muted text-muted-foreground hover:border-primary/40"
                              }`}
                              style={on ? { borderColor: lv.color, backgroundColor: `color-mix(in srgb, ${lv.color} 18%, transparent)` } : undefined}
                            >
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: lv.color }} aria-hidden />
                              {lv.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {slotIndex < slots.length - 1 && (
                  <div className="flex justify-end pt-2">
                    <Button variant="ghost" onClick={() => setSlotIndex((i) => i + 1)}>
                      Next activity <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="p-6 text-muted-foreground">Choose activities in step 1 first.</CardContent></Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lesson notes (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                placeholder="Anything worth remembering about this lesson"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 rounded-t-xl">
        <div className="px-4 py-3 flex items-center gap-3">
          {isEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Delete lesson" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The attendance and ratings recorded for this lesson will be removed from the class progress.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className="text-xs text-muted-foreground flex-1">
            {selected.size} {selected.size === 1 ? "activity" : "activities"} · {presentLearners.length} present
            {totalCells > 0 && <> · {ratedCells} of {totalCells} ratings</>}
          </div>
          {step !== "ratings" ? (
            <Button onClick={() => goTo(STEPS[stepIndex + 1].id)}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              {isEdit ? "Save changes" : "Save lesson"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
