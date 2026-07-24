import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

// Studio entry point (`npm run studio`). The browser bundle uses embed.tsx.
registerRoot(RemotionRoot);
