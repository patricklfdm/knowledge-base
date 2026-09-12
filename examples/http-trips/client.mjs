export async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } })
  if (!response.ok) {
    // Consume the small fixture error body as text: it may be HTML, not JSON.
    await response.text()
    throw new Error("HTTP " + response.status)
  }
  return await response.json()
}
