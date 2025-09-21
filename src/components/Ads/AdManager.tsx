import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import type { AdDocument, AdZone } from "../../lib/types";
import { db } from "../../lib/firebase";

type EditState = Record<string, AdDocument>;

const emptyForm = {
  zone: "top" as AdZone,
  imageUrl: "",
  clickUrl: "",
  weight: 1,
};

const AdManager = () => {
  const [ads, setAds] = useState<AdDocument[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editState, setEditState] = useState<EditState>({});

  useEffect(() => {
    const adsRef = collection(db, "ads");
    const q = query(adsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextAds = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<AdDocument, "id">),
      }));
      setAds(nextAds);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setEditState((prev) => {
      const next: EditState = {};
      for (const ad of ads) {
        next[ad.id] = prev[ad.id] ?? { ...ad };
      }
      return next;
    });
  }, [ads]);

  const topCount = useMemo(() => ads.filter((ad) => ad.zone === "top").length, [ads]);
  const bottomCount = useMemo(() => ads.filter((ad) => ad.zone === "bottom").length, [ads]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, "ads"), {
        ...form,
        weight: Number(form.weight) || 1,
        createdAt: serverTimestamp(),
      });
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (id: string, field: keyof AdDocument, value: string | number) => {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === "weight" ? Number(value) : value,
      },
    }));
  };

  const handleSaveAd = async (id: string) => {
    const data = editState[id];
    if (!data) return;
    await updateDoc(doc(db, "ads", id), {
      zone: data.zone,
      imageUrl: data.imageUrl,
      clickUrl: data.clickUrl,
      weight: Number.isFinite(data.weight) ? Math.max(1, Math.round(data.weight)) : 1,
    });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "ads", id));
  };

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Create advertisement</h2>
        <p className="text-sm text-slate-500">Top creatives: {topCount} • Bottom creatives: {bottomCount}</p>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Zone
            <select
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.zone}
              onChange={(event) => setForm((prev) => ({ ...prev, zone: event.target.value as AdZone }))}
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Weight
            <input
              type="number"
              min={1}
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.weight}
              onChange={(event) => setForm((prev) => ({ ...prev, weight: Number(event.target.value) }))}
            />
          </label>
          <label className="md:col-span-2 flex flex-col text-sm font-medium text-slate-700">
            Image URL
            <input
              required
              type="url"
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.imageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
            />
          </label>
          <label className="md:col-span-2 flex flex-col text-sm font-medium text-slate-700">
            Click-through URL
            <input
              required
              type="url"
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={form.clickUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, clickUrl: event.target.value }))}
            />
          </label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-500"
              disabled={saving}
            >
              {saving ? "Saving…" : "Add ad"}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Existing ads</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading ads…</p>
        ) : ads.length === 0 ? (
          <p className="text-sm text-slate-500">No ads configured yet.</p>
        ) : (
          <ul className="space-y-4">
            {ads.map((ad) => {
              const edit = editState[ad.id];
              return (
                <li key={ad.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="grid flex-1 gap-3 md:grid-cols-2">
                      <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Zone
                        <select
                          className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                          value={edit?.zone ?? ad.zone}
                          onChange={(event) => handleEditChange(ad.id, "zone", event.target.value as AdZone)}
                        >
                          <option value="top">Top</option>
                          <option value="bottom">Bottom</option>
                        </select>
                      </label>
                      <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Weight
                        <input
                          type="number"
                          min={1}
                          className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                          value={edit?.weight ?? ad.weight}
                          onChange={(event) => handleEditChange(ad.id, "weight", Number(event.target.value))}
                        />
                      </label>
                      <label className="md:col-span-2 flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Image URL
                        <input
                          type="url"
                          className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                          value={edit?.imageUrl ?? ad.imageUrl}
                          onChange={(event) => handleEditChange(ad.id, "imageUrl", event.target.value)}
                        />
                      </label>
                      <label className="md:col-span-2 flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Click URL
                        <input
                          type="url"
                          className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                          value={edit?.clickUrl ?? ad.clickUrl}
                          onChange={(event) => handleEditChange(ad.id, "clickUrl", event.target.value)}
                        />
                      </label>
                    </div>
                    <div className="flex flex-col gap-2 md:w-40">
                      <button
                        type="button"
                        className="rounded-md bg-brand-orange px-3 py-2 text-sm font-semibold text-white shadow hover:bg-orange-500"
                        onClick={() => handleSaveAd(ad.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(ad.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdManager;
