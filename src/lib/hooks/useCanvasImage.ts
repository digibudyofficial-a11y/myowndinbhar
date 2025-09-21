import { useEffect, useState } from "react";

export type ImageStatus = "idle" | "loading" | "loaded" | "error";

export const useCanvasImage = (source?: string | null) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<ImageStatus>("idle");

  useEffect(() => {
    if (!source) {
      setImage(null);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const img = new Image();
    img.decoding = "async";
    if (!source.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      setImage(img);
      setStatus("loaded");
    };
    img.onerror = () => {
      setImage(null);
      setStatus("error");
    };
    img.src = source;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [source]);

  return { image, status };
};
