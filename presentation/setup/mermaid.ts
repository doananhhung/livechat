import { defineMermaidSetup } from "@slidev/types";

export default defineMermaidSetup(() => {
  return {
    theme: "default",
    flowchart: {
      defaultRenderer: "elk",
      useMaxWidth: false,
    },
    // You can also add ELK-specific options
    elk: {
      // ELK layout options can go here
      nodePlacementStrategy: "NETWORK_SIMPLEX",
    },
  };
});
