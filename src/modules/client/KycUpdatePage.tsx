import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCenters, type Center } from '../../services/centerService';
import { getClients, type ClientData } from '../../services/clientService';
import { Input, Select, SearchableSelect, Button, Card } from '../../components/ui';

const KycUpdatePage: React.FC = () => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);

  const [formData, setFormData] = useState({
    centerName: 'select',
    clientName: 'select',
    clientId: '',
    dateOfJoining: '',
    dob: '',
    age: '',
    presentAddress: '',
    pincode: '',
    postOffice: 'select',
    district: '',
    state: '',
    country: '',
    mobileNumber: '',
    bankIfsc: '',
    passbookNo: '',
    retypePassbookNo: '',
    bankName: '',
    bankBranch: '',
    fatherName: '',
    motherName: '',
    requestedAmount: 'select',
    otherIdNo: '',
    smartCardNo: '',
    voterIdNo: '',
    pancardNo: '',
    latitude: '',
    longitude: '',
  });

  const [isPincodeVerified, setIsPincodeVerified] = useState(false);
  const [isIfscVerified, setIsIfscVerified] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getCenters().then(setCenters);
    getClients().then(setClients);
  }, []);

  useEffect(() => {
    if (formData.clientName !== 'select') {
      const selectedClient = clients.find(c => c.id === formData.clientName);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          clientId: selectedClient.formData.clientId || '',
          dateOfJoining: selectedClient.createdAt ? selectedClient.createdAt.toISOString().split('T')[0] : '',
          dob: selectedClient.formData.dob || '',
          presentAddress: selectedClient.formData.address || '',
          pincode: selectedClient.formData.pincode || '',
          mobileNumber: selectedClient.kycData?.mobile || '',
          voterIdNo: selectedClient.kycData?.voterId || '',
          pancardNo: selectedClient.kycData?.pan || '',
          otherIdNo: selectedClient.kycData?.otherId || '',
          smartCardNo: selectedClient.kycData?.smartCard || '',
          bankIfsc: selectedClient.formData.ifscCode || '',
          passbookNo: selectedClient.formData.bankAcNo || '',
          bankName: selectedClient.formData.bankName || '',
          bankBranch: selectedClient.formData.bankBranch || '',
          fatherName: selectedClient.formData.fatherName || '',
          motherName: selectedClient.formData.motherName || '',
          requestedAmount: selectedClient.formData.requestedAmount || 'select',
        }));
      }
    } else {
      clearForm(false);
    }
  }, [formData.clientName, clients]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    // Reset verification status if the field is changed
    if (name === 'pincode') setIsPincodeVerified(false);
    if (name === 'bankIfsc') setIsIfscVerified(false);
  };

  const clearForm = (resetClientName: boolean = true) => {
    setErrors({});
    setFormData(prev => ({
      ...prev,
      centerName: resetClientName ? 'select' : prev.centerName,
      clientName: resetClientName ? 'select' : prev.clientName,
      clientId: '',
      dateOfJoining: '',
      dob: '',
      age: '',
      presentAddress: '',
      pincode: '',
      postOffice: 'select',
      district: '',
      state: '',
      country: '',
      mobileNumber: '',
      bankIfsc: '',
      passbookNo: '',
      retypePassbookNo: '',
      bankName: '',
      bankBranch: '',
      fatherName: '',
      motherName: '',
      requestedAmount: 'select',
      otherIdNo: '',
      smartCardNo: '',
      voterIdNo: '',
      pancardNo: '',
      latitude: '',
      longitude: '',
    }));
  };

  const handleReset = () => {
    clearForm(true);
  };

  const handleLocateClient = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Construct address from form fields
    const addressParts = [
      formData.presentAddress,
      formData.postOffice !== 'select' ? formData.postOffice : '',
      formData.district,
      formData.state,
      formData.country,
      formData.pincode
    ].filter(part => part && part.trim() !== '');

    const query = addressParts.join(', ');

    if (!query) {
      alert("Please enter an address (Present Address, Post Office, Pincode, etc.) to locate the client.");
      return;
    }

    // Open Google Maps in a new tab
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(mapsUrl, '_blank');

    // Attempt to auto-fill latitude and longitude using a free geocoding API (Nominatim)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setFormData(prev => ({
            ...prev,
            latitude: parseFloat(data[0].lat).toFixed(6),
            longitude: parseFloat(data[0].lon).toFixed(6)
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch coordinates", error);
    }
  };

  const handleVerifyPincode = () => {
    const pinRegex = /^\d{6}$/;
    if (pinRegex.test(formData.pincode)) {
      setIsPincodeVerified(true);
    } else {
      setIsPincodeVerified(false);
      alert("Invalid Pincode format. Please enter exactly 6 digits.");
    }
  };

  const handleVerifyIfsc = () => {
    const ifscRegex = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
    if (ifscRegex.test(formData.bankIfsc)) {
      setIsIfscVerified(true);
    } else {
      setIsIfscVerified(false);
      alert("Invalid IFSC format. Must be 11 characters (e.g., SBIN0123456).");
    }
  };

  const handleUpdate = () => {
    const newErrors: Record<string, string> = {};
    const requiredFields = [
      'centerName', 'clientName', 'clientId', 'dateOfJoining', 'dob',
      'age', 'presentAddress', 'pincode', 'postOffice', 'district', 'state', 'country',
      'mobileNumber', 'bankIfsc', 'passbookNo', 'retypePassbookNo', 'bankName', 'bankBranch',
      'fatherName', 'motherName', 'requestedAmount', 'latitude', 'longitude'
    ];
    let firstErrorField: string | null = null;

    requiredFields.forEach(field => {
      const value = (formData as any)[field];
      if (!value || value === 'select' || (typeof value === 'string' && value.trim() === '')) {
        newErrors[field] = 'Required';
        if (!firstErrorField) firstErrorField = field;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField) || document.querySelector(`[name="${firstErrorField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (el as HTMLElement).focus?.();
        }
      }
      return;
    }

    setErrors({});
    alert("Updated successfully");
  };

  const centerOptions = [
    { value: 'select', label: '-- SELECT --' },
    ...centers.map(c => ({
      value: c.id,
      label: `${c.shortId} - ${c.name.toUpperCase()}`
    }))
  ];

  const clientOptions = [
    { value: 'select', label: '-- SELECT --' },
    ...clients.map(c => ({
      value: c.id!,
      label: `${c.formData.clientId || c.id} - ${c.formData.clientName?.toUpperCase() || 'UNKNOWN'}`
    }))
  ];

  const amountOptions = [
    { value: 'select', label: '-- SELECT --' },
    { value: '10000', label: '10000' },
    { value: '15000', label: '15000' },
    { value: '20000', label: '20000' },
    { value: '40000', label: '40000' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 pb-10 overflow-y-auto pr-2 custom-scrollbar [&_label]:!text-[#0B1F3A] [&_label]:!font-semibold"
    >
      <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1A365D] py-4 px-6 rounded-xl shadow-md border border-[#243B55] flex items-center gap-3">
        <div className="w-2 h-8 bg-[#C9A227] rounded-full shadow-sm"></div>
        <h2 className="text-2xl font-bold font-display tracking-wide text-white">KYC Update</h2>
      </div>

      <Card className="p-7 shadow-sm border border-[#E5E7EB]">
        <h3 className="text-[#0B1F3A] font-semibold text-lg mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#C9A227] rounded-full inline-block"></span>
          KYC Update
        </h3>

        {/* Top Section - 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-6">
          <SearchableSelect label="Center Name" name="centerName" error={errors.centerName} value={formData.centerName} onChange={handleFormChange} options={centerOptions} allowAdd />
          <SearchableSelect label="Client Name" name="clientName" error={errors.clientName} value={formData.clientName} onChange={handleFormChange} options={clientOptions} allowAdd />
        </div>

        {/* Main Section - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
          <Input label="Client Id" name="clientId" error={errors.clientId} value={formData.clientId} onChange={handleFormChange} />
          <Input label="Date of Joining" name="dateOfJoining" error={errors.dateOfJoining} value={formData.dateOfJoining} onChange={handleFormChange} />
          <Input label="Date of Birth" type="date" name="dob" error={errors.dob} value={formData.dob} onChange={handleFormChange} />
          
          <Input label="Age" name="age" error={errors.age} value={formData.age} onChange={handleFormChange} />
          <Input label="Present Address" name="presentAddress" error={errors.presentAddress} value={formData.presentAddress} onChange={handleFormChange} />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input label="Pincode" name="pincode" error={errors.pincode} value={formData.pincode} onChange={handleFormChange} />
            </div>
            <Button 
              variant="primary" 
              className={`mb-[2px] shadow-sm px-4 text-sm ${isPincodeVerified ? '!bg-green-600 !border-green-600' : ''}`}
              onClick={handleVerifyPincode}
            >
              {isPincodeVerified ? 'Verified ✓' : 'Verify'}
            </Button>
          </div>

          <SearchableSelect label="Post Office" name="postOffice" error={errors.postOffice} value={formData.postOffice} onChange={handleFormChange} options={[]} allowAdd />
          <Input label="District" name="district" error={errors.district} value={formData.district} onChange={handleFormChange} />
          <Input label="State" name="state" error={errors.state} value={formData.state} onChange={handleFormChange} />

          <Input label="Country" name="country" error={errors.country} value={formData.country} onChange={handleFormChange} />
          <Input label="Mobile Number" name="mobileNumber" error={errors.mobileNumber} value={formData.mobileNumber} onChange={handleFormChange} />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input label="Bank IFSC" name="bankIfsc" error={errors.bankIfsc} value={formData.bankIfsc} onChange={handleFormChange} />
            </div>
            <Button 
              variant="primary" 
              className={`mb-[2px] shadow-sm px-4 text-sm ${isIfscVerified ? '!bg-green-600 !border-green-600' : ''}`}
              onClick={handleVerifyIfsc}
            >
              {isIfscVerified ? 'Verified ✓' : 'Verify'}
            </Button>
          </div>

          <Input label="Passbook No." name="passbookNo" error={errors.passbookNo} value={formData.passbookNo} onChange={handleFormChange} />
          <Input label="Re-type Passbook No." name="retypePassbookNo" error={errors.retypePassbookNo} value={formData.retypePassbookNo} onChange={handleFormChange} />
          <Input label="Bank Name" name="bankName" error={errors.bankName} value={formData.bankName} onChange={handleFormChange} />

          <Input label="Bank Branch" name="bankBranch" error={errors.bankBranch} value={formData.bankBranch} onChange={handleFormChange} />
          <Input label="Father Name" name="fatherName" error={errors.fatherName} value={formData.fatherName} onChange={handleFormChange} />
          <Input label="Mother Name" name="motherName" error={errors.motherName} value={formData.motherName} onChange={handleFormChange} />

          <Select label="Requested Amount" name="requestedAmount" error={errors.requestedAmount} value={formData.requestedAmount} onChange={handleFormChange} options={amountOptions} />
          <Input label="Other ID No." name="otherIdNo" error={errors.otherIdNo} value={formData.otherIdNo} onChange={handleFormChange} />
          <Input label="Smart Card No." name="smartCardNo" error={errors.smartCardNo} value={formData.smartCardNo} onChange={handleFormChange} />

          <Input label="Voter ID No." name="voterIdNo" error={errors.voterIdNo} value={formData.voterIdNo} onChange={handleFormChange} />
          <Input label="Pancard No." name="pancardNo" error={errors.pancardNo} value={formData.pancardNo} onChange={handleFormChange} />
          <div className="hidden md:block"></div> {/* Spacer */}

          <Input label="Latitude" name="latitude" error={errors.latitude} value={formData.latitude} onChange={handleFormChange} />
          <Input label="Longitude" name="longitude" error={errors.longitude} value={formData.longitude} onChange={handleFormChange} />
          <div className="hidden md:block"></div> {/* Spacer */}
        </div>

        <div className="mt-6">
          <label className="block text-sm mb-2 text-[#0B1F3A] font-semibold">Locate Client</label>
          <button 
            type="button" 
            onClick={handleLocateClient}
            className="inline-block p-1 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A227]" 
            title="Locate on Map and fetch coordinates"
          >
            <img src="/images/google-maps.svg" alt="Google Maps" className="w-10 h-10 object-contain" />
          </button>
        </div>

        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200">
          <Button variant="primary" onClick={handleUpdate} className="px-8 shadow-md hover:shadow-lg transition-all">Update</Button>
          <Button variant="danger" onClick={handleReset} className="px-8 shadow-sm hover:shadow-md transition-all">Reset</Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default KycUpdatePage;
