import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { addDoc, collection, onSnapshot, query, serverTimestamp } from "firebase/firestore";
import { Navigate, useOutletContext } from "react-router-dom";

import PosterCanvas from "../components/PosterCanvas";
import AdSlot from "../components/Ads/AdSlot";
import { useAuth, db } from "../lib/firebase";
import { useCanvasImage } from "../lib/hooks/useCanvasImage";
import { getTemplateById, templateOptions, type TemplateId } from "../lib/templates";
import type { AdDocument } from "../lib/types";
import { renderPoster, toPng } from "../lib/canvasRenderer";
import type { AppOutletContext } from "../App";

const formatIST = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);

const buildQueue = (ads: AdDocument[]) => {
  const queue: AdDocument[] = [];
  ads.forEach((ad) => {
    const weight = Math.max(1, Math.round(ad.weight || 1));
    for (let index = 0; index < weight; index += 1) {
      queue.push(ad);
    }
  });
  return queue.length > 0 ? queue : ads;
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const outlet = useOutletContext<AppOutletContext>();
  const [templateId, setTemplateId] = useState<TemplateId>("classic");
  const [headline, setHeadline] = useState("ताज़ा खबर यहाँ");
  const [body, setBody] = useState("यहाँ पर विस्तृत विवरण लिखें और सुनिश्चित करें कि कहानी स्पष्ट और संक्षिप्त हो।");
  const [storyImageUrl, setStoryImageUrl] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [overflow, setOverflow] = useState({ headline: false, body: false });
  const [ads, setAds] = useState<AdDocument[]>([]);
  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [previewDate, setPreviewDate] = useState(() => new Date());

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const adsRef = collection(db, "ads");
    const unsubscribe = onSnapshot(query(adsRef), (snapshot) => {
      const docs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<AdDocument, "id">),
      }));
      setAds(docs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setPreviewDate(new Date());
  }, [headline, body, templateId, brightness, contrast, storyImageUrl]);

  const topAds = useMemo(() => buildQueue(ads.filter((ad) => ad.zone === "top")), [ads]);
  const bottomAds = useMemo(() => buildQueue(ads.filter((ad) => ad.zone === "bottom")), [ads]);

  useEffect(() => {
    setTopIndex(0);
  }, [topAds.length]);

  useEffect(() => {
    setBottomIndex(0);
  }, [bottomAds.length]);

  useEffect(() => {
    return () => {
      if (storyImageUrl && storyImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(storyImageUrl);
      }
    };
  }, [storyImageUrl]);

  const activeTopAd = topAds.length > 0 ? topAds[topIndex % topAds.length] : undefined;
  const activeBottomAd = bottomAds.length > 0 ? bottomAds[bottomIndex % bottomAds.length] : undefined;

  const { image: mastheadImage } = useCanvasImage(outlet?.mastheadImage);
  const { image: storyImage } = useCanvasImage(storyImageUrl);
  const { image: topAdImage } = useCanvasImage(activeTopAd?.imageUrl);
  const { image: bottomAdImage } = useCanvasImage(activeBottomAd?.imageUrl);

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  const attribution = `Poster by: ${profile.displayName || user.email || "Unknown"} • ${formatIST(previewDate)}`;

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setStoryImageUrl((previous) => {
      if (previous && previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return url;
    });
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    try {
      const now = new Date();
      const freshAttribution = `Poster by: ${profile.displayName || user.email || "Unknown"} • ${formatIST(now)}`;
      const template = getTemplateById(templateId);
      const result = await renderPoster(ctx, {
        template,
        headline,
        body,
        storyImage,
        mastheadImage,
        topAdImage,
        bottomAdImage,
        brightness,
        contrast,
        textColor: "#000000",
        attribution: freshAttribution,
      });
      setOverflow({ headline: result.headlineOverflow, body: result.bodyOverflow });
      setPreviewDate(now);

      const dataUrl = toPng(canvasRef.current);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `dinbhar-poster-${Date.now()}.png`;
      link.click();

      await addDoc(collection(db, "exports"), {
        userId: user.uid,
        template: templateId,
        headlineLen: headline.length,
        createdAt: serverTimestamp(),
      });

      if (topAds.length > 0) {
        setTopIndex((prev) => (prev + 1) % topAds.length);
      }
      if (bottomAds.length > 0) {
        setBottomIndex((prev) => (prev + 1) % bottomAds.length);
      }
      setStatus("Exported PNG successfully.");
    } catch (error) {
      console.error("Failed to export poster", error);
      setStatus("Export failed. Please retry.");
    }
  };

  const clearStatus = () => setStatus(null);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 pb-24">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <PosterCanvas
            canvasRef={canvasRef}
            templateId={templateId}
            headline={headline}
            body={body}
            storyImage={storyImage}
            mastheadImage={mastheadImage}
            topAdImage={topAdImage}
            bottomAdImage={bottomAdImage}
            brightness={brightness}
            contrast={contrast}
            attribution={attribution}
            onRender={(result) =>
              setOverflow({
                headline: result.headlineOverflow,
                body: result.bodyOverflow,
              })
            }
          />
          <div className="space-y-2">
            {overflow.headline ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-700">
                Headline text exceeds the allocated space. Consider shortening it.
              </p>
            ) : null}
            {overflow.body ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-700">
                Body text was truncated. Trim copy or switch to a different template.
              </p>
            ) : null}
            {status ? (
              <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <span>{status}</span>
                <button type="button" className="text-xs font-semibold" onClick={clearStatus}>
                  Dismiss
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800">Story details</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Template
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value as TemplateId)}
                >
                  {templateOptions.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Headline
                <textarea
                  className="mt-1 h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Story body
                <textarea
                  className="mt-1 h-32 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Brightness
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={brightness}
                    onChange={(event) => setBrightness(Number(event.target.value))}
                    className="mt-2 w-full"
                  />
                  <span className="text-xs text-slate-500">{brightness}%</span>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Contrast
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={contrast}
                    onChange={(event) => setContrast(Number(event.target.value))}
                    className="mt-2 w-full"
                  />
                  <span className="text-xs text-slate-500">{contrast}%</span>
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Story image
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                  onChange={handleImageUpload}
                />
              </label>
              {storyImageUrl ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600 hover:underline"
                  onClick={() => setStoryImageUrl(null)}
                >
                  Remove image
                </button>
              ) : null}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800">Export</h2>
            <p className="mt-1 text-sm text-slate-500">Ads rotate to the next creative every time you export.</p>
            <button
              type="button"
              className="mt-4 w-full rounded-md bg-brand-orange px-4 py-2 text-center text-sm font-semibold text-white shadow hover:bg-orange-500"
              onClick={handleDownload}
            >
              Download PNG
            </button>
          </div>
          <AdSlot title="Top zone" ad={activeTopAd} />
          <AdSlot title="Bottom zone" ad={activeBottomAd} />
        </aside>
      </section>
    </div>
  );
};

export default Dashboard;
