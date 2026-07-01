import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

export default function FooterPage() {
  const [sections, setSections] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", links: [{ label: "" }], active: true, sort_order: 0 });
  const [editing, setEditing] = useState(null);
  const { toast } = useToast();

  const load = () => adminApi.listFooterSections().then(setSections).catch(() => {});

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", links: [{ label: "" }], active: true, sort_order: sections.length });
    setOpen(true);
  };

  const openEdit = (sec) => {
    setEditing(sec);
    setForm({ title: sec.title, links: sec.links?.length ? sec.links : [{ label: "" }], active: sec.active, sort_order: sec.sort_order });
    setOpen(true);
  };

  const addLink = () => setForm((p) => ({ ...p, links: [...p.links, { label: "" }] }));
  const updateLink = (i, label) => setForm((p) => ({ ...p, links: p.links.map((l, idx) => (idx === i ? { ...l, label } : l)) }));
  const removeLink = (i) => setForm((p) => ({ ...p, links: p.links.filter((_, idx) => idx !== i) }));

  const save = async () => {
    try {
      if (editing) await adminApi.updateFooterSection(editing.id, form);
      else await adminApi.createFooterSection(form);
      toast({ title: "Saved" });
      setOpen(false);
      load();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete section?")) return;
    await adminApi.deleteFooterSection(id);
    toast({ title: "Deleted" });
    load();
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-semibold">Footer Sections</h2>
        <Button onClick={openCreate} className="bg-black hover:bg-neutral-800"><Plus className="w-4 h-4 mr-2" /> Add Section</Button>
      </div>
      <div className="space-y-4">
        {sections.map((sec) => (
          <div key={sec.id} className="bg-white border rounded-lg p-4 flex justify-between items-start">
            <div>
              <div className="font-semibold">{sec.title}</div>
              <ul className="text-sm text-neutral-500 mt-2 space-y-1">
                {sec.links?.map((l) => <li key={l.id}>{l.label}</li>)}
              </ul>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEdit(sec)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del(sec.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Footer Section</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
            <div>
              <Label>Links</Label>
              {form.links.map((l, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Input value={l.label} onChange={(e) => updateLink(i, e.target.value)} placeholder="Link label" />
                  <Button variant="ghost" size="icon" onClick={() => removeLink(i)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2" onClick={addLink}>Add Link</Button>
            </div>
            <div className="flex items-center gap-3"><Switch checked={!!form.active} onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-black hover:bg-neutral-800">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
