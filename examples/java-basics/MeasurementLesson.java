import java.util.Arrays;

public final class MeasurementLesson {
    private static volatile long sink;

    static long sumLoop(int[] values) {
        long total = 0;
        for (int value : values) total += value;
        return total;
    }

    static long sumStream(int[] values) {
        return Arrays.stream(values).asLongStream().sum();
    }

    static long sample(int[] values, boolean stream, int rounds, long expected) {
        if (rounds < 1) throw new IllegalArgumentException("rounds must be positive");
        long checksum = 0;
        long start = System.nanoTime();
        for (int i = 0; i < rounds; i++) checksum += stream ? sumStream(values) : sumLoop(values);
        long elapsed = System.nanoTime() - start;
        sink = checksum;
        if (checksum != expected) throw new AssertionError("checksum mismatch");
        return elapsed;
    }

    public static void main(String[] args) {
        int[] values = new int[1000];
        for (int i = 0; i < values.length; i++) values[i] = i + 1;
        if (sumLoop(values) != 500500L || sumStream(values) != 500500L)
            throw new AssertionError("correctness before timing");
        int warmups = 20;
        int rounds = 200;
        long checksum = 100100000L;
        System.out.println("java=" + System.getProperty("java.runtime.version"));
        System.out.println("vm=" + System.getProperty("java.vm.name"));
        System.out.println("arch=" + System.getProperty("os.arch"));
        System.out.println("n=1000 rounds=200 warmups=20 samples=5 checksum=" + checksum);
        for (int i = 0; i < warmups; i++) {
            sample(values, false, rounds, checksum);
            sample(values, true, rounds, checksum);
        }
        for (int i = 0; i < 5; i++) {
            long loopNs;
            long streamNs;
            if (i % 2 == 0) {
                loopNs = sample(values, false, rounds, checksum);
                streamNs = sample(values, true, rounds, checksum);
            } else {
                streamNs = sample(values, true, rounds, checksum);
                loopNs = sample(values, false, rounds, checksum);
            }
            System.out.println("sample=" + (i + 1) + " loopNs=" + loopNs + " streamNs=" + streamNs);
        }
        System.out.println("consumed=" + sink);
    }
}
