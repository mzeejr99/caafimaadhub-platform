import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryPieChart({
  labels = [],
  data = [],
  colors = ['#0d9488', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  type = 'doughnut',
  height = 240,
  cutout = '65%',
  isDark = false
}) {
  const legendTextColor = isDark ? '#e2e8f0' : '#334155';
  const segmentBorderColor = isDark ? '#0f172a' : '#ffffff';

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: segmentBorderColor,
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: type === 'doughnut' ? cutout : 0,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: legendTextColor,
          boxWidth: 12,
          padding: 12,
          usePointStyle: true,
          font: { size: 11, family: "'Inter', sans-serif" }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 10,
        cornerRadius: 8
      }
    }
  };

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      {type === 'pie' ? (
        <Pie data={chartData} options={options} />
      ) : (
        <Doughnut data={chartData} options={options} />
      )}
    </div>
  );
}
