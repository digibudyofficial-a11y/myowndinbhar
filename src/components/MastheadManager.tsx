import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import Masthead, { MASTHEAD_PLACEHOLDER } from "./Masthead";
import { useAuth } from "../lib/firebase";
import { saveMastheadImage, useMasthead } from "../lib/hooks/useMasthead";

const MastheadManager = () => {
  const { masthead, loading } = useMasthead();
  const { user } = useAuth();
  const [preview, setPreview] = useState<string>(MASTHEAD_PLACEHOLDER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (masthead?.imageData) {
      setPreview(masthead.imageData);
    }
  }, [masthead]);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setPreview(result);
      }
    };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      await saveMastheadImage(preview, user?.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save masthead");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveMastheadImage(MASTHEAD_PLACEHOLDER, user?.uid);
      setPreview(MASTHEAD_PLACEHOLDER);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset masthead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Masthead</h2>
          <p className="text-sm text-slate-500">
            Upload a base64 compatible graphic. This asset is publicly readable and appears on every export.
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <Masthead src={preview} />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="w-full max-w-sm space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Replace masthead image
            <input
              type="file"
              accept="image/*"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              onChange={handleFile}
              disabled={saving}
            />
          </label>
          <textarea
            className="h-32 w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono"
            value={preview}
            onChange={(event) => setPreview(event.target.value)}
            placeholder="Paste data URL here"
            disabled={saving}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving ? "Saving…" : "Save masthead"}
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={handleReset}
              disabled={saving}
            >
              Reset to default
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MastheadManager;
