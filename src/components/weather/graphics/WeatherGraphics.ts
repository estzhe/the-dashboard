import Argument from 'app/lib/Argument.js';
import NumberToColorGradient from "app/components/weather/graphics/NumberToColorGradient.js";

export default class WeatherGraphics
{
    /**
     * Draws strips on the given canvas using values mapped to specified color gradient.
     * Can randomly color pixels, leaving some of them as is.
     * 
     * @param canvas - Width is recommended to be divisible by `values.length`.
     * @param values
     * @param gradient
     * @param randomnessFactor - 1 for every pixel filled, 2 for every other pixel filled on average, etc.
     */
    public static drawStrips(canvas: HTMLCanvasElement | OffscreenCanvas, values: number[], gradient: NumberToColorGradient, randomnessFactor: number)
    {
        Argument.notNullOrUndefined(canvas, "canvas");
        Argument.collectionNotEmpty(values, "values");
        Argument.notNullOrUndefined(gradient, "gradient");
        Argument.isNumber(randomnessFactor, "randomnessFactor");
        Argument.min(randomnessFactor, 1, "randomnessFactor");

        const start = {
            value: gradient.start.value,
            color: parseColor(gradient.start.color),
        };
        const end = {
            value: gradient.end.value,
            color: parseColor(gradient.end.color),
        };

        const context = canvas.getContext("2d")!;
        const imageData = context.createImageData(context.canvas.width, context.canvas.height);
        const pixels = imageData.data;
        const pixelCount = pixels.length / 4;

        const stripWidth = Math.ceil(context.canvas.width / values.length);

        for (let i = 0; i < pixelCount; i += 1 + getRandomInt(randomnessFactor))
        {
            let value = values[Math.floor(i % context.canvas.width / stripWidth)]!;

            if (start.value <= end.value)
            {
                value = value < start.value ? start.value :
                        value > end.value ? end.value :
                        value;
            }
            else
            {
                value = value < end.value ? end.value :
                        value > start.value ? start.value :
                        value;
            }

            const gradientFactor = (value - start.value) / (end.value - start.value);
            let r = start.color.r + (end.color.r - start.color.r) * gradientFactor;
            let g = start.color.g + (end.color.g - start.color.g) * gradientFactor;
            let b = start.color.b + (end.color.b - start.color.b) * gradientFactor;

            const offset = 4 * i;

            pixels[offset] = r;
            pixels[offset + 1] = g;
            pixels[offset + 2] = b;
            pixels[offset + 3] = 255;
        }

        context.putImageData(imageData, 0, 0);
    }

    /**
     * Draws upside down stacked bars on the given canvas.
     * 
     * @param canvas - Width is recommended to be divisible by `data[].values.length`.
     * @param data
     */
    public static drawUpsideDownStackedBars(
        canvas: HTMLCanvasElement | OffscreenCanvas,
        data: {
            values: number[],
            color: string,
            scale: { min: number, max: number }
        }[])
    {
        Argument.notNullOrUndefined(canvas, "canvas");
        Argument.collectionNotEmpty(data, "data");

        for (let i = 0; i < data.length; ++i)
        {
            Argument.collectionNotEmpty(data[i]!.values, `data[${i}].values`);
            Argument.notNullOrUndefinedOrEmpty(data[i]!.color, `data[${i}].color`);
            Argument.notNullOrUndefined(data[i]!.scale, `data[${i}].scale`);
            Argument.isNumber(data[i]!.scale.min, `data[${i}].scale.min`);
            Argument.isNumber(data[i]!.scale.max, `data[${i}].scale.max`);
            
            if (data[i]!.scale.min >= data[i]!.scale.max)
            {
                throw new Error("'data[].scale.min' must be smaller than 'data[].scale.max'.");
            }
            
            if (data[i]!.values.length !== data[0]!.values.length)
            {
                throw new Error("'data[].values' arrays must all have same lengths.");
            }
        }
        
        const context = canvas.getContext("2d")!;
        
        const barCount = data[0]!.values.length;
        const barWidth = Math.ceil(context.canvas.width / barCount);
        
        const stackedBarHeights = new Array(barCount).fill(0);

        for (const { values, color, scale } of data)
        {
            context.fillStyle = color;

            for (let i = 0; i < barCount; ++i)
            {
                const value = Math.min(scale.max, Math.max(scale.min, values[i]!));
                
                const x = i * barWidth;
                const y = stackedBarHeights[i];
                const width = barWidth;
                let height = context.canvas.height * (value - scale.min) / (scale.max - scale.min);
                height = Math.min(context.canvas.height - y, Math.max(0, height));

                context.fillRect(x, y, width, height);

                stackedBarHeights[i] += height;
            }
        }
    }
}

function parseColor(color: string): { r: number, g: number, b: number, a: number }
{
    const context = new OffscreenCanvas(1, 1).getContext("2d")!;
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);

    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return {
        r: r!,
        g: g!,
        b: b!,
        a: a!,
    };
}

function getRandomInt(max: number): number
{
    return Math.floor(Math.random() * max);
}