import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, BookOpen, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminService, type BookActivity, type BookUnit } from "@/services/admin.service";
import type { Mode, Skill } from "@/services/tracking.service";
import { MODE_LABELS, SKILL_LABELS, UNIT_TYPE_LABELS } from "@/components/tracking/labels";

type UnitForm = { title: string; unitType: string; bookPages: string; summary: string };
type ActivityForm = { title: string; bookPage: string; skills: Skill[]; modes: Mode[] };

type Editing =
  | { kind: "unit"; unit?: BookUnit }
  | { kind: "activity"; unitId: string; activity?: BookActivity }
  | null;

type Deleting = { kind: "unit"; unit: BookUnit } | { kind: "activity"; activity: BookActivity } | null;

const errorText = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

export function ActivityBookEditor() {
  const queryClient = useQueryClient();
  const [curriculumId, setCurriculumId] = useState<string>("");
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Deleting>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [unitForm, setUnitForm] = useState<UnitForm>({ title: "", unitType: "song", bookPages: "", summary: "" });
  const [activityForm, setActivityForm] = useState<ActivityForm>({ title: "", bookPage: "", skills: [], modes: ["book"] });

  const { data: curricula, isLoading } = useQuery({ queryKey: ["admin-curricula"], queryFn: () => adminService.getCurricula() });
  const book = curricula?.find((c) => c.id === curriculumId) || curricula?.[0];

  /** Run a change, then reload the book. `key` marks which control shows a spinner. */
  const run = async (key: string, fn: () => Promise<unknown>, success?: string) => {
    setBusy(key);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: ["admin-curricula"] });
      if (success) toast.success(success);
      return true;
    } catch (e) {
      toast.error(errorText(e));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const openUnit = (unit?: BookUnit) => {
    setUnitForm({
      title: unit?.title || "",
      unitType: unit?.unitType || "song",
      bookPages: unit?.bookPages || "",
      summary: unit?.summary || "",
    });
    setEditing({ kind: "unit", unit });
  };

  const openActivity = (unitId: string, activity?: BookActivity) => {
    setActivityForm({
      title: activity?.title || "",
      bookPage: activity?.bookPage ? String(activity.bookPage) : "",
      skills: activity?.skills || [],
      modes: activity?.modes || ["book"],
    });
    setEditing({ kind: "activity", unitId, activity });
  };

  const save = async () => {
    if (!editing || !book) return;
    let ok: boolean;
    if (editing.kind === "unit") {
      const input = { ...unitForm, bookPages: unitForm.bookPages || null, summary: unitForm.summary || null };
      ok = await run(
        "save",
        () => (editing.unit ? adminService.updateUnit(editing.unit.id, input) : adminService.createUnit(book.id, input)),
        editing.unit ? "Unit saved" : "Unit added"
      );
    } else {
      const input = { ...activityForm, bookPage: activityForm.bookPage ? Number(activityForm.bookPage) : null };
      ok = await run(
        "save",
        () => (editing.activity ? adminService.updateActivity(editing.activity.id, input) : adminService.createActivity(editing.unitId, input)),
        editing.activity ? "Activity saved" : "Activity added"
      );
    }
    if (ok) setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const ok = await run(
      "delete",
      () => (deleting.kind === "unit" ? adminService.deleteUnit(deleting.unit.id) : adminService.deleteActivity(deleting.activity.id)),
      deleting.kind === "unit" ? "Unit removed" : "Activity removed"
    );
    if (ok) setDeleting(null);
  };

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (!book) return <p className="text-sm text-muted-foreground py-8 text-center">No activity book is set up yet.</p>;

  const activityCount = book.units.reduce((a, u) => a + u.activities.length, 0);
  const canSaveActivity = activityForm.title.trim() && activityForm.modes.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="font-heading flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" aria-hidden /> {book.title}
            </CardTitle>
            <CardDescription>
              {book.units.length} units · {activityCount} activities. Teachers pick from these when they log a lesson, so changes show up for them straight away.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(curricula?.length || 0) > 1 && (
              <Select value={book.id} onValueChange={setCurriculumId}>
                <SelectTrigger className="w-56" aria-label="Activity book"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {curricula!.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button onClick={() => openUnit()}><Plus className="mr-2 h-4 w-4" /> Add unit</Button>
          </div>
        </CardHeader>
      </Card>

      {book.units.map((unit, ui) => (
        <Card key={unit.id}>
          <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-3 space-y-0 pb-3">
            <div className="min-w-0">
              <CardTitle className="text-base font-heading flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground tabular-nums">{unit.position}.</span> {unit.title}
                <Badge variant="outline">{UNIT_TYPE_LABELS[unit.unitType] || unit.unitType}</Badge>
              </CardTitle>
              <CardDescription>
                {[unit.bookPages && `Pages ${unit.bookPages}`, unit.summary].filter(Boolean).join(" · ")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost" size="icon" aria-label={`Move ${unit.title} up`} disabled={ui === 0 || !!busy}
                onClick={() => run(`unit-${unit.id}`, () => adminService.moveUnit(unit.id, "up"))}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon" aria-label={`Move ${unit.title} down`} disabled={ui === book.units.length - 1 || !!busy}
                onClick={() => run(`unit-${unit.id}`, () => adminService.moveUnit(unit.id, "down"))}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Edit ${unit.title}`} onClick={() => openUnit(unit)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon" aria-label={`Remove ${unit.title}`}
                disabled={unit.activities.length > 0}
                title={unit.activities.length > 0 ? "Remove the activities in this unit first" : undefined}
                onClick={() => setDeleting({ kind: "unit", unit })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {unit.activities.length === 0 && <p className="text-sm text-muted-foreground">No activities in this unit yet.</p>}
            {unit.activities.map((a, ai) => {
              const used = a.lessonCount + a.ratingCount > 0;
              return (
                <div key={a.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {a.title}
                      {a.bookPage && <span className="font-normal text-muted-foreground"> · p. {a.bookPage}</span>}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {a.modes.map((m) => <Badge key={m} variant="secondary" className="text-xs">{MODE_LABELS[m]}</Badge>)}
                      {a.skills.map((s) => <Badge key={s} variant="outline" className="text-xs font-normal">{SKILL_LABELS[s]}</Badge>)}
                      <span className="text-xs text-muted-foreground ml-1">
                        {a.lessonCount ? `Used in ${a.lessonCount} lesson${a.lessonCount === 1 ? "" : "s"}` : "Not used yet"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {busy === `activity-${a.id}` && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Button
                      variant="ghost" size="icon" aria-label={`Move ${a.title} up`} disabled={ai === 0 || !!busy}
                      onClick={() => run(`activity-${a.id}`, () => adminService.moveActivity(a.id, "up"))}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" aria-label={`Move ${a.title} down`} disabled={ai === unit.activities.length - 1 || !!busy}
                      onClick={() => run(`activity-${a.id}`, () => adminService.moveActivity(a.id, "down"))}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Edit ${a.title}`} onClick={() => openActivity(unit.id, a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" aria-label={`Remove ${a.title}`} disabled={used}
                      title={used ? "Teachers have logged lessons with this activity, so it can't be removed" : undefined}
                      onClick={() => setDeleting({ kind: "activity", activity: a })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => openActivity(unit.id)}>
              <Plus className="mr-1 h-4 w-4" /> Add activity
            </Button>
          </CardContent>
        </Card>
      ))}

      <Dialog open={editing?.kind === "unit"} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.kind === "unit" && editing.unit ? "Edit unit" : "Add unit"}</DialogTitle>
            <DialogDescription>New units go at the end of the book. Use the arrows to move them.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit-title">Title</Label>
              <Input id="unit-title" value={unitForm.title} onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={unitForm.unitType} onValueChange={(v) => setUnitForm({ ...unitForm, unitType: v })}>
                  <SelectTrigger aria-label="Unit type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(UNIT_TYPE_LABELS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-pages">Book pages</Label>
                <Input id="unit-pages" placeholder="e.g. 45-56" value={unitForm.bookPages} onChange={(e) => setUnitForm({ ...unitForm, bookPages: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-summary">What children do</Label>
              <Textarea id="unit-summary" rows={3} value={unitForm.summary} onChange={(e) => setUnitForm({ ...unitForm, summary: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={!unitForm.title.trim() || busy === "save"}>
              {busy === "save" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editing?.kind === "activity"} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.kind === "activity" && editing.activity ? "Edit activity" : "Add activity"}</DialogTitle>
            <DialogDescription>Teachers rate each child on the parts you tick: practical, in the book, or both.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <div className="space-y-2">
                <Label htmlFor="activity-title">Title</Label>
                <Input id="activity-title" value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity-page">Page</Label>
                <Input
                  id="activity-page" type="number" min={1} value={activityForm.bookPage}
                  onChange={(e) => setActivityForm({ ...activityForm, bookPage: e.target.value })}
                />
              </div>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Rated</legend>
              <div className="flex flex-wrap gap-4">
                {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={activityForm.modes.includes(m)}
                      onCheckedChange={() => setActivityForm({ ...activityForm, modes: toggle(activityForm.modes, m) })}
                    />
                    {MODE_LABELS[m]}
                  </label>
                ))}
              </div>
              {activityForm.modes.length === 0 && <p className="text-xs text-destructive">Tick at least one.</p>}
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Skills</legend>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SKILL_LABELS) as Skill[]).map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={activityForm.skills.includes(s)}
                      onCheckedChange={() => setActivityForm({ ...activityForm, skills: toggle(activityForm.skills, s) })}
                    />
                    {SKILL_LABELS[s]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={!canSaveActivity || busy === "save"}>
              {busy === "save" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {deleting?.kind === "unit" ? deleting.unit.title : deleting?.activity.title}?
            </AlertDialogTitle>
            <AlertDialogDescription>Teachers won't be able to pick it when they log a lesson.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
