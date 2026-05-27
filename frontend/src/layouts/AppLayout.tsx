import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useQueryClient } from '@tanstack/react-query';
import DatasourceGate from '../components/DatasourceGate';

const AppLayout = () => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden text-textMain font-sans transition-colors duration-200">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <main className="flex-1 overflow-y-auto bg-background p-6 transition-colors duration-200">
          <DatasourceGate dashboardKey="sales">
            <Outlet />
          </DatasourceGate>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
