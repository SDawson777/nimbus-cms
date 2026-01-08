import React, { useState } from 'react';
import StoreHeatmap from '../components/StoreHeatmap';
import StoreAnalyticsModal from '../components/StoreAnalyticsModal';

export default function HeatmapPage() {
  const [selectedStore, setSelectedStore] = useState(null);

  const handleStoreClick = (store) => {
    setSelectedStore(store);
  };

  const handleCloseModal = () => {
    setSelectedStore(null);
  };

  return (
    <div className="heatmap-page">
      <StoreHeatmap onStoreClick={handleStoreClick} />
      {selectedStore && (
        <StoreAnalyticsModal 
          store={selectedStore} 
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

