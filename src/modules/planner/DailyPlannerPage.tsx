// ──────────────────────────────────────────────────
// Golden Leaf Finance — Daily Planner Page (100% Real Data)
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Navigation, CheckCircle, Clock, MapPin, Calendar } from 'lucide-react';
import { PageHeader, Card, Badge, Button, Tabs } from '../../components/ui';
import { getMonitoredCollections, type MonitoredCollection } from '../../services/monitoringDataService';
import { useAuthStore } from '../../store';

const DailyPlannerPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const userBranch = user?.customClaims?.branchId || null;
  const [todayCollections, setTodayCollections] = useState<MonitoredCollection[]>([]);

  useEffect(() => {
    const list = getMonitoredCollections(userBranch === 'all' ? null : userBranch, 'today');
    setTodayCollections(list);
  }, [userBranch]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 sm:p-5 lg:p-6 flex flex-col gap-6 font-body pb-12">
      <PageHeader
        title="Daily Collection Planner"
        subtitle="Optimized collection route for today"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Planner' }]}
      />

      <Tabs
        tabs={[
          {
            id: 'today',
            label: "Today's Route",
            badge: todayCollections.length,
            content: todayCollections.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-gray-100 shadow-xs">
                <Calendar className="mx-auto text-gray-300 mb-3" size={40} />
                <h4 className="text-base font-bold text-[#0F1F38]">No collection routes scheduled for today</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Customer collection installments for today will appear here once centers and groups are active.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayCollections.map((stop, index) => (
                  <Card key={stop.id} padding="md" hoverable className={stop.status === 'pending' ? 'ring-2 ring-gold-500' : ''}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        stop.status === 'collected' ? 'bg-status-success-light text-status-success' :
                        stop.status === 'pending' ? 'bg-gold-100 text-gold-700 animate-pulse-gold' :
                        'bg-surface-cream text-rich-silver'
                      }`}>
                        {stop.status === 'collected' ? <CheckCircle size={18} /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-rich-black">{stop.customerName}</p>
                          {stop.status === 'pending' && <Badge variant="gold" size="sm">Due Today</Badge>}
                        </div>
                        <p className="text-xs text-rich-silver flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {stop.areaRoute || stop.area || stop.branchName} • {stop.groupName || 'Direct'}
                        </p>
                        <p className="text-xs text-rich-silver">Agent: {stop.agentName} • Scheduled: {stop.date} {stop.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-rich-black font-display">₹{stop.expectedAmount.toLocaleString('en-IN')}</p>
                        {stop.status === 'pending' && <Button size="sm" className="mt-1">Collect</Button>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            id: 'tomorrow',
            label: "Tomorrow's Route",
            content: (
              <div className="text-center py-12 text-rich-silver text-sm bg-white rounded-2xl border border-gray-100">
                Tomorrow's collection plan will be dynamically populated according to the center group schedules.
              </div>
            ),
          },
        ]}
      />
    </motion.div>
  );
};

export default DailyPlannerPage;

