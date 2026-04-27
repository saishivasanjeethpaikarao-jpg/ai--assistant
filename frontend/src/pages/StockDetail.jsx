import React from 'react';
import { useParams } from 'react-router-dom';

export default function StockDetail() {
  const { symbol } = useParams();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">{symbol}</h1>
        <p className="text-gray-400">Detailed stock analysis and information</p>
      </div>
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
        <p className="text-gray-400">Coming soon...</p>
      </div>
    </div>
  );
}
