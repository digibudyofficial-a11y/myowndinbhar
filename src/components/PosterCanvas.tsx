import { useEffect } from "react";

import { type PosterRenderResult, renderPoster } from "../lib/canvasRenderer";
import { getTemplateById, type TemplateId } from "../lib/templates";

interface PosterCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  templateId: TemplateId;
  headline: string;
  body: string;
  storyImage?: HTMLImageElement | null;
  mastheadImage?: HTMLImageElement | null;
  topAdImage?: HTMLImageElement | null;
  bottomAdImage?: HTMLImageElement | null;
  brightness: number;
  contrast: number;
  textColor?: string;
  attribution: string;
  onRender?: (result: PosterRenderResult) => void;
}

const PosterCanvas = ({
  canvasRef,
  templateId,
  headline,
  body,
  storyImage,
  mastheadImage,
  topAdImage,
  bottomAdImage,
  brightness,
  contrast,
  textColor = "#000000",
  attribution,
  onRender,
}: PosterCanvasProps) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    let cancelled = false;

    const template = getTemplateById(templateId);

    const draw = async () => {
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
        textColor,
        attribution,
      });
      if (!cancelled) {
        onRender?.(result);
      }
    };

    void draw();
    return () => {
      cancelled = true;
    };
  }, [
    canvasRef,
    templateId,
    headline,
    body,
    storyImage,
    mastheadImage,
    topAdImage,
    bottomAdImage,
    brightness,
    contrast,
    textColor,
    attribution,
    onRender,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={1080}
      height={1350}
      className="w-full rounded-xl border border-slate-200 bg-white shadow-lg"
    />
  );
};

export default PosterCanvas;
