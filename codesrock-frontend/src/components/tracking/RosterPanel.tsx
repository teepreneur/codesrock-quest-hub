import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trackingService, type Learner } from "@/services/tracking.service";

export default function RosterPanel({
  classId, learners, canEdit, onChange,
}: {
  classId: string;
  learners: Learner[];
  canEdit: boolean;
  onChange: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");

  const add = async () => {
    if (!firstName.trim()) return toast.error("Enter the child's first name");
    try {
      setBusy(true);
      await trackingService.addLearner(classId, firstName.trim(), lastName.trim());
      toast.success(`${firstName.trim()} added to the class`);
      setFirstName("");
      setLastName("");
      onChange();
    } catch (error: any) {
      toast.error(error.message || "Could not add the child");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (learnerId: string) => {
    if (!editFirst.trim()) return toast.error("First name is required");
    try {
      await trackingService.updateLearner(classId, learnerId, { firstName: editFirst.trim(), lastName: editLast.trim() });
      setEditing(null);
      onChange();
    } catch (error: any) {
      toast.error(error.message || "Could not rename");
    }
  };

  const remove = async (l: Learner) => {
    try {
      await trackingService.removeLearner(classId, l.id);
      toast.success(`${l.first_name} removed from the class`);
      onChange();
    } catch (error: any) {
      toast.error(error.message || "Could not remove the child");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Children in this class
          </CardTitle>
          <CardDescription>{learners.length} {learners.length === 1 ? "child" : "children"}. No logins or emails needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {learners.length === 0 && <p className="text-muted-foreground text-sm py-6 text-center">No children added yet.</p>}
          {learners.map((l) => (
            <div key={l.id} className="flex items-center gap-2 rounded-xl border p-3">
              {editing === l.id ? (
                <>
                  <Input value={editFirst} onChange={(e) => setEditFirst(e.target.value)} aria-label="First name" className="h-9" maxLength={50} />
                  <Input value={editLast} onChange={(e) => setEditLast(e.target.value)} aria-label="Last name" className="h-9" maxLength={50} />
                  <Button size="sm" onClick={() => saveEdit(l.id)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                </>
              ) : (
                <>
                  <Link to={`/classes/${classId}/learners/${l.id}`} className="flex-1 font-semibold hover:underline">
                    {l.first_name} {l.last_name}
                  </Link>
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Rename ${l.first_name}`}
                        onClick={() => { setEditing(l.id); setEditFirst(l.first_name); setEditLast(l.last_name); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Remove ${l.first_name}`} className="text-destructive/70 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {l.first_name} from this class?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Their past ratings are kept, but they will no longer appear in lessons or class charts.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(l)}>Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {canEdit && (
        <Card className="glass-panel border-primary/20 bg-primary/5 h-fit">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Add a child
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} />
            <Input
              placeholder="Last name (optional)"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              maxLength={50}
            />
            <Button className="w-full" onClick={add} disabled={busy}>Add to class</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
