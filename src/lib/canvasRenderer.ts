import {
  BOTTOM_AD_HEIGHT,
  CANVAS_HEIGHT,
  CANVAS_PADDING,
  CANVAS_WIDTH,
  FOOTER_HEIGHT,
  MASTHEAD_HEIGHT,
  TOP_AD_HEIGHT,
} from "./constants";
import type { TemplateConfig } from "./templates";

export interface PosterRenderData {
  template: TemplateConfig;
  headline: string;
  body: string;
  textColor: string;
  headlineFont?: string;
  bodyFont?: string;
  storyImage?: HTMLImageElement | null;
  mastheadImage?: HTMLImageElement | null;
  topAdImage?: HTMLImageElement | null;
  bottomAdImage?: HTMLImageElement | null;
  brightness: number;
  contrast: number;
  attribution: string;
}

export interface PosterRenderResult {
  headlineOverflow: boolean;
  bodyOverflow: boolean;
}

export interface WrappedText {
  lines: string[];
  height: number;
}

export const CANVAS_SIZE = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } as const;

export async function renderPoster(
  ctx: CanvasRenderingContext2D,
  data: PosterRenderData,
): Promise<PosterRenderResult> {
  const canvas = ctx.canvas;
  if (canvas.width !== CANVAS_WIDTH || canvas.height !== CANVAS_HEIGHT) {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  }

  await document.fonts.ready;

  try {
    await Promise.all([
      ensureImageReady(data.storyImage),
      ensureImageReady(data.mastheadImage),
      ensureImageReady(data.topAdImage),
      ensureImageReady(data.bottomAdImage),
    ]);
  } catch (error) {
    console.warn("One or more images failed to load", error);
  }

  ctx.save();
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = data.template.backgroundColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();

  if (data.mastheadImage) {
    drawCoverImage(ctx, data.mastheadImage, 0, 0, CANVAS_WIDTH, MASTHEAD_HEIGHT, 0);
  } else {
    drawPlaceholderBar(ctx, 0, 0, CANVAS_WIDTH, MASTHEAD_HEIGHT, "#f97316");
  }

  if (data.topAdImage) {
    drawContainImage(ctx, data.topAdImage, CANVAS_PADDING, MASTHEAD_HEIGHT + 12, CANVAS_WIDTH - CANVAS_PADDING * 2, TOP_AD_HEIGHT - 24, 16);
  }

  if (data.bottomAdImage) {
    const y = CANVAS_HEIGHT - FOOTER_HEIGHT - BOTTOM_AD_HEIGHT + 12;
    drawContainImage(ctx, data.bottomAdImage, CANVAS_PADDING, y, CANVAS_WIDTH - CANVAS_PADDING * 2, BOTTOM_AD_HEIGHT - 24, 16);
  }

  const headlineFont = data.headlineFont ?? `700 ${data.template.headline.fontSize}px "Modak", sans-serif`;
  const bodyFont = data.bodyFont ?? `500 ${data.template.body.fontSize}px "Inter", sans-serif`;

  ctx.fillStyle = data.textColor;
  ctx.textBaseline = "top";

  ctx.font = headlineFont;
  const headlineWrapped = wrapText(ctx, data.headline, data.template.headline.maxWidth, data.template.headline.lineHeight);
  const maxHeadlineLines = Math.max(1, Math.floor(data.template.headline.height / data.template.headline.lineHeight));
  const headlineLines = clipLines(headlineWrapped.lines, maxHeadlineLines);
  const headlineOverflow = headlineWrapped.lines.length > headlineLines.length;
  drawLines(
    ctx,
    headlineLines,
    data.template.headline.x,
    data.template.headline.y,
    data.template.headline.lineHeight,
    data.template.headline.align ?? "left",
    data.template.headline.maxWidth,
  );

  if (data.storyImage) {
    drawCoverImage(
      ctx,
      data.storyImage,
      data.template.image.x,
      data.template.image.y,
      data.template.image.width,
      data.template.image.height,
      data.template.image.borderRadius ?? 0,
      data.brightness,
      data.contrast,
    );
  } else {
    drawPlaceholderBar(
      ctx,
      data.template.image.x,
      data.template.image.y,
      data.template.image.width,
      data.template.image.height,
      "#e5e7eb",
    );
  }

  ctx.font = bodyFont;
  const bodyWrapped = wrapText(ctx, data.body, data.template.body.maxWidth, data.template.body.lineHeight);
  const maxBodyLines = Math.max(1, Math.floor(data.template.body.height / data.template.body.lineHeight));
  const bodyLines = clipLines(bodyWrapped.lines, maxBodyLines);
  const bodyOverflow = bodyWrapped.lines.length > bodyLines.length;
  drawLines(
    ctx,
    bodyLines,
    data.template.body.x,
    data.template.body.y,
    data.template.body.lineHeight,
    data.template.body.align ?? "left",
    data.template.body.maxWidth,
  );

  drawAttribution(ctx, data.attribution);

  return { headlineOverflow, bodyOverflow };
}

function drawAttribution(ctx: CanvasRenderingContext2D, text: string) {
  ctx.save();
  ctx.fillStyle = "#374151";
  ctx.font = `500 26px "Inter", sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const y = CANVAS_HEIGHT - FOOTER_HEIGHT / 2;
  ctx.fillText(text, CANVAS_WIDTH - CANVAS_PADDING, y);
  ctx.restore();
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  align: CanvasTextAlign,
  maxWidth: number,
) {
  ctx.save();
  ctx.textAlign = align;
  const startX = align === "center" ? x + maxWidth / 2 : align === "right" ? x + maxWidth : x;
  let currentY = y;
  for (const line of lines) {
    ctx.fillText(line, startX, currentY);
    currentY += lineHeight;
  }
  ctx.restore();
}

function drawPlaceholderBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, width, height, 12);
  ctx.fill();
  ctx.restore();
}

function clipLines(lines: string[], maxLines: number) {
  if (lines.length <= maxLines) {
    return lines;
  }
  const clipped = lines.slice(0, maxLines);
  clipped[clipped.length - 1] = addEllipsis(clipped[clipped.length - 1]);
  return clipped;
}

function addEllipsis(line: string) {
  const trimmed = line.trimEnd();
  return trimmed.endsWith("…") ? trimmed : `${trimmed}…`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawContainImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.clip();
  const metrics = getContainMetrics(image, width, height);
  ctx.drawImage(image, metrics.x + x, metrics.y + y, metrics.width, metrics.height);
  ctx.restore();
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  brightness = 100,
  contrast = 100,
) {
  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.clip();
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  const metrics = getCoverMetrics(image, width, height);
  ctx.drawImage(image, metrics.x + x, metrics.y + y, metrics.width, metrics.height);
  ctx.restore();
}

function getCoverMetrics(image: HTMLImageElement, width: number, height: number) {
  if (!image.width || !image.height) {
    return { width, height, x: 0, y: 0 };
  }
  const imageRatio = image.width / image.height;
  const frameRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  if (imageRatio > frameRatio) {
    drawHeight = height;
    drawWidth = height * imageRatio;
  } else {
    drawWidth = width;
    drawHeight = width / imageRatio;
  }
  return {
    width: drawWidth,
    height: drawHeight,
    x: (width - drawWidth) / 2,
    y: (height - drawHeight) / 2,
  };
}

function getContainMetrics(image: HTMLImageElement, width: number, height: number) {
  if (!image.width || !image.height) {
    return { width, height, x: 0, y: 0 };
  }
  const imageRatio = image.width / image.height;
  const frameRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  if (imageRatio > frameRatio) {
    drawWidth = width;
    drawHeight = width / imageRatio;
  } else {
    drawHeight = height;
    drawWidth = height * imageRatio;
  }
  return {
    width: drawWidth,
    height: drawHeight,
    x: (width - drawWidth) / 2,
    y: (height - drawHeight) / 2,
  };
}

async function ensureImageReady(image?: HTMLImageElement | null) {
  if (!image) {
    return;
  }
  if (image.complete && image.naturalWidth > 0) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to load image"));
  });
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
): WrappedText {
  const sanitized = text.replace(/\r/g, "");
  const paragraphs = sanitized.split(/\n/);
  const lines: string[] = [];

  paragraphs.forEach((paragraph, index) => {
    const trimmedParagraph = paragraph.trim();
    if (trimmedParagraph.length === 0) {
      lines.push("");
      return;
    }
    const words = trimmedParagraph.split(/\s+/);
    let currentLine = "";
    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
        continue;
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      if (ctx.measureText(word).width <= maxWidth) {
        currentLine = word;
      } else {
        const broken = breakWord(ctx, word, maxWidth);
        if (broken.length > 0) {
          lines.push(...broken.slice(0, -1));
          currentLine = broken[broken.length - 1];
        } else {
          currentLine = word;
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    if (index < paragraphs.length - 1) {
      lines.push("");
    }
  });

  return { lines, height: lines.length * lineHeight };
}

function breakWord(ctx: CanvasRenderingContext2D, word: string, maxWidth: number) {
  const segments: string[] = [];
  const glyphs = Array.from(word);
  let current = "";
  for (const glyph of glyphs) {
    const candidate = current + glyph;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) {
      segments.push(current);
      current = glyph;
    } else {
      segments.push(glyph);
    }
  }
  if (current) {
    segments.push(current);
  }
  return segments;
}

export function toPng(canvas: HTMLCanvasElement) {
  return canvas.toDataURL("image/png");
}
