import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bottom-left collides with the sidebar's "Log Out" link; top-right collides with the header's
  // profile menu avatar (confirmed by an actual click getting blocked in testing). top-left only
  // overlaps the static, non-interactive sidebar brand mark — nothing clickable there.
  devIndicators: {
    position: "top-left",
  },
};

export default nextConfig;
