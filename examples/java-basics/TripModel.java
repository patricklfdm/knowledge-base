public final class TripModel {
    private final String name;
    private int days;

    public TripModel(String name, int days) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("名称不能为空");
        this.name = name;
        setDays(days);
    }
    public String name() { return name; }
    public int days() { return days; }
    public void setDays(int days) {
        if (days < 1 || days > 30) throw new IllegalArgumentException("天数必须在1–30之间");
        this.days = days;
    }
    public TripModel copy() { return new TripModel(name, days); }
}
