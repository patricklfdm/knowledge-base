import java.util.Map;

public class ContractLesson {
    interface Formatter { String format(TripModel trip); }
    static final class Compact implements Formatter {
        @Override public String format(TripModel trip) { return trip.name() + ":" + trip.days(); }
    }
    static final class Sentence implements Formatter {
        @Override public String format(TripModel trip) { return trip.name() + "安排" + trip.days() + "天"; }
    }
    static final class MissingTripException extends Exception {
        MissingTripException(String id) { super("未找到行程: " + id); }
    }
    static TripModel find(Map<String, TripModel> trips, String id) throws MissingTripException {
        TripModel trip = trips.get(id);
        if (trip == null) throw new MissingTripException(id);
        return trip;
    }
    static String render(TripModel trip, Formatter formatter) { return formatter.format(trip); }
    public static void main(String[] args) {
        Map<String, TripModel> trips = Map.of("t1", new TripModel("山城", 3));
        try {
            TripModel trip = find(trips, args.length == 0 ? "t1" : args[0]);
            System.out.println(render(trip, new Compact()));
            System.out.println(render(trip, new Sentence()));
        } catch (MissingTripException error) {
            System.err.println(error.getMessage());
            System.exit(2);
        }
    }
}
