import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, MapPin, CreditCard, Calendar, Shield, User, ArrowLeft, Receipt, CheckCircle, Clock } from 'lucide-react';
import { PageHeader, Card, Avatar, Badge, StatusBadge, Tabs } from '../../components/ui';
import { getMonitoredCustomers, getMonitoredLoans, getMonitoredCollections, type MonitoredCustomer, type MonitoredLoan, type MonitoredCollection } from '../../services/monitoringDataService';

export const CustomerProfilePage: React.FC = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const customer = useMemo(() => {
    if (!customerId) return null;
    const monitored = getMonitoredCustomers(null).find((c) => c.id === customerId);
    if (monitored) return monitored;

    // Search local clients cache or customer storage
    const storageKeys = ['glf_clients_cache', 'glf_monitored_customers_master', 'customers'];
    for (const key of storageKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const match = list.find((c: any) => c.id === customerId || c.clientId === customerId);
            if (match) {
              const mapped: MonitoredCustomer = {
                id: match.id || match.clientId || customerId,
                name: match.name || match.fullName || 'Unnamed Customer',
                phone: match.phone || match.mobile || '',
                branchId: match.branchId || '',
                branchName: match.branchName || '',
                centerName: match.centerName || match.center || '',
                groupName: match.groupName || match.group || '',
                groupId: match.groupId,
                address: match.address || '',
                city: match.city || '',
                state: match.state || '',
                pincode: match.pincode || '',
                aadhaarNumber: match.aadhaarNumber || match.kyc?.aadhaarNumber || '',
                aadhaarFrontAvailable: Boolean(match.aadhaarFrontUrl || match.kyc?.aadhaarFrontUrl),
                aadhaarFrontUrl: match.aadhaarFrontUrl || match.kyc?.aadhaarFrontUrl,
                aadhaarBackAvailable: Boolean(match.aadhaarBackUrl || match.kyc?.aadhaarBackUrl),
                aadhaarBackUrl: match.aadhaarBackUrl || match.kyc?.aadhaarBackUrl,
                panNumber: match.panNumber || match.kyc?.panNumber || '',
                voterId: match.voterId || match.kyc?.voterIdNumber || '',
                customerPhotoAvailable: Boolean(match.photoUrl || match.photo),
                customerPhotoUrl: match.photoUrl || match.photo,
                nomineePhotoAvailable: false,
                nomineeName: match.nomineeName || match.nominee?.name || '',
                nomineeRelation: match.nomineeRelation || match.nominee?.relation || '',
                nomineePhone: match.nomineePhone || match.nominee?.phone || '',
                kycStatus: match.kycStatus === 'Verified' ? 'Verified' : 'Pending',
                status: match.status === 'active' || match.status === 'Active' ? 'Active' : 'Inactive',
                registrationDate: match.registrationDate || (match.createdAt ? new Date(match.createdAt).toLocaleDateString('en-GB') : ''),
                activeLoanId: match.activeLoanId,
                activeLoanAmount: match.activeLoanAmount,
                outstandingBalance: match.outstandingBalance || 0,
                history: match.history || (match.createdAt ? [{ date: new Date(match.createdAt).toLocaleDateString('en-GB'), event: 'Customer Enrolled', remarks: 'Registered in database' }] : []),
              };
              return mapped;
            }
          }
        }
      } catch (e) {
        // Continue search
      }
    }

    return null;
  }, [customerId]);

  const customerLoans = useMemo(() => {
    if (!customer) return [];
    return getMonitoredLoans(null).filter(
      (l) => l.customerId === customer.id || (customer.name && l.customerName?.toLowerCase() === customer.name.toLowerCase())
    );
  }, [customer]);

  const customerCollections = useMemo(() => {
    if (!customer) return [];
    return getMonitoredCollections(null, 'all').filter(
      (c) => c.customerId === customer.id || (customer.name && c.customerName?.toLowerCase() === customer.name.toLowerCase())
    );
  }, [customer]);

  if (!customer) {
    return (
      <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
        <PageHeader
          title="Customer Profile"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Customers', href: '/customers' },
            { label: customerId || 'Not Found' },
          ]}
        />
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-xs">
          <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h2 className="text-base font-bold text-[#0B1F3A]">Customer Record Not Found</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            The requested customer profile ({customerId}) does not exist or has not been synced to the current branch view.
          </p>
          <button
            onClick={() => navigate('/customers')}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0B1F3A] hover:bg-[#15335D] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            Return to Customer Directory
          </button>
        </div>
      </div>
    );
  }

  const activeLoansCount = customerLoans.filter((l) => l.status === 'Active').length;
  const outstandingBal = customerLoans.reduce((sum, l) => sum + (l.outstandingAmount || 0), 0) || (customer.outstandingBalance || 0);
  const totalPaid = customerLoans.reduce((sum, l) => sum + (l.paidAmount || 0), 0);

  const customerLocation = [customer.address, customer.city, customer.state].filter(Boolean).join(', ') || 'Address not registered';
  const customerRegDate = customer.registrationDate || 'Not specified';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 max-w-7xl">
      <PageHeader
        title="Customer Profile"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Customers', href: '/customers' },
          { label: customer.name },
        ]}
      />

      {/* Profile Header */}
      <Card padding="lg" className="border border-gray-200 shadow-xs">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <Avatar name={customer.name} size="xl" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-xl font-display font-bold text-rich-black">{customer.name}</h2>
              <StatusBadge status={customer.status === 'Active' ? 'active' : 'inactive'} />
              <StatusBadge status={customer.kycStatus === 'Verified' ? 'verified' : 'pending'} />
            </div>
            <p className="text-xs text-rich-silver font-mono mb-3">Customer ID: {customer.id}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-xs text-rich-gray">
                <Phone size={14} className="text-[#D4AF37] shrink-0" />
                <span>{customer.phone || 'No phone registered'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-rich-gray">
                <MapPin size={14} className="text-[#D4AF37] shrink-0" />
                <span className="truncate">{customerLocation}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-rich-gray">
                <Calendar size={14} className="text-[#D4AF37] shrink-0" />
                <span>Enrolled: {customerRegDate}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
            <div>
              <p className="text-xl font-display font-bold text-[#D4AF37]">{activeLoansCount}</p>
              <p className="text-[11px] text-rich-silver">Active Loans</p>
            </div>
            <div>
              <p className="text-xl font-display font-bold text-rich-black">₹{outstandingBal.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-rich-silver">Outstanding</p>
            </div>
            <div>
              <p className="text-xl font-display font-bold text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-rich-silver">Total Paid</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'kyc',
            label: 'KYC Details',
            icon: <Shield size={16} />,
            content: (
              <Card padding="md" className="border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-rich-silver uppercase tracking-wide mb-1">Aadhaar Number</p>
                    <p className="text-sm font-medium text-rich-black font-mono">
                      {customer.aadhaarNumber || 'Not provided'}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Front Proof: {customer.aadhaarFrontAvailable ? 'Uploaded ✓' : 'Pending'} • Back Proof: {customer.aadhaarBackAvailable ? 'Uploaded ✓' : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-rich-silver uppercase tracking-wide mb-1">PAN Number</p>
                    <p className="text-sm font-medium text-rich-black font-mono">
                      {customer.panNumber || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-rich-silver uppercase tracking-wide mb-1">Voter ID</p>
                    <p className="text-sm font-medium text-rich-black font-mono">
                      {customer.voterId || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-rich-silver uppercase tracking-wide mb-1">Nominee Details</p>
                    <p className="text-sm font-medium text-rich-black">
                      {customer.nomineeName ? `${customer.nomineeName} (${customer.nomineeRelation || 'Nominee'})` : 'No nominee registered'}
                    </p>
                    {customer.nomineePhone && (
                      <span className="text-[11px] text-gray-500 font-mono block mt-0.5">{customer.nomineePhone}</span>
                    )}
                  </div>
                </div>
              </Card>
            ),
          },
          {
            id: 'loans',
            label: 'Loans',
            icon: <CreditCard size={16} />,
            badge: customerLoans.length,
            content: (
              <Card padding="md" className="border border-gray-200">
                {customerLoans.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    <CreditCard className="w-8 h-8 mx-auto text-gray-300 mb-2 opacity-60" />
                    No loan accounts registered for this customer.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {customerLoans.map((l) => (
                      <div key={l.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#0B1F3A] text-sm">{l.planName}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            ID: {l.id} • Sanctioned: ₹{l.principalAmount.toLocaleString('en-IN')} • Tenure: {l.tenorWeeks} Wks
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <div className="text-xs text-gray-600">
                            Outstanding: <span className="font-bold text-[#0B1F3A]">₹{l.outstandingAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${
                            l.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {l.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ),
          },
          {
            id: 'collections',
            label: 'Collection History',
            icon: <Receipt size={16} />,
            badge: customerCollections.length,
            content: (
              <Card padding="md" className="border border-gray-200">
                {customerCollections.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    <Receipt className="w-8 h-8 mx-auto text-gray-300 mb-2 opacity-60" />
                    No collection receipts or payments recorded for this customer.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                          <th className="pb-2">Receipt ID</th>
                          <th className="pb-2">Loan Reference</th>
                          <th className="pb-2 text-right">Collected Amount</th>
                          <th className="pb-2">Agent</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {customerCollections.map((col) => (
                          <tr key={col.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 font-mono text-[#0B1F3A] font-bold">{col.id}</td>
                            <td className="py-2.5 font-mono text-gray-600">{col.loanId}</td>
                            <td className="py-2.5 text-right font-bold text-emerald-600">
                              ₹{col.collectedAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 text-gray-600">{col.agentName || 'Officer'}</td>
                            <td className="py-2.5 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Paid
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ),
          },
          {
            id: 'timeline',
            label: 'Timeline',
            icon: <Clock size={16} />,
            content: (
              <Card padding="md" className="border border-gray-200">
                {(!customer.history || customer.history.length === 0) ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    <Clock className="w-8 h-8 mx-auto text-gray-300 mb-2 opacity-60" />
                    No timeline events recorded yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customer.history.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-1.5 bg-[#D4AF37]" />
                        <div>
                          <p className="text-sm font-semibold text-rich-black">{item.event}</p>
                          <p className="text-xs text-gray-500">{item.remarks}</p>
                          <p className="text-[11px] text-rich-silver mt-0.5">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />
    </motion.div>
  );
};

export default CustomerProfilePage;
