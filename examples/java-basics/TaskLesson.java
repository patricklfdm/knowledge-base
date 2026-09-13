import java.util.concurrent.CancellationException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;

public final class TaskLesson {
    private static void await(CountDownLatch latch) throws InterruptedException {
        if (!latch.await(5, TimeUnit.SECONDS)) throw new AssertionError("worker signal missing");
    }

    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch release = new CountDownLatch(1);
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch stopped = new CountDownLatch(1);
        AtomicBoolean interrupted = new AtomicBoolean();
        try {
            Future<Integer> success = pool.submit(() -> 6);
            System.out.println("result=" + success.get(5, TimeUnit.SECONDS));
            Future<Integer> failed = pool.submit(() -> { throw new IllegalArgumentException("bad trip"); });
            try {
                failed.get(5, TimeUnit.SECONDS);
                throw new AssertionError("failure missing");
            } catch (ExecutionException error) {
                if (!(error.getCause() instanceof IllegalArgumentException)) throw error;
                System.out.println("cause=" + error.getCause().getClass().getSimpleName());
            }
            Future<Integer> blocked = pool.submit(() -> {
                started.countDown();
                try {
                    release.await();
                    return 1;
                } catch (InterruptedException error) {
                    interrupted.set(true);
                    Thread.currentThread().interrupt();
                    throw error;
                } finally {
                    stopped.countDown();
                }
            });
            await(started);
            try {
                blocked.get(1, TimeUnit.MILLISECONDS);
                throw new AssertionError("timeout missing");
            } catch (TimeoutException expected) {
                System.out.println("doneAfterTimeout=" + blocked.isDone());
            }
            System.out.println("cancelAccepted=" + blocked.cancel(true));
            try {
                blocked.get();
                throw new AssertionError("cancellation missing");
            } catch (CancellationException expected) {
                System.out.println("cancelled=" + blocked.isCancelled());
            }
            await(stopped);
            System.out.println("workerInterrupted=" + interrupted.get());
        } finally {
            release.countDown();
            pool.shutdownNow();
            if (!pool.awaitTermination(5, TimeUnit.SECONDS)) throw new AssertionError("pool did not stop");
        }
        System.out.println("poolTerminated=" + pool.isTerminated());
    }
}
