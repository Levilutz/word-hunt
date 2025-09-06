import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import VanillaApp from "./VanillaApp.tsx";

// biome-ignore lint/style/noNonNullAssertion: Hardcoded in index.html
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<VanillaApp />
	</StrictMode>,
);
