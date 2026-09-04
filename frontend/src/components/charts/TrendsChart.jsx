import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TrendsChart({
  type = 'line',
  labels = [],
  datasets = [],
  title,
  height = 260,
  showLegend = true,
  yAxisLabel = ''
}) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          font: { size: 11, family: "'Inter', sans-serif" }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: { size: 13, weight: 'bold', family: "'Inter', sans-serif" }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 } },
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          font: { size: 11 }
        }
      }
    }
  };

  const data = {
    labels,
    datasets: datasets.map((ds) => ({
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      ...ds
    }))
  };

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      {type === 'bar' ? (
        <Bar data={data} options={options} />
      ) : (
        <Line data={data} options={options} />
      )}
    </div>
  );
}
