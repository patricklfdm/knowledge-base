export function createLoader(read, emit) {
  let generation = 0, controller
  function cancel() { generation++; controller?.abort() }
  async function load() {
    cancel()
    const mine = generation
    controller = new AbortController()
    const signal = controller.signal
    emit({ type: "loading" })
    try {
      const rows = await read(signal)
      if (mine === generation) emit({ type: "success", rows })
    } catch {
      if (mine === generation) emit({ type: "error" })
    }
  }
  return { load, cancel }
}
