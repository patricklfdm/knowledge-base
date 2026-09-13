import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CollectionLesson {
    static void addUnique(Map<String, TripModel> trips, String id, TripModel trip) {
        if (trips.containsKey(id)) throw new IllegalArgumentException("重复编号");
        trips.put(id, trip);
    }
    public static void main(String[] args) {
        List<TripModel> trips = new ArrayList<>();
        trips.add(new TripModel("山城", 3));
        trips.add(new TripModel("海湾", 2));
        int total = 0;
        for (TripModel trip : trips) total += trip.days();
        System.out.println("total=" + total);
        List<TripModel> shallow = new ArrayList<>(trips);
        List<TripModel> readonly = List.copyOf(trips);
        List<TripModel> detached = new ArrayList<>();
        for (TripModel trip : trips) detached.add(trip.copy());
        trips.get(0).setDays(7);
        trips.remove(1);
        System.out.println("sizes=" + trips.size() + "/" + shallow.size());
        System.out.println("elements=" + shallow.get(0).days() + "/" + readonly.get(0).days() + "/" + detached.get(0).days());
        try { readonly.add(new TripModel("雪原", 1)); throw new AssertionError("modifiable"); }
        catch (UnsupportedOperationException expected) { System.out.println("readonly=blocked"); }
        Map<String, TripModel> byId = new HashMap<>();
        addUnique(byId, "t1", trips.get(0));
        try { addUnique(byId, "t1", new TripModel("替换", 1)); throw new AssertionError("duplicate accepted"); }
        catch (IllegalArgumentException expected) { System.out.println("duplicate=blocked"); }
        System.out.println("found=" + byId.get("t1").name());
        System.out.println("missing=" + (byId.get("missing") == null));
        trips.removeIf(trip -> trip.days() > 5);
        System.out.println("remaining=" + trips.size());
    }
}
