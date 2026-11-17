"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Badge";
import PhotoCropper from "@/components/PhotoCropper";

type Profile = {
  name: string;
  email: string;
  role: string;
  title: string | null;
  phone: string | null;
  office: string | null;
  photo: string | null; // URL of the current photo
};

const OFFICES = ["JHB", "CPT", "DBN", "GQ"];
const OFFICE_NAMES: Record<string, string> = { JHB: "Johannesburg", CPT: "Cape Town", DBN: "Durban", GQ: "Gqeberha" };

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(profile.photo);
  const [form, setForm] = useState({
    name: profile.name,
    title: profile.title ?? "",
    phone: profile.phone ?? "",
    office: profile.office ?? "",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
    return data;
  }

  // Picking a file opens the cropper; saving there uploads the result.
  function choosePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg({ ok: false, text: "Please choose a photo (JPG or PNG)." });
      return;
    }
    setMsg(null);
    setCropFile(file);
  }

  async function uploadCropped(dataUrl: string) {
    setCropFile(null);
    setPhotoBusy(true);
    setPhoto(dataUrl);
    try {
      await patch({ photo: dataUrl });
      setMsg({ ok: true, text: "Photo updated." });
      router.refresh();
    } catch (err) {
      setPhoto(profile.photo);
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    try {
      await patch({ photo: null });
      setPhoto(null);
      setMsg({ ok: true, text: "Photo removed." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setPhotoBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await patch(form);
      setMsg({ ok: true, text: "Profile saved." });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  const input = "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black";

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          <Avatar name={form.name || profile.name} src={photo} size="h-24 w-24 text-3xl" />
          {photoBusy && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 text-xs">Saving...</span>}
        </div>
        <div>
          <p className="text-lg font-bold">{form.name || profile.name}</p>
          <p className="text-sm text-gray-500">
            {[form.title, profile.role.charAt(0) + profile.role.slice(1).toLowerCase(), OFFICE_NAMES[form.office]].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-3 flex gap-2 text-[13px]">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={photoBusy} className="rounded-md bg-navy px-3 py-1.5 font-semibold text-white disabled:opacity-50">
              {photo ? "Change photo" : "Upload photo"}
            </button>
            {photo && (
              <button type="button" onClick={removePhoto} disabled={photoBusy} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:border-black">
                Remove
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={choosePhoto} />
            {cropFile && <PhotoCropper file={cropFile} onCancel={() => setCropFile(null)} onDone={uploadCropped} />}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">A clear head-and-shoulders photo works best. You can drag and zoom to position it.</p>
        </div>
      </div>

      <form onSubmit={save} className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Full name
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={input} />
        </label>
        <label className="block text-sm font-medium">
          Job title
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Sales Executive" className={input} />
        </label>
        <label className="block text-sm font-medium">
          Cellphone
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 082 123 4567" inputMode="tel" className={input} />
        </label>
        <label className="block text-sm font-medium">
          Office
          <select value={form.office} onChange={(e) => setForm({ ...form, office: e.target.value })} className={input}>
            <option value="">Not set</option>
            {OFFICES.map((o) => (
              <option key={o} value={o}>
                {OFFICE_NAMES[o]} ({o})
              </option>
            ))}
          </select>
        </label>
        <div className="text-sm sm:col-span-2">
          <p className="font-medium">Email</p>
          <p className="mt-1 text-gray-600">{profile.email}</p>
          <p className="text-xs text-gray-400">This is what you sign in with. Ask an Admin if it needs changing.</p>
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={saving} className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save profile"}
          </button>
          {msg && <span className={`text-sm ${msg.ok ? "text-[#037A5A]" : "text-red-600"}`}>{msg.text}</span>}
        </div>
      </form>
    </section>
  );
}
