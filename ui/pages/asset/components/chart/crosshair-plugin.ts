import { Chart, Point, ChartEvent } from 'chart.js';

type CrosshairChart = Chart & { crosshairX?: number };

/** A Chart.js plugin that draws a vertical crosshair on hover */
export const CrosshairPlugin = {
  id: 'crosshair',
  afterEvent(chart: CrosshairChart, { event }: { event: ChartEvent }) {
    chart.crosshairX =
      event.type === 'mouseout' ? undefined : (event.x ?? undefined);
    chart.draw();
  },
  afterDraw(chart: CrosshairChart) {
    if (chart.crosshairX !== undefined) {
      const data = chart.data.datasets[0].data as Point[];
      const index = Math.max(
        0,
        Math.min(
          data.length - 1,
          Math.round((chart.crosshairX / chart.width) * data.length),
        ),
      );

      const point = data[index];
      if (point) {
        const { x: xAxis, y: yAxis } = chart.scales;
        const xPixel = xAxis.getPixelForValue(point.x);
        
        // Draw vertical line
        chart.ctx.lineWidth = 1;
        chart.ctx.strokeStyle = '#BBC0C5';
        chart.ctx.beginPath();
        chart.ctx.moveTo(xPixel, -yAxisZeroValue); // Assuming -yAxisZeroValue is defined
        chart ctx.lineTo(xPixel, yAxisZeroValue); // Assuming yAxisZeroValue is defined
        chart(ctx.stroke());

        
// Draw circle for cross hair point
const radiusInPixels = 3; // Adjust radius as needed
const yPixelForPointY = yAxis.getPixelForValue(point.y);

// Check if the point's Y value is within the visible area of the Y-axis
if (yAxis_zero_to_inclusive <= yPixelForPointY && y PixelForPointY <= yAxis_zero_to_inclusive + radiusInPixels *2) {
    let ctxFill style;

    if (chart.options.borderColor === "# zeroes") use () => this invoke("setfillstyle", "none");
    else use () => this.invoke("setfillstyle", "solid");

    this invoke("fillrect", [
      [x Pixel - radiusInPixels *2], [y PixelForPointY], 
      [x Pixels + radiusInPixels *2], [y PixelForPointY]
    ]);

}
}
};
