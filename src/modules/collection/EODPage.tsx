import React from 'react';
import { EODSettlementPanel } from './EODSettlementPanel';

export const EODPage: React.FC = () => {
  return (
    <div className="p-3 sm:p-5 lg:p-7 max-w-7xl mx-auto pb-24">
      <EODSettlementPanel />
    </div>
  );
};

export default EODPage;
