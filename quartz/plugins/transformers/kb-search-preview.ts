import { QuartzTransformerPlugin } from "../types"
// Quartz's inline loader bundles this module and its local pure helper.
// @ts-ignore
import script from "../../components/scripts/kb-search-preview.inline"

export const KnowledgeBaseSearchPreview: QuartzTransformerPlugin = () => ({
  name: "KnowledgeBaseSearchPreview",
  externalResources: () => ({
    js: [{ script, contentType: "inline", loadTime: "afterDOMReady", spaPreserve: true }],
  }),
})
