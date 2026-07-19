/**
 * Manual fixture verification for computeSsim() — no test runner exists in this repo (same
 * pattern as element-matching-engine's matching.verify.ts). Run via:
 *   pnpm --filter @tentwenty/visual-engine exec tsx src/ssim.verify.ts
 */
import { PNG } from "pngjs";
import { computeSsim } from "./ssim";

const WIDTH = 120;
const HEIGHT = 120;

function solidImage(r: number, g: number, b: number): { data: Buffer; width: number; height: number } {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const idx = (WIDTH * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }
  return { data: png.data, width: WIDTH, height: HEIGHT };
}

/** Same base color, but with a small amount of per-pixel random noise — simulates
 * anti-aliasing/font-rendering variance between two renders of an *unchanged* page. */
function noisyVariant(base: { data: Buffer; width: number; height: number }, amplitude: number) {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  for (let i = 0; i < base.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const jitter = Math.round((Math.random() - 0.5) * 2 * amplitude);
      png.data[i + c] = Math.max(0, Math.min(255, base.data[i + c] + jitter));
    }
    png.data[i + 3] = 255;
  }
  return { data: png.data, width: WIDTH, height: HEIGHT };
}

/** Same base color, but with a solid 30x30 block changed to a contrasting color — simulates a
 * genuine content/layout change. */
function withChangedBlock(base: { data: Buffer; width: number; height: number }, r: number, g: number, b: number) {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  base.data.copy(png.data);
  for (let y = 40; y < 70; y++) {
    for (let x = 40; x < 70; x++) {
      const idx = (WIDTH * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }
  return { data: png.data, width: WIDTH, height: HEIGHT };
}

let failures = 0;
function check(label: string, condition: boolean, detail: string) {
  if (condition) {
    console.log(`PASS  ${label} (${detail})`);
  } else {
    console.error(`FAIL  ${label} (${detail})`);
    failures++;
  }
}

async function main() {
  const base = solidImage(120, 130, 200);

  // 1. Identical images -> SSIM should be (near) exactly 1.0, no changed regions.
  const identical = await computeSsim(base, base);
  check("identical images score ~1.0", identical.meanSsim > 0.999, `meanSsim=${identical.meanSsim.toFixed(4)}`);
  check("identical images have no changed regions", identical.changedRegions.length === 0, `regions=${identical.changedRegions.length}`);

  // 2. Anti-aliasing-scale noise (±4 per channel) -> SSIM should stay very high (>0.9) — this is
  // the exact false-positive class raw pixelmatch is prone to.
  const noisy = noisyVariant(base, 4);
  const noisyResult = await computeSsim(base, noisy);
  check("mild rendering noise scores high SSIM", noisyResult.meanSsim > 0.9, `meanSsim=${noisyResult.meanSsim.toFixed(4)}`);

  // 3. A genuine changed block (contrasting color, 30x30 = 900px^2) -> should be caught by
  // *region* detection. Whole-page mean SSIM alone is the wrong gate here: a small localized
  // change is diluted by every unchanged pixel around it (900/14400 ≈ 6% of this image), so mean
  // SSIM barely moves even for a stark color swap — the same dilution a real, much larger
  // full-page screenshot would apply even harder to a single changed button or line of text. This
  // is exactly why the engine gates on detected regions, not mean SSIM alone.
  check("mild rendering noise produces no false-positive regions", noisyResult.changedRegions.length === 0, `regions=${noisyResult.changedRegions.length}`);
  const changed = withChangedBlock(base, 220, 40, 40);
  const changedResult = await computeSsim(base, changed);
  check("genuine content change is detected as a region", changedResult.changedRegions.length >= 1, `regions=${changedResult.changedRegions.length}`);
  if (changedResult.changedRegions.length >= 1) {
    const r = changedResult.changedRegions[0];
    const overlapsExpectedArea = r.x < 70 && r.x + r.width > 40 && r.y < 70 && r.y + r.height > 40;
    check("detected region roughly overlaps the actual changed block (40,40)-(70,70)", overlapsExpectedArea, `region=(${r.x},${r.y},${r.width}x${r.height})`);
  }

  if (failures > 0) {
    console.error(`\n${failures} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

main().catch((err) => {
  console.error("Verification script crashed:", err);
  process.exit(1);
});
