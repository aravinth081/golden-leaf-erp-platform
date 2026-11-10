import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RotateCcw, Eye, EyeOff, UserCog, Filter, Lock, Unlock, Trash2, CheckCircle, X } from 'lucide-react';
import { DataTable, Badge, Avatar, SearchInput } from '../../components/ui';
import type { Column } from '../../components/ui';
import { ROLE_LABELS } from '../../types';
import type { Employee } from '../../types';
import { getEmployees, createEmployee, updateEmployeeStatus, hardDeleteEmployee, restoreEmployee } from '../../services/employeeService';
import { useAuthStore, useUIStore } from '../../store';

const ResetPasswordPage: React.FC = () => {
  const [formData, setFormData] = useState({
    employeeName: '',
    username: '',
    newPassword: '',
    retypePassword: '',
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [lastDeletedEmployee, setLastDeletedEmployee] = useState<Employee | null>(null);

  // Table State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useUIStore();
  const user = useAuthStore(s => s.user);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load employees.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Ctrl+Z to undo delete
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (lastDeletedEmployee) {
          e.preventDefault();
          try {
            await restoreEmployee(lastDeletedEmployee);
            addToast({ type: 'success', title: 'Restored', message: 'Employee account successfully restored!' });
            setLastDeletedEmployee(null);
            fetchEmployees();
          } catch (error) {
            console.error("Failed to restore", error);
            addToast({ type: 'error', title: 'Error', message: 'Could not restore employee.' });
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastDeletedEmployee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      employeeName: '',
      username: '',
      newPassword: '',
      retypePassword: '',
    });
  };

  const handleSave = async () => {
    if (!formData.username || !formData.newPassword || !formData.employeeName) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Please fill out employee name, username and new password.' });
      return;
    }

    if (formData.newPassword !== formData.retypePassword) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Passwords do not match!' });
      return;
    }

    try {
      const newUid = crypto.randomUUID();
      const email = `${formData.username}@goldenleaf.finance`;

      await createEmployee(newUid, {
        name: formData.employeeName,
        email: email,
        phone: '', // Optional for this form
        role: 'collection_agent', // Default
        branchId: '1', // Default
        password: formData.newPassword,
      }, user?.customClaims?.companyId || 'default');

      addToast({ type: 'success', title: 'Success', message: 'Employee account created successfully.' });
      handleReset();
      fetchEmployees();
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Firebase Error:", error);
      addToast({ 
        type: 'error', 
        title: 'Error', 
        message: error.message || 'Could not create account.' 
      });
    }
  };

  const handleToggleHold = async (emp: Employee) => {
    try {
      const newStatus = emp.status === 'suspended' ? 'active' : 'suspended';
      await updateEmployeeStatus(emp.id, newStatus);
      addToast({ type: 'success', title: 'Success', message: `Employee account ${newStatus === 'suspended' ? 'put on hold' : 'activated'}.` });
      fetchEmployees();
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', title: 'Error', message: 'Could not update status.' });
    }
  };

  const handleDeleteClick = (id: string) => {
    setEmployeeToDelete(id);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    const emp = employees.find(e => e.id === employeeToDelete);
    if (emp) setLastDeletedEmployee(emp);
    
    try {
      await hardDeleteEmployee(employeeToDelete);
      addToast({ type: 'success', title: 'Deleted', message: 'Account deleted. Press Ctrl+Z to undo.' });
      fetchEmployees();
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', title: 'Error', message: 'Could not delete employee.' });
    } finally {
      setEmployeeToDelete(null);
    }
  };

  const columns: Column<Employee>[] = [
    {
      key: 'name', header: 'Employee', sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar name={item.name} size="sm" />
          <div>
            <p className="font-medium text-rich-black text-sm">{item.name}</p>
            <p className="text-xs text-rich-silver">{item.email.split('@')[0]}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status', header: 'Account Status',
      render: (item) => {
        if (item.status === 'suspended') return <Badge variant="error">On Hold</Badge>;
        return <Badge variant="success">Active</Badge>;
      },
    },
    {
      key: 'lastLoginAt', header: 'Presence',
      render: (item) => {
        const isLive = item.lastLoginAt && (new Date().getTime() - new Date(item.lastLoginAt).getTime() < 15 * 60 * 1000);
        return (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span className="text-xs font-medium text-gray-600">{isLive ? 'Live' : 'Offline'}</span>
          </div>
        );
      }
    },
    {
      key: 'createdAt', header: 'Date Created',
      render: (item) => (
        <span className="text-sm text-gray-600">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      key: 'actions', header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleToggleHold(item); }}
            className={`p-2 rounded-lg transition-all duration-200 border shadow-sm hover:shadow-md ${item.status === 'suspended' ? 'bg-[#FFF5F5] text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300' : 'bg-[#F0FDF4] text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300'}`}
            title={item.status === 'suspended' ? "Account is Locked - Click to Unhold" : "Account is Open - Click to Hold"}
          >
            {item.status === 'suspended' ? <Lock size={16} strokeWidth={2.5} /> : <Unlock size={16} strokeWidth={2.5} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleDeleteClick(item.id); }}
            className="p-2 bg-[#FFFFFF] text-gray-400 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all duration-200 shadow-sm hover:shadow-md"
            title="Permanently Delete Account"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        </div>
      )
    }
  ];

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-3 sm:p-5 lg:p-6 flex flex-col gap-6 font-body max-w-full pb-10"
    >
      {/* Creation Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden flex-shrink-0"
      >
        <div className="bg-[#0B1F3A] px-4 sm:px-6 lg:px-8 py-4 border-b border-[#E5E7EB]/10 flex items-center gap-3">
          <div className="w-1 h-4 bg-[#D4AF37] rounded-full"></div>
          <h2 className="text-sm font-body font-semibold text-[#FFFFFF] tracking-wide">
            Account Credentials
          </h2>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-[0.85rem] font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">Employee Name</label>
              <input type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} placeholder="Enter employee name..." className="w-full px-4 py-3 sm:py-3.5 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] placeholder:text-[#9CA3AF] font-body text-sm transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/50 shadow-sm min-h-[44px]" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[0.85rem] font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Enter username..." className="w-full px-4 py-3 sm:py-3.5 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] placeholder:text-[#9CA3AF] font-body text-sm transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/50 shadow-sm min-h-[44px]" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[0.85rem] font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">New Password</label>
              <div className="relative">
                <input type={showNewPassword ? "text" : "password"} name="newPassword" value={formData.newPassword} onChange={handleChange} placeholder="Enter new password..." className="w-full px-4 py-3 sm:py-3.5 pr-12 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] placeholder:text-[#9CA3AF] font-body text-sm transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/50 shadow-sm min-h-[44px]" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#0B1F3A] transition-colors p-2 min-h-[36px] min-w-[36px] flex items-center justify-center">{showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[0.85rem] font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">Retype Password</label>
              <div className="relative">
                <input type={showRetypePassword ? "text" : "password"} name="retypePassword" value={formData.retypePassword} onChange={handleChange} placeholder="Retype password..." className="w-full px-4 py-3 sm:py-3.5 pr-12 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] placeholder:text-[#9CA3AF] font-body text-sm transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/50 shadow-sm min-h-[44px]" />
                <button type="button" onClick={() => setShowRetypePassword(!showRetypePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#0B1F3A] transition-colors p-2 min-h-[36px] min-w-[36px] flex items-center justify-center">{showRetypePassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-5 sm:mt-8 sm:pt-6 border-t border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave} className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-[10px] bg-[#0B1F3A] text-[#FFFFFF] font-semibold text-sm transition-all duration-200 hover:bg-[#1E50A0] font-body min-h-[44px] shadow-sm hover:shadow-md">
                <Save size={18} />
                Save Account
              </motion.button>
              <motion.button whileTap={{ scale: 0.98 }} onClick={handleReset} className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-[10px] bg-[#EF4444] text-[#FFFFFF] font-semibold text-sm transition-all duration-200 hover:bg-[#DC2626] font-body min-h-[44px] shadow-sm hover:shadow-md">
                <RotateCcw size={18} />
                Reset
              </motion.button>
            </div>
            
            <div className="text-xs text-red-600 font-bold font-body leading-relaxed">
              *Password must be at least 8 characters long with uppercase, lowercase, number, and symbol.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Employee List Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden flex flex-col"
      >
        <div className="bg-[#F8F9FA] px-4 sm:px-6 py-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-body font-semibold text-[#0B1F3A] tracking-wide uppercase">
            Registered Accounts
          </h3>
          <SearchInput placeholder="Search employee..." onSearch={setSearchQuery} className="w-full sm:max-w-xs" />
        </div>
        <div className="flex-1 overflow-x-auto custom-scrollbar p-3 sm:p-4">
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={() => {}}
            emptyMessage={isLoading ? "Loading accounts..." : "No accounts found"}
            emptyIcon={<UserCog size={32} className="text-[#D4AF37]" />}
            pagination={{ page: 1, pageSize: 10, totalItems: filtered.length, onPageChange: () => {} }}
          />
        </div>
      </motion.div>

      {/* Success Modal Overlay */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0B1F3A]/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 sm:p-8 w-[min(94vw,380px)] max-h-[90dvh] flex flex-col items-center text-center shadow-2xl relative"
            >
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mt-2">
                <CheckCircle className="text-green-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#0B1F3A] mb-2 font-body">Account Created!</h3>
              <p className="text-gray-500 text-sm mb-6">The new employee account has been successfully created and saved to the database.</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-[#0B1F3A] text-white py-3 rounded-xl font-semibold hover:bg-[#1E50A0] transition-colors min-h-[44px]"
              >
                Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {employeeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0B1F3A]/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 sm:p-8 w-[min(94vw,380px)] max-h-[90dvh] flex flex-col items-center text-center shadow-2xl relative"
            >
              <button
                onClick={() => setEmployeeToDelete(null)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-4 mt-2">
                <Trash2 className="text-red-500" size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-[#0B1F3A] mb-2 font-body">Delete Account?</h3>
              <p className="text-gray-500 text-[0.85rem] mb-6 leading-relaxed">
                Are you sure you want to permanently delete this employee account? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                <button
                  onClick={() => setEmployeeToDelete(null)}
                  className="flex-1 bg-[#F3F4F6] text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-[#EF4444] text-white py-3 rounded-xl font-semibold hover:bg-[#DC2626] transition-colors shadow-sm min-h-[44px]"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ResetPasswordPage;
