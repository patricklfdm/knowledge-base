import { openTrips } from "./store.mjs"
const store = openTrips(":memory:")
try {
  store.create("山城", 31)
} finally {
  store.close()
}
