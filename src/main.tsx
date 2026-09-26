import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const Page = lazy(() => import("./studio/Studio"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense
      fallback={
        <div
          style={{
            height: "100dvh",
            display: "grid",
            placeItems: "center",
            background: "#fff",
            color: "#171a18",
          }}
        >
          Loading workspace…
        </div>
      }
    >
      <Page />
    </Suspense>
  </StrictMode>,
);
