import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class FileLesson {
    static List<TripModel> load(Path file) throws IOException {
        return readAndClose(Files.newBufferedReader(file, StandardCharsets.UTF_8));
    }
    // Ownership is transferred: this method closes the supplied reader on every exit.
    static List<TripModel> readAndClose(BufferedReader owned) throws IOException {
        List<TripModel> staged = new ArrayList<>();
        try (BufferedReader reader = owned) {
            String line;
            int lineNumber = 0;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                try {
                    String[] fields = line.split("\t", -1);
                    if (fields.length != 2) throw new IllegalArgumentException("需要名称和天数两列");
                    staged.add(new TripModel(fields[0], DaysInput.parse(fields[1])));
                } catch (IllegalArgumentException error) {
                    throw new IOException("第" + lineNumber + "行无效", error);
                }
            }
        }
        return List.copyOf(staged);
    }
    public static void main(String[] args) throws IOException {
        Path dir = Files.createTempDirectory("kb-java-files-");
        Path good = dir.resolve("行程.tsv");
        Path bad = dir.resolve("坏行.tsv");
        try {
            Files.writeString(good, "山城\t3\n海湾\t2\n", StandardCharsets.UTF_8);
            Files.writeString(bad, "山城\t3\n海湾\t31\n", StandardCharsets.UTF_8);
            List<TripModel> current = load(good);
            System.out.println("read=" + current.size() + ":" + current.get(0).name());
            try { current = load(bad); throw new AssertionError("partial import accepted"); }
            catch (IOException expected) { System.out.println(expected.getMessage()); }
            System.out.println("preserved=" + current.size());
        } finally {
            Files.deleteIfExists(good);
            Files.deleteIfExists(bad);
            Files.delete(dir);
        }
        System.out.println("cleanup=true");
    }
}
