/**
 * Manual fixture verification for drawHighlightBox() — no test runner exists in this repo (same
 * pattern as ssim.verify.ts/grammar.verify.ts/link-checker.verify.ts elsewhere).
 *
 * Run via:
 *   pnpm --filter @tentwenty/core exec tsx src/highlight.verify.ts
 */
import { PNG } from "pngjs";
import { drawHighlightBox } from "./highlight";

const WIDTH = 200;
const HEIGHT = 150;

function solidImage(): Buffer {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 240;
    png.data[i + 1] = 240;
    png.data[i + 2] = 240;
    png.data[i + 3] = 255;
  }
  return PNG.sync.write(png);
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

function main() {
  const base = solidImage();
  const box = { x: 50, y: 40, width: 60, height: 20 };
  const highlighted = drawHighlightBox(base, box);

  const before = PNG.sync.read(base);
  const after = PNG.sync.read(highlighted);

  check("output has the same dimensions as the input", after.width === before.width && after.height === before.height, `${after.width}x${after.height}`);

  check("input buffer is not mutated", PNG.sync.write(PNG.sync.read(base)).equals(base), "base still solid gray");

  function pixelAt(png: PNG, x: number, y: number): [number, number, number, number] {
    const idx = (png.width * y + x) << 2;
    return [png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]];
  }

  // Top edge of the box (with padding) should now be highlight-red.
  const topEdge = pixelAt(after, box.x + 10, box.y - 6);
  check("a pixel on the box's top edge is highlighted red", topEdge[0] === 255 && topEdge[1] === 42 && topEdge[2] === 42, JSON.stringify(topEdge));

  // Center of the box should NOT be touched (outline only, not filled).
  const center = pixelAt(after, box.x + box.width / 2, box.y + box.height / 2);
  check("the box's interior is untouched (outline only, not filled)", center[0] === 240 && center[1] === 240 && center[2] === 240, JSON.stringify(center));

  // Far corner of the image, well away from the box, should be untouched.
  const farCorner = pixelAt(after, 5, 5);
  check("pixels far from the box are untouched", farCorner[0] === 240 && farCorner[1] === 240 && farCorner[2] === 240, JSON.stringify(farCorner));

  // A box near the image edge should clamp without throwing or wrapping.
  const edgeBox = { x: -5, y: -5, width: 20, height: 20 };
  let edgeCrashed = false;
  try {
    drawHighlightBox(base, edgeBox);
  } catch {
    edgeCrashed = true;
  }
  check("a box partially outside the image bounds is clamped, not a crash", !edgeCrashed, `crashed=${edgeCrashed}`);

  if (failures > 0) {
    console.error(`\n${failures} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

main();
