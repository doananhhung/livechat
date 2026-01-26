<template>
  <div
    class="slidev-layout h-full bg-slate-50 text-slate-800 font-sans relative overflow-hidden"
  >
    <ThemeBackground />
    <div
      class="relative z-10 h-full p-8 border-t-8 border-indigo-600 grid grid-rows-[auto_1fr] gap-6"
    >
      <h1
        class="text-4xl font-extrabold tracking-tight uppercase flex items-center gap-4"
      >
        <div
          class="w-2 h-12 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-sm"
        ></div>
        <span
          class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700"
        >
          <slot name="title">{{ title }}</slot>
        </span>
      </h1>
      <!-- Diagram Wrapper -->
      <div
        class="diagram-container w-full h-full flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg shadow-inner border border-white/50 p-4 overflow-hidden"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.diagram-container :deep(.mermaid) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<script setup lang="ts">
import { onMounted, onUpdated, nextTick } from "vue";
import ThemeBackground from "./ThemeBackground.vue";

defineProps<{ title?: string }>();

const fixMermaidSvg = () => {
  // Find all mermaid containers
  const mermaidDivs = document.querySelectorAll(".diagram-container .mermaid");

  mermaidDivs.forEach((el) => {
    if (el.shadowRoot) {
      const svg = el.shadowRoot.querySelector("svg");
      if (svg) {
        // Set width and height to 100% so the SVG scales based on its viewBox
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        // Remove any inline style that might override
        svg.style.maxWidth = "100%";
        svg.style.maxHeight = "100%";
      }
    }
  });
};

onMounted(() => {
  // Mermaid renders asynchronously, retry multiple times
  [100, 300, 500, 1000].forEach((delay) => setTimeout(fixMermaidSvg, delay));
});

onUpdated(() => {
  nextTick(fixMermaidSvg);
});
</script>
