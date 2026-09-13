public class ProcessLesson {
    private static int counter;
    public static void main(String[] args) {
        String mode = args.length == 0 ? "count" : args[0];
        switch (mode) {
            case "count" -> System.out.println("counter=" + (++counter));
            case "heap" -> System.out.println(Runtime.getRuntime().maxMemory());
            case "oom" -> {
                byte[] block = new byte[64 * 1024 * 1024];
                System.out.println(block[0]);
            }
            default -> throw new IllegalArgumentException("unknown mode");
        }
    }
}
