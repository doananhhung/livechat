import { version } from "../../package.json";

export const getWidgetSnippet = (projectId: number) => {
  return `<script
  id="live-chat-widget"
  src="https://app.dinhviethoang604.id.vn/dist/app/app.${version}.js"
  data-project-id="${projectId}"
  async
  defer
></script>`;
};
