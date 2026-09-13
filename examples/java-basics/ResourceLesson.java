import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class ResourceLesson {
    static final class Resource implements AutoCloseable {
        private final String name;
        private final List<String> closed;
        Resource(String name, List<String> closed) { this.name = name; this.closed = closed; }
        @Override public void close() throws IOException {
            closed.add(name);
            throw new IOException("close " + name);
        }
    }
    public static void main(String[] args) {
        List<String> closed = new ArrayList<>();
        try (Resource a = new Resource("A", closed); Resource b = new Resource("B", closed)) {
            throw new IOException("body failed");
        } catch (IOException error) {
            System.out.println("primary=" + error.getMessage());
            for (Throwable suppressed : error.getSuppressed())
                System.out.println("suppressed=" + suppressed.getMessage());
        }
        System.out.println("closed=" + String.join(",", closed));
    }
}
