import { searchPreview } from "./kb-search-preview"

// Keep the installed search component's index, ranking, keyboard handling and
// result links. This observer only replaces card descriptions with safe text.
void (async () => {
  const index = await fetchData
  let observers: MutationObserver[] = []
  const setup = () => {
    observers.forEach((observer) => observer.disconnect())
    observers = []
    document.querySelectorAll<HTMLElement>(".search-space").forEach((space) => {
      const input = space.querySelector<HTMLInputElement>("input.search-bar")
      // The installed component creates results-container asynchronously after
      // indexing. Observe its stable parent so the first search is covered too.
      const results = space.querySelector<HTMLElement>(".search-layout")
      if (!input || !results) return
      const applied = new WeakMap<HTMLElement, { query: string; text: string }>()
      const update = () => {
        results
          .querySelectorAll<HTMLAnchorElement>(".results-container a.result-card")
          .forEach((card) => {
            const description = card.querySelector<HTMLElement>("p.card-description")
            const data = index[card.id]
            if (!description || !data || typeof data.content !== "string") return
            const previous = applied.get(description)
            if (previous?.query === input.value && previous.text === description.textContent) return
            const parts = searchPreview(data.content, input.value)
            description.replaceChildren(
              ...parts.map(({ text, highlight }) => {
                if (!highlight) return document.createTextNode(text)
                const span = document.createElement("span")
                span.className = "highlight"
                span.textContent = text
                return span
              }),
            )
            applied.set(description, { query: input.value, text: description.textContent ?? "" })
          })
      }
      const observer = new MutationObserver(update)
      observer.observe(results, { childList: true, subtree: true })
      observers.push(observer)
      update()
    })
  }
  document.addEventListener("nav", setup)
  document.addEventListener("render", setup)
  setup()
})().catch((error) => console.error("KnowledgeBase search preview failed", error))
