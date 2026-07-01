import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useToast } from "../../hooks/use-toast";

export default function PromoBannerPage() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    adminApi.getPromoBanner().then((data) => {
      if (data) {
        setForm({
          sectionTitle: data.section_title,
          image: data.image,
          href: data.href,
          bgColor: data.bg_color,
          leftText1: data.left_text_1,
          leftText2: data.left_text_2,
          rightMain: data.right_main,
          rightSub: data.right_sub,
          dateText: data.date_text,
          noteText: data.note_text,
          active: !!data.active,
        });
      }
      setLoading(false);
    });
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    try {
      await adminApi.updatePromoBanner(form);
      toast({ title: "Promo banner saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  if (loading) return <div className="text-neutral-400">Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Promo Banner</h2>
      <Card>
        <CardHeader><CardTitle className="text-base">Shop Your Size Section</CardTitle></CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div><Label>Section Title</Label><Input value={form.sectionTitle || ""} onChange={(e) => set("sectionTitle", e.target.value)} /></div>
          <div><Label>Background Image URL</Label><Input value={form.image || ""} onChange={(e) => set("image", e.target.value)} /></div>
          {form.image && <img src={form.image} alt="" className="h-24 object-cover rounded border" />}
          <div><Label>Background Color</Label><Input value={form.bgColor || ""} onChange={(e) => set("bgColor", e.target.value)} placeholder="#111111" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Left Text 1</Label><Input value={form.leftText1 || ""} onChange={(e) => set("leftText1", e.target.value)} /></div>
            <div><Label>Left Text 2</Label><Input value={form.leftText2 || ""} onChange={(e) => set("leftText2", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Right Main Text</Label><Input value={form.rightMain || ""} onChange={(e) => set("rightMain", e.target.value)} /></div>
            <div><Label>Right Sub Text</Label><Input value={form.rightSub || ""} onChange={(e) => set("rightSub", e.target.value)} /></div>
          </div>
          <div><Label>Date Text</Label><Input value={form.dateText || ""} onChange={(e) => set("dateText", e.target.value)} /></div>
          <div><Label>Note Text</Label><Input value={form.noteText || ""} onChange={(e) => set("noteText", e.target.value)} /></div>
          <div className="flex items-center gap-3"><Switch checked={!!form.active} onCheckedChange={(v) => set("active", v)} /><Label>Active</Label></div>
          <Button onClick={save} className="bg-black hover:bg-neutral-800">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
