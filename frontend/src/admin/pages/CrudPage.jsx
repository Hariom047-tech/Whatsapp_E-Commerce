import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

function FieldInput({ field, value, onChange, categories }) {
  const { key, label, type, placeholder } = field;

  if (type === "textarea") {
    return (
      <div>
        <Label>{label}</Label>
        <Textarea value={value ?? ""} onChange={(e) => onChange(key, e.target.value)} placeholder={placeholder} rows={3} />
      </div>
    );
  }
  if (type === "boolean") {
    return (
      <div className="flex items-center gap-3">
        <Switch checked={!!value} onCheckedChange={(v) => onChange(key, v)} />
        <Label>{label}</Label>
      </div>
    );
  }
  if (type === "category") {
    return (
      <div>
        <Label>{label}</Label>
        <select
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={value ?? ""}
          onChange={(e) => onChange(key, e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">None</option>
          {(categories || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    );
  }
  if (type === "json-array") {
    const str = Array.isArray(value) ? value.join(", ") : (value || "");
    return (
      <div>
        <Label>{label}</Label>
        <Input
          value={str}
          onChange={(e) => onChange(key, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder={placeholder || "comma separated"}
        />
      </div>
    );
  }
  if (type === "number") {
    return (
      <div>
        <Label>{label}</Label>
        <Input type="number" value={value ?? ""} onChange={(e) => onChange(key, Number(e.target.value))} />
      </div>
    );
  }
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value ?? ""} onChange={(e) => onChange(key, e.target.value)} placeholder={placeholder} />
      {type === "image" && value && (
        <img src={value} alt="" className="mt-2 h-20 object-cover rounded border" />
      )}
    </div>
  );
}

export default function CrudPage({ title, description, resource, fields, columns, emptyItem = {} }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.list(resource);
      setItems(data);
    } catch {
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (fields.some((f) => f.type === "category")) {
      adminApi.list("categories").then(setCategories).catch(() => {});
    }
  }, [resource]);

  const openCreate = () => {
    setEditing(null);
    setForm({ active: true, sort_order: items.length, ...emptyItem });
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    const f = { ...item };
    if (resource === "products") {
      f.hoverImage = item.hover_image || item.hoverImage;
      f.categoryId = item.category_id || item.categoryId;
      f.sortOrder = item.sort_order ?? item.sortOrder;
    }
    setForm(f);
    setOpen(true);
  };

  const handleChange = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    try {
      if (resource === "products") {
        const payload = {
          ...form,
          hoverImage: form.hoverImage || form.hover_image,
          categoryId: form.categoryId || form.category_id,
          sortOrder: form.sort_order ?? form.sortOrder ?? 0,
        };
        if (editing) await adminApi.update(resource, editing.id, payload);
        else await adminApi.create(resource, payload);
      } else if (editing) {
        await adminApi.update(resource, editing.id, form);
      } else {
        await adminApi.create(resource, form);
      }
      toast({ title: editing ? "Updated" : "Created" });
      setOpen(false);
      load();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await adminApi.remove(resource, id);
      toast({ title: "Deleted" });
      load();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const renderCell = (item, col) => {
    if (col.type === "image") {
      return item[col.key] ? <img src={item[col.key]} alt="" className="h-10 w-10 object-cover rounded" /> : "—";
    }
    if (col.type === "boolean") return item[col.key] ? "Yes" : "No";
    if (col.key === "colors" || col.key === "sizes") {
      const arr = typeof item[col.key] === "string" ? JSON.parse(item[col.key] || "[]") : item[col.key];
      return Array.isArray(arr) ? arr.join(", ") : "—";
    }
    return String(item[col.key] ?? "—");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          {description && <p className="text-neutral-500 text-sm mt-1">{description}</p>}
        </div>
        <Button onClick={openCreate} className="bg-black hover:bg-neutral-800">
          <Plus className="w-4 h-4 mr-2" /> Add New
        </Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center py-8 text-neutral-400">Loading...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center py-8 text-neutral-400">No items yet</TableCell></TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className="max-w-[200px] truncate">{renderCell(item, c)}</TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {fields.map((f) => (
              <FieldInput key={f.key} field={f} value={form[f.key]} onChange={handleChange} categories={categories} />
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-black hover:bg-neutral-800">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
