import React from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Quartier } from '../data/quartiers';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export const RadarChart: React.FC<{ quartier: Quartier }> = ({ quartier }) => {
  const data = {
    labels: [
      'Sécurité',
      'Hôpital',
      'École',
      'Espaces verts',
      'Calme (inverse route)',
      'Commerces',
      'Centre-ville',
      'Mosquées',
      'Transport'
    ],
    datasets: [
      {
        label: `Scores - ${quartier.nom}`,
        data: [
          quartier.scores.securite,
          quartier.scores.hopital,
          quartier.scores.ecole,
          quartier.scores.espacesVerts,
          quartier.scores.routeNationale,
          quartier.scores.commerces,
          quartier.scores.centreville,
          quartier.scores.mosquees,
          quartier.scores.transport
        ],
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(37, 99, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(37, 99, 235, 1)',
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    },
    maintainAspectRatio: false
  };

  return <Radar data={data} options={options} />;
};
