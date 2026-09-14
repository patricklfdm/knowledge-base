import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { KnowledgeBaseSearchPreview } from "./quartz/plugins/transformers/kb-search-preview"

const config = await loadQuartzConfig()
config.plugins.transformers.push(KnowledgeBaseSearchPreview())
export default config
export const layout = await loadQuartzLayout()
