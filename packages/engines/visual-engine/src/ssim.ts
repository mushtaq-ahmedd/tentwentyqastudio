/**
 * Windowed Structural Similarity (SSIM, Wang et al. 2004) via OpenCV.js — replaces raw
 * per-pixel color-difference thresholding (pixelmatch alone) as the primary "are these two
 * screenshots meaningfully different" signal. docs/08: "OpenCV adds layout analysis, region/edge
 * detection, contours, alignment, bounding boxes, structural similarity — improves visual
 * accuracy beyond raw pixel diff."
 *
 * Why this matters for accuracy: raw pixel-diff counts any color change as equally significant,
 * including sub-pixel anti-aliasing/font-rendering noise between two renders of an *unchanged*
 * page — a real, common source of false-positive "visual regression" findings. SSIM instead
 * compares local luminance, contrast, and structure over a sliding window, so uniform rendering
 * noise scores close to 1.0 (identical) while genuine content/layout changes score meaningfully
 * lower — the same reason SSIM is the standard metric in visual-regression tooling generally, not
 * an tentwenty QA Studio invention.
 *
 * Uses @techstark/opencv-js (a WASM port) rather than the native `opencv4nodejs` binding —
 * `opencv4nodejs` requires a system OpenCV install plus native compilation (node-gyp), which
 * wasn't available in this environment (no Docker, no pre-built OpenCV). The WASM port needs no
 * native build step and is fully portable across dev machines and CI.
 */
import cvReadyPromise from "@techstark/opencv-js";

const K1 = 0.01;
const K2 = 0.03;
const L = 255; // dynamic range for 8-bit grayscale
const C1 = (K1 * L) ** 2;
const C2 = (K2 * L) ** 2;
/** Standard SSIM window size/sigma (Wang et al.'s reference implementation). */
const GAUSSIAN_KERNEL_SIZE = 11;
const GAUSSIAN_SIGMA = 1.5;
/** Below this per-window SSIM value, a region counts as "changed" for contour detection. */
const REGION_DISSIMILARITY_CUTOFF = 0.3;
/** Filters single-pixel/anti-aliasing-speck contours out of the reported region list. */
const MIN_REGION_AREA_PX = 150;
/** Real full-page screenshots of long marketing/content pages can be 8000+ px tall. This
 * pipeline holds ~15 float32 Mats alive at once (see `track()` below) — at native resolution, a
 * single large real page (observed: 1440x8808, live-verified crash) needs 750MB+ of simultaneous
 * WASM heap, which aborts the WASM runtime with a raw memory-address "error" (a bare number, not
 * a JS Error — this is what made it hard to diagnose). Every synthetic test fixture used during
 * development was small (120x120), so this never surfaced until a real audit ran against a real,
 * long page. Capping the longer dimension keeps peak memory bounded regardless of input size;
 * region coordinates are scaled back up to the original screenshot's pixel space before being
 * returned, so reported bounding boxes still locate the change correctly on the real evidence
 * image. */
const MAX_DIMENSION = 2000;

export type ChangedRegion = { x: number; y: number; width: number; height: number };

export type SsimResult = {
  /** 1 = identical, 0 = completely dissimilar. */
  meanSsim: number;
  /** Distinct bounding boxes where local similarity dropped below the cutoff — docs/08's "region
   * detection... bounding boxes", giving structured evidence instead of one page-level blob. */
  changedRegions: ChangedRegion[];
};

type RawImage = { data: Buffer; width: number; height: number };

export async function computeSsim(current: RawImage, previous: RawImage): Promise<SsimResult> {
  const cv = await cvReadyPromise;
  const mats: InstanceType<typeof cv.Mat>[] = [];
  const track = <T extends InstanceType<typeof cv.Mat>>(m: T): T => {
    mats.push(m);
    return m;
  };

  try {
    const rawCurrentMat = track(cv.matFromImageData({ data: current.data, width: current.width, height: current.height }));
    const rawPreviousMat = track(cv.matFromImageData({ data: previous.data, width: previous.width, height: previous.height }));

    const longerSide = Math.max(current.width, current.height);
    const scale = longerSide > MAX_DIMENSION ? MAX_DIMENSION / longerSide : 1;
    let currentMat = rawCurrentMat;
    let previousMat = rawPreviousMat;
    if (scale < 1) {
      const dsize = new cv.Size(Math.round(current.width * scale), Math.round(current.height * scale));
      const resizedCurrent = track(new cv.Mat());
      const resizedPrevious = track(new cv.Mat());
      cv.resize(rawCurrentMat, resizedCurrent, dsize, 0, 0, cv.INTER_AREA);
      cv.resize(rawPreviousMat, resizedPrevious, dsize, 0, 0, cv.INTER_AREA);
      currentMat = resizedCurrent;
      previousMat = resizedPrevious;
    }

    const grayCurrent = track(new cv.Mat());
    const grayPrevious = track(new cv.Mat());
    cv.cvtColor(currentMat, grayCurrent, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(previousMat, grayPrevious, cv.COLOR_RGBA2GRAY);

    const x = track(new cv.Mat());
    const y = track(new cv.Mat());
    grayCurrent.convertTo(x, cv.CV_32F);
    grayPrevious.convertTo(y, cv.CV_32F);

    const ksize = new cv.Size(GAUSSIAN_KERNEL_SIZE, GAUSSIAN_KERNEL_SIZE);
    const blur = (src: InstanceType<typeof cv.Mat>): InstanceType<typeof cv.Mat> => {
      const dst = track(new cv.Mat());
      cv.GaussianBlur(src, dst, ksize, GAUSSIAN_SIGMA);
      return dst;
    };
    const multiply = (a: InstanceType<typeof cv.Mat>, b: InstanceType<typeof cv.Mat>): InstanceType<typeof cv.Mat> => {
      const dst = track(new cv.Mat());
      cv.multiply(a, b, dst);
      return dst;
    };

    const muX = blur(x);
    const muY = blur(y);
    const muX2 = multiply(muX, muX);
    const muY2 = multiply(muY, muY);
    const muXY = multiply(muX, muY);

    const sigmaX2 = track(new cv.Mat());
    const sigmaY2 = track(new cv.Mat());
    const sigmaXY = track(new cv.Mat());
    cv.subtract(blur(multiply(x, x)), muX2, sigmaX2);
    cv.subtract(blur(multiply(y, y)), muY2, sigmaY2);
    cv.subtract(blur(multiply(x, y)), muXY, sigmaXY);

    // numerator = (2*muXY + C1) * (2*sigmaXY + C2)
    const twoMuXYPlusC1 = track(new cv.Mat());
    cv.addWeighted(muXY, 2, muXY, 0, C1, twoMuXYPlusC1);
    const twoSigmaXYPlusC2 = track(new cv.Mat());
    cv.addWeighted(sigmaXY, 2, sigmaXY, 0, C2, twoSigmaXYPlusC2);
    const numerator = multiply(twoMuXYPlusC1, twoSigmaXYPlusC2);

    // denominator = (muX2 + muY2 + C1) * (sigmaX2 + sigmaY2 + C2)
    const muSumPlusC1 = track(new cv.Mat());
    cv.add(muX2, muY2, muSumPlusC1);
    cv.addWeighted(muSumPlusC1, 1, muSumPlusC1, 0, C1, muSumPlusC1);
    const sigmaSumPlusC2 = track(new cv.Mat());
    cv.add(sigmaX2, sigmaY2, sigmaSumPlusC2);
    cv.addWeighted(sigmaSumPlusC2, 1, sigmaSumPlusC2, 0, C2, sigmaSumPlusC2);
    const denominator = multiply(muSumPlusC1, sigmaSumPlusC2);

    const ssimMap = track(new cv.Mat());
    cv.divide(numerator, denominator, ssimMap);
    const meanSsim = cv.mean(ssimMap)[0];

    // Region detection: threshold (1 - ssimMap) to find contiguous dissimilar regions, per
    // docs/08's "region/edge detection, contours... bounding boxes."
    const ones = track(new cv.Mat(ssimMap.rows, ssimMap.cols, ssimMap.type(), new cv.Scalar(1)));
    const dissimilarity = track(new cv.Mat());
    cv.subtract(ones, ssimMap, dissimilarity);
    const mask8u = track(new cv.Mat());
    dissimilarity.convertTo(mask8u, cv.CV_8U, 255);
    const binary = track(new cv.Mat());
    cv.threshold(mask8u, binary, Math.round(REGION_DISSIMILARITY_CUTOFF * 255), 255, cv.THRESH_BINARY);

    const contours = new cv.MatVector();
    const hierarchy = track(new cv.Mat());
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Contours were found in (possibly downscaled) working-resolution space — scale bounding
    // boxes back up to the original screenshot's pixel space so reported regions still correctly
    // locate the change on the real, full-resolution evidence image.
    const changedRegions: ChangedRegion[] = [];
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const rect = cv.boundingRect(contour);
      if (rect.width * rect.height >= MIN_REGION_AREA_PX) {
        changedRegions.push({
          x: Math.round(rect.x / scale),
          y: Math.round(rect.y / scale),
          width: Math.round(rect.width / scale),
          height: Math.round(rect.height / scale),
        });
      }
      contour.delete();
    }
    contours.delete();

    return { meanSsim, changedRegions };
  } finally {
    // WASM OpenCV Mats are manually managed (no GC) — every Mat created above must be deleted.
    for (const m of mats) m.delete();
  }
}
