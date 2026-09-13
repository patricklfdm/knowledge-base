public class ObjectLesson {
    static void change(TripModel trip) { trip.setDays(5); }
    static void rebind(TripModel trip) { trip = new TripModel("另一程", 9); }
    public static void main(String[] args) {
        TripModel original = new TripModel("山城", 3);
        TripModel alias = original;
        TripModel copy = original.copy();
        change(alias);
        rebind(original);
        System.out.println("original=" + original.days());
        System.out.println("alias=" + alias.days());
        System.out.println("copy=" + copy.days());
        System.out.println("same=" + (original == alias));
        System.out.println("copied=" + (original == copy));
        System.out.println("text=" + original.name().equals(new String("山城")));
    }
}
