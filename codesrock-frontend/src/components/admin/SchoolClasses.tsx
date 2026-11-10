import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Loader2, Pencil, Plus, Search, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminService, type SchoolClass, type TeacherSummary } from "@/services/admin.service";
import { trackingService } from "@/services/tracking.service";
import { formatDate } from "@/components/tracking/labels";

const dateText = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Removal = { cls: SchoolClass; learner: { id: string; name: string } };

interface Props {
  schoolId: string;
  classes: SchoolClass[];
  teachers: TeacherSummary[];
  /** Super admins and school admins can change classes; content admins only look */
  canManage: boolean;
  /** Reload the school after a change */
  onChanged: () => Promise<unknown>;
}

/**
 * A school's classes: who created each one and the children in it, with
 * tools for admins to add, rename, reassign and delete classes and to add
 * or remove children.
 */
export function SchoolClasses({ schoolId, classes, teachers, canManage, onChanged }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  // Add or edit a class (editing = an existing class)
  const [form, setForm] = useState<{ editing: SchoolClass | null; name: string; teacherId: string } | null>(null);
  const [deleting, setDeleting] = useState<SchoolClass | null>(null);
  const [removing, setRemoving] = useState<Removal | null>(null);
  // The class whose "add a child" row is open
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [child, setChild] = useState({ firstName: "", lastName: "" });

  const teacherIds = new Set(teachers.map((t) => t.id));

  // Find a class by its name, the teacher who created it, or a child in it
  const q = search.trim().toLowerCase();
  const visible = classes.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.createdBy.toLowerCase().includes(q) ||
      c.learners.some((l) => l.name.toLowerCase().includes(q))
  );

  const run = async (work: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await work();
      await onChanged();
      toast.success(done);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveClass = async () => {
    if (!form) return;
    const name = form.name.trim();
    if (!name || !form.teacherId) {
      toast.error("Enter a class name and choose a teacher");
      return;
    }
    const ok = form.editing
      ? await run(
          () => adminService.updateSchoolClass(schoolId, form.editing!.classId, { name, teacherId: form.teacherId }),
          `Saved ${name}`
        )
      : await run(() => adminService.createSchoolClass(schoolId, { name, teacherId: form.teacherId }), `Created ${name}`);
    if (ok) setForm(null);
  };

  const deleteClass = async () => {
    if (!deleting) return;
    const ok = await run(() => adminService.deleteSchoolClass(schoolId, deleting.classId), `Deleted ${deleting.name}`);
    if (ok) setDeleting(null);
  };

  const addChild = async (cls: SchoolClass) => {
    const firstName = child.firstName.trim();
    const lastName = child.lastName.trim();
    if (!firstName) {
      toast.error("Enter the child's first name");
      return;
    }
    const ok = await run(
      () => trackingService.addLearner(cls.classId, firstName, lastName),
      `Added ${firstName} to ${cls.name}`
    );
    if (ok) setChild({ firstName: "", lastName: "" });
  };

  const removeChild = async () => {
    if (!removing) return;
    const ok = await run(
      () => trackingService.removeLearner(removing.cls.classId, removing.learner.id),
      `Removed ${removing.learner.name} from ${removing.cls.name}`
    );
    if (ok) setRemoving(null);
  };

  // A class's creator may have left the school; only current teachers can be chosen
  const teacherOptions = (current?: SchoolClass | null) => {
    const options = teachers.map((t) => ({ id: t.id, name: t.name }));
    if (current && !teacherIds.has(current.createdById)) options.unshift({ id: current.createdById, name: `${current.createdBy} (not at this school)` });
    return options;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="font-heading">Classes</CardTitle>
          <CardDescription>Every class at this school, who created it and the children in it</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto print:hidden">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes, teachers or children"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <Button onClick={() => setForm({ editing: null, name: "", teacherId: teachers[0]?.id || "" })} disabled={teachers.length === 0}>
              <Plus className="mr-1 h-4 w-4" /> Add class
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {classes.length === 0 ? "No classes have been set up at this school yet." : "No classes match your search."}
          </p>
        ) : (
          visible.map((c) => (
            <div key={c.classId} className="rounded-xl border p-4 space-y-3 break-inside-avoid">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-base">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Created by{" "}
                    {teacherIds.has(c.createdById) ? (
                      <button
                        type="button"
                        className="font-semibold text-foreground underline-offset-2 hover:underline"
                        onClick={() => navigate(`/admin/teachers/${c.createdById}/performance`)}
                      >
                        {c.createdBy}
                      </button>
                    ) : (
                      <span className="font-semibold text-foreground">{c.createdBy}</span>
                    )}
                    {c.createdAt && ` on ${dateText(c.createdAt)}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plural(c.learnerCount, "child", "children")} · {plural(c.lessonCount, "lesson", "lessons")} logged · Last
                    lesson: {formatDate(c.lastLessonDate)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0 print:hidden">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/classes/${c.classId}`)}>
                    Open class <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                  {canManage && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Edit ${c.name}`}
                        onClick={() => setForm({ editing: c, name: c.name, teacherId: c.createdById })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Delete ${c.name}`}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleting(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {c.learners.length === 0 ? (
                <p className="text-sm text-muted-foreground">No children added yet.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5" aria-label={`Children in ${c.name}`}>
                  {c.learners.map((l) => (
                    <li
                      key={l.id}
                      className={`inline-flex items-center gap-1 rounded-full border pl-2.5 ${canManage ? "pr-1" : "pr-2.5"} py-0.5 text-xs ${
                        q && l.name.toLowerCase().includes(q) ? "border-primary bg-primary/10 font-semibold" : "bg-muted/40"
                      }`}
                    >
                      {l.name}
                      {canManage && (
                        <button
                          type="button"
                          className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive print:hidden"
                          aria-label={`Remove ${l.name} from ${c.name}`}
                          onClick={() => setRemoving({ cls: c, learner: l })}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {canManage &&
                (addingTo === c.classId ? (
                  <form
                    className="flex flex-col sm:flex-row gap-2 print:hidden"
                    onSubmit={(e) => {
                      e.preventDefault();
                      addChild(c);
                    }}
                  >
                    <Input
                      autoFocus
                      placeholder="First name"
                      aria-label="Child's first name"
                      value={child.firstName}
                      onChange={(e) => setChild({ ...child, firstName: e.target.value })}
                    />
                    <Input
                      placeholder="Last name"
                      aria-label="Child's last name"
                      value={child.lastName}
                      onChange={(e) => setChild({ ...child, lastName: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={busy}>
                        {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Add
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setAddingTo(null)}>
                        Done
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 print:hidden"
                    onClick={() => {
                      setAddingTo(c.classId);
                      setChild({ firstName: "", lastName: "" });
                    }}
                  >
                    <UserPlus className="mr-1 h-4 w-4" /> Add a child
                  </Button>
                ))}
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.editing ? `Edit ${form.editing.name}` : "Add a class"}</DialogTitle>
            <DialogDescription>
              {form?.editing
                ? "Rename the class or hand it to another teacher. Its children and lessons stay with it."
                : "Every teacher at the school will see the new class."}
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class-name">Class name</Label>
                <Input id="class-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select value={form.teacherId} onValueChange={(teacherId) => setForm({ ...form, teacherId })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherOptions(form.editing).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button onClick={saveClass} disabled={busy}>
              {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {form?.editing ? "Save" : "Add class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (
                <>
                  This permanently deletes the class created by {deleting.createdBy}
                  {deleting.lessonCount > 0 && <>, including its {plural(deleting.lessonCount, "logged lesson", "logged lessons")} and their results</>}
                  . {deleting.learnerCount > 0 && <>Its {plural(deleting.learnerCount, "child", "children")} will be taken off the class; anyone not in another class will be hidden. </>}
                  This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                deleteClass();
              }}
            >
              {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Delete class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.learner.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.learner.name} will be taken off {removing?.cls.name}. Their past results are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                removeChild();
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
