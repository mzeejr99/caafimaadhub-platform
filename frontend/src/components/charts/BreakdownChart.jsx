import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function BreakdownChart({
  labels = [],
  data = [],
  label = 'Count',
  horizontal = false,
  backgroundColor = 'rgba(13, 148, 136, 0.75)',
  borderColor = 'rgb(13, 148, 136)',
  height = 260,
  isDark = false
}) {
  const gridColor = isDark ? 'rgba(148,163,184,0.15)' : '#f1f5f9';
  const tickColor = isDark ? '#94a3b8' : '#64748b';

  const options = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: horizontal ? gridColor : 'transparent' },
        ticks: { font: { size: 11 }, color: tickColor }
      },
      y: {
        grid: { color: horizontal ? 'transparent' : gridColor },
        ticks: { font: { size: 11 }, color: tickColor }
      }
    }
  };

  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor,
        borderColor,
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
