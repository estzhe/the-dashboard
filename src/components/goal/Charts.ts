import Argument from 'app/lib/Argument.js';
import { Temporal } from '@js-temporal/polyfill';
import vegaEmbed from 'vega-embed';

export default class Charts
{
    /**
     * Renders a line chart.
     * 
     * @param {HTMLElement} container - Container to render the chart in.
     * @param {number} width - Chart width.
     * @param {number} height - Chart height.
     * @param {number} yMin - Minimum visible value on the y-axis.
     * @param {number} yMax - Maximum visible value on the y-axis.
     * @param {number} goal - An optional value to draw a horizontal "goal" line.
     * @param {string} valueTitle - What value means.
     * @param {string} valueFormat - Format to apply when displaying values.
     * @param {{ date: Temporal.PlainDate, value: number }[]} data - Data points to render.
     */
    static renderLineChart(
        container: HTMLElement,
        width: number,
        height: number,
        yMin: number,
        yMax: number,
        goal: number|undefined,
        valueTitle: string,
        valueFormat: string,
        data: { date: Temporal.PlainDate, value: number|null|undefined }[])
    {
        Argument.notNullOrUndefined(container, "container");
        Argument.isNumber(width, "width");
        Argument.min(width, 0, "width");
        Argument.isNumber(height, "height");
        Argument.min(height, 0, "height");
        Argument.isNumber(yMin, "yMin");
        Argument.min(yMin, 0, "yMin");
        Argument.isNumber(yMax, "yMax");
        Argument.min(yMax, 0, "yMax");
        Argument.notNullOrUndefinedOrEmpty(valueTitle, "valueTitle");
        Argument.notNullOrUndefinedOrEmpty(valueFormat, "valueFormat");
        Argument.notNullOrUndefined(data, "data");

        if (yMin > yMax)
        {
            throw new Error(`Argument yMin is expected to be smaller or equal to yMax.`);
        }

        const spec: any = {
            $schema: "https://vega.github.io/schema/vega-lite/v6.json",
            width: width,
            height: height,
            config: {
                view: {
                    stroke: null,
                },
            },
            data: {
                values: data,
            },
            resolve: {
                axis: {
                    // We use two layers, each with its own x-axis spec.
                    // Vega merges x-axis specs into single by default, which we don't want.
                    x: "independent",
                },
            },
            layer: [
                // Layer 1: the line and day labels.
                {
                    mark: {
                        type: "line",
                    },
                    encoding: {
                        x: {
                            field: "date",
                            timeUnit: "yearmonthdate",
                            axis: {
                                grid: false,
                                title: null,
                                labelExpr: "[timeFormat(datum.value, '%e')]",
                                tickCount: "day",
                            },
                        },
                        y: {
                            field: "value",
                            type: "quantitative",
                            axis: {
                                grid: false,
                                title: null,
                            },
                            scale: {
                                domainMin: yMin,
                                domainMax: yMax,
                            },
                        },
                        tooltip: [
                            {
                                field: "date",
                                type: "temporal",
                                title: "Date",
                            },
                            {
                                field: "value",
                                type: "quantitative",
                                title: valueTitle,
                                formatType: "number",
                                format: valueFormat,
                            }
                        ],
                    },
                },
                // Layer 2: invisible marks + month axis that always shows month names.
                {
                    mark: {
                        type: "point",
                        opacity: 0,
                    },
                    encoding: {
                        x: {
                            field: "date",
                            timeUnit: "yearmonthdate",
                            axis: {
                                orient: "bottom",
                                grid: false,
                                title: null,
                                labelExpr: "timeFormat(datum.value, '%b')",
                                tickCount: "month", // force month ticks independent of the dense day ticks
                                offset: 18, // make it look like a second row of labels
                                tickSize: 0,
                                domain: false,
                            },
                        },
                        // must have a y for the point mark; reuse y so scales stay compatible
                        y: {
                            field: "value",
                            type: "quantitative",
                        },
                    }
                }
            ],
        };

        if (goal !== undefined)
        {
            if (!spec.transform) {
                spec.transform = [];
            }
            spec.transform.push({
                calculate: goal.toString(),
                as: "goal",
            });
            
            spec.layer.push({
                mark: {
                    type: "rule",
                    strokeDash: [8, 8],
                },
                encoding: {
                    y: {
                        field: "goal",
                        type: "quantitative",
                    },
                },
            });
        }

        vegaEmbed(container, spec, { actions: false, ast: true });
    }
}