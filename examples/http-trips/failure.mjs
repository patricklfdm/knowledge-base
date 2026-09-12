import { startFixture } from "./server.mjs"
import { getJson } from "./client.mjs"

const fixture = await startFixture()
try {
  await getJson(fixture.baseUrl + "/trips/missing")
} finally {
  await fixture.close()
}
