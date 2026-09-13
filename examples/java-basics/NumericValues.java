public class NumericValues {
    public static void main(String[] args) {
        int days = 3;
        int extra = 2;
        boolean withinLimit = days >= 1 && days <= 30;
        System.out.println(days + extra);
        System.out.println("天数: " + days + extra);
        System.out.println("天数: " + (days + extra));
        System.out.println(5 / 2);
        System.out.println(5 / 2.0);
        System.out.println(-5 / 2);
        System.out.println(withinLimit);
        int largest = Integer.MAX_VALUE;
        long tooLate = largest + 1;
        long promoted = (long) largest + 1;
        System.out.println(tooLate);
        System.out.println(promoted);
    }
}
