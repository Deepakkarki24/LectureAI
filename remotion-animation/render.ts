import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import type { LectureVideoProps } from "./src/types/scene.js";

export type { LectureVideoProps, Scene } from "./src/types/scene.js";
export type {
  PdfAnimationScene,
  PdfAnimationScenePlan,
  PdfAnimationType,
  NormalizedRegion,
} from "./src/types/pdfAnimationScene.js";

export type RenderLectureVideoOptions = {
  /** Absolute or relative path for the rendered mp4. Defaults to <package>/out/video.mp4 */
  outputLocation?: string;
  compositionId?: string;
  inputProps?: Partial<LectureVideoProps>;
};

const getPackageRoot = () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.basename(here) === "dist" ? path.resolve(here, "..") : here;
};

/**
 * Programmatic Remotion render API for the lecture video composition.
 * Safe to call from the Express server — no CLI / spawn required.
 */
export const renderLectureVideo = async (
  options: RenderLectureVideoOptions = {},
): Promise<string> => {
  const packageRoot = getPackageRoot();
  const compositionId = options.compositionId ?? "LectureVideo";
  const inputProps: LectureVideoProps = {
    audioUrl: options.inputProps?.audioUrl ?? "",
    scenes: options.inputProps?.scenes ?? [],
    pageImageUrls: options.inputProps?.pageImageUrls ?? [],
    pdfAnimationScenes: options.inputProps?.pdfAnimationScenes ?? [],
  };

  const hasPdfPlan =
    (inputProps.pageImageUrls?.length ?? 0) > 0 &&
    (inputProps.pdfAnimationScenes?.length ?? 0) > 0;
  const hasSlidePlan = inputProps.scenes.length > 0;

  if (!inputProps.audioUrl || (!hasPdfPlan && !hasSlidePlan)) {
    throw new Error(
      "renderLectureVideo requires audioUrl and either slide scenes or pdfAnimationScenes + pageImageUrls",
    );
  }

  const outputLocation = path.resolve(
    options.outputLocation ?? path.join(packageRoot, "out", "video.mp4"),
  );

  await fs.mkdir(path.dirname(outputLocation), { recursive: true });
  await ensureBrowser();

  const serveUrl = await bundle({
    entryPoint: path.join(packageRoot, "src", "index.ts"),
    rootDir: packageRoot,
  });

  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps,
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps,
  });

  return outputLocation;
};
