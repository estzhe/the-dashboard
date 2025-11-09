import {Temporal} from "@js-temporal/polyfill";
import PlainDate = Temporal.PlainDate;

export default interface SingleDayValue<TValue>
{
    date: PlainDate,
    value: TValue,
}