package kb.app;

import kb.trips.TripText;

public final class Main {
    public static void main(String[] args) {
        System.out.println(TripText.title(args.length == 0 ? "山城" : args[0]));
    }
}
