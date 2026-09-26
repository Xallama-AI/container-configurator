import { useReducer, useRef, useState } from "react";
import Controls from "./Controls";
import Viewport, { ViewerHandle } from "./Viewport";
import {
  CameraFocus,
  CameraRequest,
  configReducer,
  DEFAULT_CONFIG,
  StudioConfig,
} from "./config";
import { isInteriorFocus } from "./camera";
import "./studio.css";

export default function Studio() {
  const [config, dispatch] = useReducer(configReducer, DEFAULT_CONFIG);
  const [request, setRequest] = useState<CameraRequest>({
    focus: "exterior",
    sequence: 0,
  });
  const viewer = useRef<ViewerHandle>(null);
  const focus = (view: CameraFocus) => {
    if (isInteriorFocus(view)) dispatch({ cargoOpen: true });
    setRequest((previous) => ({
      focus: view,
      sequence: previous.sequence + 1,
    }));
  };
  const change = (patch: Partial<StudioConfig>, view: CameraFocus) => {
    dispatch({
      ...patch,
      ...(isInteriorFocus(view) ? { cargoOpen: true } : {}),
    });
    setRequest((previous) => ({
      focus: view,
      sequence: previous.sequence + 1,
    }));
  };
  return (
    <div className="container-studio">
      <Controls
        config={config}
        onChange={change}
        onFocus={focus}
        onSave={() => {
          localStorage.setItem(
            "grid-logic-studio-design",
            JSON.stringify(config),
          );
          const blob = new Blob(
            [JSON.stringify({ version: 2, config }, null, 2)],
            { type: "application/json" },
          );
          const url = URL.createObjectURL(blob),
            link = document.createElement("a");
          link.href = url;
          link.download = "container-studio-design.json";
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      />
      <Viewport
        ref={viewer}
        config={config}
        request={request}
        onFocus={focus}
      />
    </div>
  );
}
