public class DaysInput {
    public static int parse(String raw) {
        if (raw == null || !raw.matches("[0-9]+")) {
            throw new IllegalArgumentException("天数只能包含ASCII数字0–9，不能为空");
        }
        final int days;
        try {
            days = Integer.parseInt(raw);
        } catch (NumberFormatException error) {
            throw new IllegalArgumentException("天数超出int表示范围", error);
        }
        if (days < 1 || days > 30) {
            throw new IllegalArgumentException("天数必须在1–30之间");
        }
        return days;
    }

    public static void main(String[] args) {
        if (args.length != 1) {
            System.err.println("用法: DaysInput <天数>");
            System.exit(2);
            return;
        }
        try {
            int days = parse(args[0]);
            System.out.println("已验证天数: " + days);
        } catch (IllegalArgumentException error) {
            System.err.println(error.getMessage());
            System.exit(2);
        }
    }
}
