import Argument from '/lib/argument.js';
import "/lib/date.js";

export default class Charts
{
    /**
     * Renders a line chart.
     * 
     * @param {HTMLElement} container - Container to render the chart in.
     * @param {number} height - Chart height. Width will be 100% of the container.
     * @param {number} yMin - Minimum visible value on the y-axis.
     * @param {number} yMax - Maximum visible value on the y-axis.
     * @param {number} xWidthInDataPoints - Width of x-axis in data points (how many data points will the x-axis be able to fit).
     * @param {number} goal - An optional value to draw a horizontal "goal" line.
     * @param {function(number): string} valueFormatter - A function that formats value for display.
     * @param {{ date: Date, value: number }} data - Data points to render.
     */
    static renderLineChart(
        container,
        height,
        yMin,
        yMax,
        xWidthInDataPoints,
        goal,
        valueFormatter,
        data)
    {
        Argument.notNullOrUndefined(container, "container");
        Argument.isNumber(height, "height");
        Argument.min(height, 0, "height");
        Argument.isNumber(yMin, "yMin");
        Argument.min(yMin, 0, "yMin");
        Argument.isNumber(yMax, "yMax");
        Argument.min(yMax, 0, "yMax");
        Argument.isNumber(xWidthInDataPoints, "xWidthInDataPoints");
        Argument.min(xWidthInDataPoints, 0, "xWidthInDataPoints");
        Argument.notNullOrUndefined(valueFormatter, "valueFormatter");
        Argument.notNullOrUndefined(data, "data");

        if (yMin > yMax)
        {
            throw new Error(`Argument yMin is expected to be smaller or equal to yMax.`);
        }

        const chart = LightweightCharts.createChart(
            container,
            {
                width: container.clientWidth,
                height: height,
                priceScale: {
                    autoScale: false,
                    borderVisible: false,
                    scaleMargins: {
                        top: 0,
                        bottom: 0,
                    },
                },
                leftPriceScale: {
                    visible: false,
                },
                crosshair: {
                    vertLine: {
                        visible: false,
                        labelVisible: false,
                    },
                    horzLine: {
                        visible: false,
                        labelVisible: false,
                    },
                },
                grid: {
                    vertLines: {
                        visible: false,
                    },
                    horzLines: {
                        visible: false,
                    },
                },
                handleScroll: false,
                handleScale: false,
                timeScale: {
                    borderVisible: false,
                    fixLeftEdge: true,
                }
            });
        
        const series = chart.addLineSeries({
            priceLineVisible: false,
            lastValueVisible: false,
            autoscaleInfoProvider: () => ({
                priceRange: {
                    minValue: yMin,
                    maxValue: yMax,
                },
                margins: {
                    above: 10,
                    below: 0,
                },
            }),
            priceFormat: {
                type: 'custom',
                formatter: price => price + '      ',   // padding is needed to make y-axis labels visible, otherwise they are cut off
            },
            lineWidth: 1,
            color: '#151b26',
        });

        if (goal !== null)
        {
            series.createPriceLine({
                price: goal,
                color: 'gray',
                lineWidth: 1,
                lineStyle: LightweightCharts.LineStyle.SparseDotted,
                axisLabelVisible: false,
            });
        }
        
        series.setData(
            data.map(entry => ({
                time: Charts.#serializeDateForChart(entry.date),
                value: entry.value,
            }))
        );

        chart.timeScale().setVisibleLogicalRange({from: 0, to: xWidthInDataPoints});

        new ResizeObserver(
            entries =>
            {
                chart.applyOptions({
                    width: entries[0].contentRect.width,
                    height: height,
                })
            }).observe(container);
        
        Charts.#addTooltip(chart, container, 50, 40, valueFormatter);
    }

    static #addTooltip(chart, chartContainer, width, height, valueFormatter)
    {
        const tooltipWidth = width;
        const tooltipHeight = height;

        chartContainer.style.position = "relative";

        const tooltip = chartContainer.ownerDocument.createElement("div");
        Object.assign(tooltip.style, {
            display: "none",
            position: "absolute",
            minWidth: tooltipWidth + "px",
            minHeight: tooltipHeight + "px",
            zIndex: 1000,
            pointerEvents: "none",
            boxSizing: "border-box",
            borderRadius: "2px",
            padding: "4px",
            border: "1px solid gray",
            backgroundColor: "white",
        });
        chartContainer.appendChild(tooltip);

        chart.subscribeCrosshairMove(e =>
        {
            const chartOptions = chart.options();
            const chartWidth = chartOptions.width;
            const chartHeight = chartOptions.height;

            if (!e.time ||
                e.point.x < 0 || e.point.x > chartWidth ||
                e.point.y < 0 || e.point.y > chartHeight)
            {
                tooltip.style.display = "none";
                return;
            }

            const date = LightweightCharts.isBusinessDay(e.time)
                ? new Date(e.time.year, e.time.month - 1, e.time.day)
                : new Date(e.time * 1000);
            const value = valueFormatter(e.seriesPrices.values().next().value);

            tooltip.innerHTML = `
                <div style='margin: 1px 0px;'>
                    ${value}
                </div>
                <div style='font-size: smaller;'>
                    ${date.toWordyDateString()}
                </div>
            `;

            const margin = 15;
            const x = e.point.x + margin + tooltipWidth <= chartWidth
                ? e.point.x + margin
                : e.point.x - margin - tooltipWidth;
            const y = e.point.y + margin + tooltipHeight <= chartHeight
                ? e.point.y + margin
                : e.point.y - margin - tooltipHeight;

            tooltip.style.left = x + "px";
            tooltip.style.top = y + "px";
            tooltip.style.display = "block";
        });
    }

    static #serializeDateForChart(date)
    {
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
    
        return `${year}-${month}-${day}`;
    }
}