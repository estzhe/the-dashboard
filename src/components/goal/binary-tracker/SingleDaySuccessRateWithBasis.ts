import SingleDayValue from "app/lib/daily-store/SingleDayValue.js";

export default interface SingleDaySuccessRateWithBasis extends SingleDayValue<number>
{
    basis: {
        successCount: number,
        daysAttempted: number,
    },
}
