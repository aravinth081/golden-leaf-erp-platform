// ──────────────────────────────────────────────────
// Golden Leaf Finance — Quick Customer Registration Modal
// Fast customer onboarding directly from Dashboard
// ──────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, CheckCircle, ExternalLink, ShieldCheck,
  Building2, Phone, User, CreditCard, MapPin, Sparkles
} from 'lucide-react';
import { Modal, Input, Select, Button } from '../ui';
import { useUIStore } from '../../store';
import { getCenters, type Center } from '../../services/centerService';
import { createClientEnrollment } from '../../services/clientService';

export interface QuickCustomerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickCustomerRegistrationModal: React.FC<QuickCustomerRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-generate client ID
  const generateNewClientId = () => `GLF-C-${Math.floor(1000 + Math.random() * 9000)}`;

  const [formData, setFormData] = useState({
    clientId: generateNewClientId(),
    clientName: '',
    mobile: '',
    voterId: '',
    pan: '',
    centerName: 'select',
    groupId: '001',
    address: '',
    city: '',
    pincode: '',
    requestedAmount: '',
    monthlyIncome: '',
    nomineeName: '',
    nomineeRelation: '',
    gender: '',
    occupation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      getCenters().then((data) => {
        setCenters(data);
        if (data.length > 0 && formData.centerName === 'select') {
          setFormData((prev) => ({
            ...prev,
            centerName: data[0].id,
            clientId: generateNewClientId(),
          }));
        }
      });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.clientName.trim()) {
      errs.clientName = 'Customer full name is required';
    }
    if (!formData.mobile.trim() || !/^\d{10}$/.test(formData.mobile.trim())) {
      errs.mobile = 'Valid 10-digit mobile number is required';
    }
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.pan)) {
      errs.pan = 'Invalid PAN format (e.g. ABCDE1234F)';
    }
    if (!formData.address.trim()) {
      errs.address = 'Address is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const kycData = {
        mobile: formData.mobile,
        voterId: formData.voterId,
        otherId: '',
        pan: formData.pan,
        smartCard: '',
        caMobile: '',
        caVoterId: '',
        caOtherId: '',
        caPan: '',
      };

      const clientFullData = {
        ...formData,
        postOffice: 'select',
        spouseName: '',
        noOfChildren: '0',
        monthlyExpense: '5000',
        ifscCode: '',
        bankAcNo: '',
        retypeBankAcNo: '',
        bankName: '',
        bankBranch: '',
        fatherName: '',
        motherName: '',
        nomineeGender: 'select',
        nomineeDob: '1995-01-01',
        religion: 'select',
        qualification: 'SSLC',
        maritalStatus: 'married',
        spouseOccupation: 'select',
        houseStatus: 'own',
        clientStatus: 'active',
        dob: '1990-01-01',
        admissionFees: '100',
      };

      await createClientEnrollment(kycData, clientFullData);

      addToast({
        type: 'success',
        title: 'Customer Registered Successfully!',
        message: `${formData.clientName} has been enrolled with ID ${formData.clientId}.`,
      });

      if (onSuccess) onSuccess();
      onClose();

      // Reset form
      setFormData({
        clientId: generateNewClientId(),
        clientName: '',
        mobile: '',
        voterId: '',
        pan: '',
        centerName: centers[0]?.id || 'select',
        groupId: '001',
        address: '',
        city: '',
        pincode: '',
        requestedAmount: '',
        monthlyIncome: '',
        nomineeName: '',
        nomineeRelation: '',
        gender: '',
        occupation: '',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: err.message || 'Unable to register customer. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const centerOptions = [
    { value: 'select', label: '-- Select Center --' },
    ...centers.map((c) => ({
      value: c.id,
      label: `${c.shortId} - ${c.name.toUpperCase()}`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Quick Customer Registration"
      description="Register a new applicant directly to the system with auto-generated ID"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-1 font-body [&_label]:!text-[#0B1F3A] [&_label]:!font-semibold [&_label]:!uppercase [&_label]:!tracking-wide [&_label]:!text-[0.85rem] [&_label]:!font-body">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#162D4A] rounded-xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-[#D4AF37]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] flex-shrink-0">
              <UserPlus size={20} />
            </div>
            <div>
              <div className="text-xs text-gold-300 font-semibold uppercase tracking-wider">Applicant ID Generated</div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                {formData.clientId}
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready
                </span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              navigate('/client/enrollment');
            }}
            className="!text-xs !border-[#D4AF37] !text-[#D4AF37] hover:!bg-[#D4AF37]/10 w-full sm:w-auto justify-center"
            icon={<ExternalLink size={13} />}
          >
            Full Enrollment Form
          </Button>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Full Name of Customer *"
              name="clientName"
              placeholder="e.g. Kavitha Murugan"
              value={formData.clientName}
              onChange={handleChange}
              error={errors.clientName}
              required
            />
          </div>

          <div>
            <Input
              label="Primary Mobile (10 digits) *"
              name="mobile"
              type="tel"
              placeholder="9876543210"
              maxLength={10}
              value={formData.mobile}
              onChange={handleChange}
              error={errors.mobile}
              required
            />
          </div>

          <div>
            <Select
              label="Center Branch *"
              name="centerName"
              value={formData.centerName}
              onChange={handleChange}
              options={centerOptions.length > 1 ? centerOptions : [
                { value: 'main', label: '001 - MAIN CHENNAI' },
                { value: 'north', label: '002 - NORTH ZONE' },
                { value: 'south', label: '003 - SOUTH MADURAI' },
                { value: 'west', label: '004 - WEST COIMBATORE' },
              ]}
            />
          </div>

          <div>
            <Select
              label="Group Allocation"
              name="groupId"
              value={formData.groupId}
              onChange={handleChange}
              options={[
                { value: '001', label: 'Group 001 - Malar Sangam' },
                { value: '002', label: 'Group 002 - Roja SHG' },
                { value: '003', label: 'Group 003 - Kurinji Borrowers' },
                { value: '004', label: 'Group 004 - Mullai Group' },
              ]}
            />
          </div>

          <div>
            <Select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>

          <div>
            <Input
              label="PAN Card No."
              name="pan"
              placeholder="ABCDE1234F"
              value={formData.pan}
              onChange={handleChange}
              error={errors.pan}
            />
          </div>

          <div>
            <Input
              label="Voter ID No."
              name="voterId"
              placeholder="ABC1234567"
              value={formData.voterId}
              onChange={handleChange}
            />
          </div>

          <div>
            <Select
              label="Initial Loan Request"
              name="requestedAmount"
              value={formData.requestedAmount}
              onChange={handleChange}
              options={[
                { value: '10000', label: '₹10,000 (Starter Micro Loan)' },
                { value: '15000', label: '₹15,000 (Standard Group Loan)' },
                { value: '20000', label: '₹20,000 (Standard Micro Loan)' },
                { value: '30000', label: '₹30,000 (Growth Capital)' },
                { value: '40000', label: '₹40,000 (Enterprise Loan)' },
                { value: '50000', label: '₹50,000 (Gold Plus Tier)' },
              ]}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Residential Address *"
              name="address"
              placeholder="Door No, Street Name, Landmark"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              required
            />
          </div>

          <div>
            <Input
              label="Monthly Income (₹)"
              name="monthlyIncome"
              type="number"
              placeholder="e.g. 18000"
              value={formData.monthlyIncome}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label="Nominee Full Name"
              name="nomineeName"
              placeholder="e.g. Murugan S."
              value={formData.nomineeName}
              onChange={handleChange}
            />
          </div>

          <div>
            <Select
              label="Nominee Relationship"
              name="nomineeRelation"
              value={formData.nomineeRelation}
              onChange={handleChange}
              options={[
                { value: 'spouse', label: 'Spouse' },
                { value: 'father', label: 'Father' },
                { value: 'mother', label: 'Mother' },
                { value: 'son', label: 'Son' },
                { value: 'daughter', label: 'Daughter' },
                { value: 'brother', label: 'Brother' },
                { value: 'sister', label: 'Sister' },
              ]}
            />
          </div>

          <div>
            <Input
              label="Primary Occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              placeholder="e.g. Agri Products or enter custom..."
              list="quick-modal-occupations"
              hint="Select from dropdown suggestions or type manually"
            />
            <datalist id="quick-modal-occupations">
              <option value="Agri Products" />
              <option value="Dairy Farming" />
              <option value="Tailoring & Garments" />
              <option value="Grocery / Retail Shop" />
              <option value="Food & Catering Stall" />
              <option value="Handicrafts & Weaving" />
              <option value="Self Employed Service" />
              <option value="Street Vending" />
              <option value="Small Business / Shop" />
            </datalist>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                navigate('/client/enrollment');
              }}
              icon={<ExternalLink size={14} />}
              className="w-full sm:w-auto justify-center"
            >
              Detailed KYC Form
            </Button>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="!bg-[#0B1F3A] hover:!bg-[#162D4A] !text-white !font-bold px-6 shadow-md w-full sm:w-auto justify-center"
              icon={<UserPlus size={16} className="text-[#D4AF37]" />}
            >
              Save & Register Customer
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
