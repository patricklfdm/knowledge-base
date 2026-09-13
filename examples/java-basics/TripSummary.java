public class TripSummary {
    public static void main(String[] args) {
        String destination = args.length == 0 ? "山城" : args[0];
        int days = 3;
        System.out.println(destination + ": " + days + "天");
    }
}
