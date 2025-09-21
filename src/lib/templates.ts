import {
  BOTTOM_AD_HEIGHT,
  CANVAS_HEIGHT,
  CANVAS_PADDING,
  CANVAS_WIDTH,
  FOOTER_HEIGHT,
  MASTHEAD_HEIGHT,
  TOP_AD_HEIGHT,
} from "./constants";

export type TemplateId = "classic" | "compact" | "magazine";

export interface TemplateTextBlock {
  x: number;
  y: number;
  maxWidth: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  fontWeight?: number;
  align?: CanvasTextAlign;
  uppercase?: boolean;
}

export interface TemplateImageBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
}

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  headline: TemplateTextBlock;
  body: TemplateTextBlock;
  image: TemplateImageBlock;
  backgroundColor: string;
}

const contentWidth = CANVAS_WIDTH - CANVAS_PADDING * 2;
const baseHeadlineTop = MASTHEAD_HEIGHT + TOP_AD_HEIGHT + CANVAS_PADDING;
const footerTopLimit = CANVAS_HEIGHT - FOOTER_HEIGHT - CANVAS_PADDING / 2 - BOTTOM_AD_HEIGHT;

const classicHeadlineHeight = 220;
const classicImageHeight = 360;
const classicImageTop = baseHeadlineTop + classicHeadlineHeight + 24;
const classicBodyTop = classicImageTop + classicImageHeight + 28;

const compactHeadlineHeight = 160;
const compactImageHeight = 300;
const compactImageTop = baseHeadlineTop + compactHeadlineHeight + 20;
const compactBodyTop = compactImageTop + compactImageHeight + 24;

const magazineHeadlineHeight = 280;
const magazineImageHeight = 420;
const magazineImageTop = baseHeadlineTop + magazineHeadlineHeight + 16;
const magazineBodyTop = magazineImageTop + magazineImageHeight + 24;

export const templates: TemplateConfig[] = [
  {
    id: "classic",
    name: "Classic",
    backgroundColor: "#ffffff",
    headline: {
      x: CANVAS_PADDING,
      y: baseHeadlineTop,
      maxWidth: contentWidth,
      height: classicHeadlineHeight,
      fontSize: 86,
      lineHeight: 96,
      fontWeight: 700,
    },
    image: {
      x: CANVAS_PADDING,
      y: classicImageTop,
      width: contentWidth,
      height: classicImageHeight,
      borderRadius: 24,
    },
    body: {
      x: CANVAS_PADDING,
      y: classicBodyTop,
      maxWidth: contentWidth,
      height: Math.max(footerTopLimit - classicBodyTop, 180),
      fontSize: 32,
      lineHeight: 40,
    },
  },
  {
    id: "compact",
    name: "Compact",
    backgroundColor: "#ffffff",
    headline: {
      x: CANVAS_PADDING,
      y: baseHeadlineTop,
      maxWidth: contentWidth,
      height: compactHeadlineHeight,
      fontSize: 72,
      lineHeight: 84,
      fontWeight: 700,
    },
    image: {
      x: CANVAS_PADDING,
      y: compactImageTop,
      width: contentWidth,
      height: compactImageHeight,
      borderRadius: 16,
    },
    body: {
      x: CANVAS_PADDING,
      y: compactBodyTop,
      maxWidth: contentWidth,
      height: Math.max(footerTopLimit - compactBodyTop, 280),
      fontSize: 30,
      lineHeight: 36,
    },
  },
  {
    id: "magazine",
    name: "Magazine",
    backgroundColor: "#ffffff",
    headline: {
      x: CANVAS_PADDING,
      y: baseHeadlineTop,
      maxWidth: contentWidth,
      height: magazineHeadlineHeight,
      fontSize: 96,
      lineHeight: 110,
      fontWeight: 700,
    },
    image: {
      x: CANVAS_PADDING,
      y: magazineImageTop,
      width: contentWidth,
      height: magazineImageHeight,
      borderRadius: 32,
    },
    body: {
      x: CANVAS_PADDING,
      y: magazineBodyTop,
      maxWidth: contentWidth,
      height: Math.max(footerTopLimit - magazineBodyTop, 160),
      fontSize: 28,
      lineHeight: 34,
    },
  },
];

export const templateOptions = templates.map((template) => ({
  id: template.id,
  name: template.name,
}));

export const getTemplateById = (id: TemplateId): TemplateConfig => {
  const template = templates.find((tpl) => tpl.id === id);
  if (!template) {
    return templates[0];
  }
  return template;
};
