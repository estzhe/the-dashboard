import SingleDayValue from "app/lib/daily-store/SingleDayValue.js";

export default interface SingleDayValueView<TValue> extends SingleDayValue<TValue>
{
    isLastTrackedEntry?: boolean;
}