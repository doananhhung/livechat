import { defineMermaidSetup } from "@slidev/types";

export default defineMermaidSetup(() => {
  return {
    theme: "base",
    themeVariables: {
      // Subgraph styling
      clusterBkg: "#e0e7ff", // indigo-100 (matches your theme)
      clusterBorder: "#6366f1", // indigo-500

      // Node styling
      primaryColor: "#c7d2fe", // indigo-200
      primaryTextColor: "#1e1b4b", // indigo-950
      primaryBorderColor: "#6366f1", // indigo-500
    },
    flowchart: {
      defaultRenderer: "elk",
      useMaxWidth: false,
    },
    elk: {
      nodePlacementStrategy: "NETWORK_SIMPLEX",
    },
  };
});

