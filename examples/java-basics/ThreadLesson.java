import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

public final class ThreadLesson {
    private static volatile int unsafe;

    static final class Counter {
        private int value;
        synchronized void increment() { value = value + 1; }
        synchronized int value() { return value; }
    }

    static void await(CountDownLatch latch) throws InterruptedException {
        if (!latch.await(5, TimeUnit.SECONDS)) throw new AssertionError("worker did not arrive");
    }

    private static void finish(Thread thread) throws InterruptedException {
        thread.join(5000);
        if (thread.isAlive()) {
            thread.interrupt();
            thread.join(1000);
            throw new AssertionError("worker did not finish");
        }
    }

    public static void main(String[] args) throws InterruptedException {
        unsafe = 0;
        CountDownLatch readers = new CountDownLatch(2);
        CountDownLatch release = new CountDownLatch(1);
        AtomicReference<Throwable> failure = new AtomicReference<>();
        Runnable update = () -> {
            try {
                int old = unsafe;
                readers.countDown();
                await(release);
                unsafe = old + 1;
            } catch (Throwable error) {
                if (error instanceof InterruptedException) Thread.currentThread().interrupt();
                failure.compareAndSet(null, error);
            }
        };
        Thread a = new Thread(update, "reader-a");
        Thread b = new Thread(update, "reader-b");
        a.start();
        b.start();
        try {
            await(readers);
        } finally {
            release.countDown();
            finish(a);
            finish(b);
        }
        if (failure.get() != null) throw new AssertionError("worker failed", failure.get());
        System.out.println("lost=" + unsafe);

        Counter counter = new Counter();
        Runnable increment = () -> {
            try {
                for (int i = 0; i < 1000; i++) counter.increment();
            } catch (Throwable error) {
                failure.compareAndSet(null, error);
            }
        };
        Thread c = new Thread(increment, "counter-a");
        Thread d = new Thread(increment, "counter-b");
        c.start();
        d.start();
        finish(c);
        finish(d);
        if (failure.get() != null) throw new AssertionError("worker failed", failure.get());
        System.out.println("locked=" + counter.value());
        System.out.println("workersStopped=" + !(a.isAlive() || b.isAlive() || c.isAlive() || d.isAlive()));
    }
}
