import assert from "node:assert/strict"
import test from "node:test"
import { compiled, probe, lines } from "./test-support.mjs"

test("explicit interleaving loses an update; one shared monitor preserves both workers", (t) => {
  const f = compiled(t, ["ThreadLesson"])
  for (let run = 0; run < 2; run++)
    assert.deepEqual(lines(f, "ThreadLesson"), ["lost=1", "locked=2000", "workersStopped=true"])
})

test("counter preserves each increment and interrupted latch wait is observable", (t) => {
  const f = compiled(t, ["ThreadLesson"])
  const r = probe(f, "CounterProbe", `import java.util.concurrent.CountDownLatch;
public class CounterProbe {
  public static void main(String[] args) throws Exception {
    ThreadLesson.Counter counter = new ThreadLesson.Counter();
    if (counter.value() != 0) throw new AssertionError();
    for (int i = 1; i <= 3; i++) { counter.increment(); if (counter.value() != i) throw new AssertionError(); }
    Thread.currentThread().interrupt();
    try { ThreadLesson.await(new CountDownLatch(1)); throw new AssertionError(); }
    catch (InterruptedException expected) { if (Thread.currentThread().isInterrupted()) throw new AssertionError(); }
    System.out.println("counter and interruption verified");
  }
}`)
  assert.equal(r.status, 0, r.stderr)
  assert.deepEqual(lines(f, "CounterProbe"), ["counter and interruption verified"])
})

test("future timeout leaves task running; cooperative cancellation and pool termination are distinct", (t) => {
  const f = compiled(t, ["TaskLesson"])
  assert.deepEqual(lines(f, "TaskLesson"), [
    "result=6", "cause=IllegalArgumentException", "doneAfterTimeout=false",
    "cancelAccepted=true", "cancelled=true", "workerInterrupted=true", "poolTerminated=true",
  ])
})

test("both sum implementations cover empty, mixed signs and overflow beyond int", (t) => {
  const f = compiled(t, ["MeasurementLesson"])
  const r = probe(f, "SumProbe", `public class SumProbe {
  public static void main(String[] args) {
    int[][] inputs = { {}, {2, -1, 3}, {Integer.MAX_VALUE, Integer.MAX_VALUE} };
    long[] expected = {0L, 4L, 4294967294L};
    for (int i = 0; i < inputs.length; i++)
      if (MeasurementLesson.sumLoop(inputs[i]) != expected[i] || MeasurementLesson.sumStream(inputs[i]) != expected[i])
        throw new AssertionError("sum mismatch");
    System.out.println("sum edges verified");
  }
}`)
  assert.equal(r.status, 0, r.stderr)
  assert.deepEqual(lines(f, "SumProbe"), ["sum edges verified"])
})

test("measurement rejects wrong checksum and meaningless round count", (t) => {
  const f = compiled(t, ["MeasurementLesson"])
  const r = probe(f, "SampleProbe", `public class SampleProbe {
  public static void main(String[] args) {
    try { MeasurementLesson.sample(new int[] {1}, false, 1, 2L); throw new IllegalStateException("missed mismatch"); }
    catch (AssertionError expected) { if (!expected.getMessage().equals("checksum mismatch")) throw expected; }
    try { MeasurementLesson.sample(new int[] {1}, true, 0, 0L); throw new AssertionError(); }
    catch (IllegalArgumentException expected) { }
    System.out.println("invalid measurement rejected");
  }
}`)
  assert.equal(r.status, 0, r.stderr)
  assert.deepEqual(lines(f, "SampleProbe"), ["invalid measurement rejected"])
})

test("measurement emits environment and five samples without speed thresholds", (t) => {
  const f = compiled(t, ["MeasurementLesson"])
  const output = lines(f, "MeasurementLesson")
  assert.equal(output.length, 10)
  assert.match(output[0], /^java=21\.0\.11/)
  assert.match(output[1], /^vm=.+/)
  assert.match(output[2], /^arch=.+/)
  assert.equal(output[3], "n=1000 rounds=200 warmups=20 samples=5 checksum=100100000")
  output.slice(4, 9).forEach((row, index) =>
    assert.match(row, new RegExp(`^sample=${index + 1} loopNs=\\d+ streamNs=\\d+$`)),
  )
  assert.equal(output[9], "consumed=100100000")
})
