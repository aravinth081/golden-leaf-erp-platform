import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2, RotateCcw } from 'lucide-react';
import { Input, Select, Button, Card, Modal, SearchableSelect } from '../../components/ui';
import { getCenters, type Center } from '../../services/centerService';
import { createClientEnrollment, deleteClientEnrollment } from '../../services/clientService';
const STORAGE_KEY = 'clientEnrollmentDraft';

const ClientEnrollmentPage: React.FC = () => {
  const [centers, setCenters] = useState<Center[]>([]);

  // KYC State
  const [kycData, setKycData] = useState({
    mobile: '', voterId: '', otherId: '', pan: '', smartCard: '',
    caMobile: '', caVoterId: '', caOtherId: '', caPan: ''
  });
  const [kycVerified, setKycVerified] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clientId: '', centerName: 'select', groupId: '001', clientName: '', address: '', pincode: '',
    postOffice: 'select', spouseName: '', noOfChildren: '', monthlyIncome: '',
    monthlyExpense: '', ifscCode: '', bankAcNo: '', retypeBankAcNo: '', bankName: '',
    bankBranch: '', fatherName: '', motherName: '', nomineeName: '', nomineeGender: 'select',
    nomineeDob: '2026-08-31', nomineeRelation: 'select', requestedAmount: 'select',
    gender: 'select', religion: 'select', occupation: 'select', qualification: 'select',
    maritalStatus: 'select', spouseOccupation: 'select', houseStatus: 'select',
    clientStatus: 'unapproved', dob: '2026-08-31', admissionFees: '',
  });

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.kycData) setKycData(parsed.kycData);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.kycVerified) setKycVerified(parsed.kycVerified);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    getCenters().then(setCenters);
  }, []);

  // Save to LocalStorage whenever data changes
  useEffect(() => {
    const draft = { kycData, formData, kycVerified };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [kycData, formData, kycVerified]);

  const handleKycChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setKycData(prev => ({ ...prev, [name]: value }));
    if (kycVerified) setKycVerified(false);
  };

  const handleFormChange = (e: { target: { name: string; value: string } } | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all entered data?")) {
      setKycData({
        mobile: '', voterId: '', otherId: '', pan: '', smartCard: '',
        caMobile: '', caVoterId: '', caOtherId: '', caPan: ''
      });
      setFormData({
        clientId: '', centerName: 'select', groupId: '001', clientName: '', address: '', pincode: '',
        postOffice: 'select', spouseName: '', noOfChildren: '', monthlyIncome: '',
        monthlyExpense: '', ifscCode: '', bankAcNo: '', retypeBankAcNo: '', bankName: '',
        bankBranch: '', fatherName: '', motherName: '', nomineeName: '', nomineeGender: 'select',
        nomineeDob: '2026-08-31', nomineeRelation: 'select', requestedAmount: 'select',
        gender: 'select', religion: 'select', occupation: 'select', qualification: 'select',
        maritalStatus: 'select', spouseOccupation: 'select', houseStatus: 'select',
        clientStatus: 'unapproved', dob: '2026-08-31', admissionFees: '',
      });
      setKycVerified(false);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleVerifyKyc = () => {
    const errors: string[] = [];
    const mobileRegex = /^[0-9]{10}$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    const voterRegex = /^[A-Z]{3}[0-9]{7}$/i;
    const alphaNumericRegex = /^[a-zA-Z0-9]+$/;

    if (kycData.mobile && !mobileRegex.test(kycData.mobile)) errors.push("Mobile Number must be exactly 10 digits.");
    if (kycData.voterId && !voterRegex.test(kycData.voterId)) errors.push("Voters ID No must be 3 letters followed by 7 digits (e.g. ABC1234567).");
    if (kycData.otherId && !alphaNumericRegex.test(kycData.otherId)) errors.push("Other ID No must contain only letters and numbers.");
    if (kycData.pan && !panRegex.test(kycData.pan)) errors.push("Pancard No must be valid (e.g. ABCDE1234F).");
    if (kycData.smartCard && !alphaNumericRegex.test(kycData.smartCard)) errors.push("Smart Card No must contain only letters and numbers.");

    if (kycData.caMobile && !mobileRegex.test(kycData.caMobile)) errors.push("C.A Mobile Number must be exactly 10 digits.");
    if (kycData.caVoterId && !voterRegex.test(kycData.caVoterId)) errors.push("C.A Voter ID No must be 3 letters followed by 7 digits.");
    if (kycData.caOtherId && !alphaNumericRegex.test(kycData.caOtherId)) errors.push("C.A Other ID No must contain only letters and numbers.");
    if (kycData.caPan && !panRegex.test(kycData.caPan)) errors.push("C.A Pancard No must be valid.");

    const isAnyFilled = Object.values(kycData).some(val => val.trim() !== '');

    if (!isAnyFilled) {
      errors.push("Please enter at least one detail to verify.");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsErrorModalOpen(true);
      setKycVerified(false);
    } else {
      setKycVerified(true);
    }
  };

  const handleSave = async () => {
    const errors: string[] = [];
    if (!kycVerified) errors.push("You must verify the KYC details before saving.");
    if (!formData.clientName.trim()) errors.push("Client Name is required.");
    if (formData.centerName === 'select') errors.push("Center Name is required.");
    if (formData.bankAcNo && formData.bankAcNo !== formData.retypeBankAcNo) errors.push("Bank Account numbers do not match.");
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsErrorModalOpen(true);
      return;
    }
    
    // Save to Firebase via service
    await createClientEnrollment(kycData, formData);

    setIsSuccessModalOpen(true);
  };

  const handleDelete = async () => {
    if (!formData.clientId) {
      alert("No Client ID generated to delete.");
      return;
    }
    
    if (window.confirm(`Are you sure you want to completely delete client ${formData.clientId} from Firebase?`)) {
      try {
        await deleteClientEnrollment(formData.clientId);
        alert("Client deleted successfully from Firebase!");
        
        // Reset the form after successful deletion
        handleReset();
      } catch (error) {
        console.error("Failed to delete client", error);
        alert("Failed to delete client.");
      }
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    setKycData({
        mobile: '', voterId: '', otherId: '', pan: '', smartCard: '',
        caMobile: '', caVoterId: '', caOtherId: '', caPan: ''
    });
    setFormData({
        clientId: '', centerName: 'select', groupId: '001', clientName: '', address: '', pincode: '',
        postOffice: 'select', spouseName: '', noOfChildren: '', monthlyIncome: '',
        monthlyExpense: '', ifscCode: '', bankAcNo: '', retypeBankAcNo: '', bankName: '',
        bankBranch: '', fatherName: '', motherName: '', nomineeName: '', nomineeGender: 'select',
        nomineeDob: '2026-08-31', nomineeRelation: 'select', requestedAmount: 'select',
        gender: 'select', religion: 'select', occupation: 'select', qualification: 'select',
        maritalStatus: 'select', spouseOccupation: 'select', houseStatus: 'select',
        clientStatus: 'unapproved', dob: '2026-08-31', admissionFees: '',
    });
    setKycVerified(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const centerOptions = [
    { value: 'select', label: '-- SELECT --' },
    ...centers.map(c => ({
      value: c.id,
      label: `${c.shortId} - ${c.name.toUpperCase()}`
    }))
  ];

  const groupOptions = [
    { value: 'select', label: '-- SELECT --' },
    ...centers.map(c => ({
      value: c.shortId,
      label: c.shortId
    }))
  ];

  const occupationOptions = [
    { value: 'Air Condition Repair', label: 'Air Condition Repair' },
    { value: 'Agarbathi sales', label: 'Agarbathi sales' },
    { value: 'Agency', label: 'Agency' },
    { value: 'Agri Products', label: 'Agri Products' },
    { value: 'Agripurpose', label: 'Agripurpose' },
    { value: 'Aluminium Pattarai', label: 'Aluminium Pattarai' },
    { value: 'Appalam sales', label: 'Appalam sales' },
    { value: 'Auto', label: 'Auto' },
    { value: 'HOSPITAL EXPENESS', label: 'HOSPITAL EXPENESS' },
    { value: 'Auto spare parts', label: 'Auto spare parts' },
    { value: 'Bag Sales', label: 'Bag Sales' },
    { value: 'Bag Works', label: 'Bag Works' },
    { value: 'Bakery Work', label: 'Bakery Work' },
    { value: 'Ball sales', label: 'Ball sales' },
    { value: 'Baloon sales', label: 'Baloon sales' },
    { value: 'Banana sales', label: 'Banana sales' },
    { value: 'Bangle sales', label: 'Bangle sales' },
    { value: 'Basket Sales', label: 'Basket Sales' },
    { value: 'Battery shop', label: 'Battery shop' },
    { value: 'Beauty Parlour', label: 'Beauty Parlour' },
    { value: 'Bed Sheet sales', label: 'Bed Sheet sales' },
    { value: 'Beedi making', label: 'Beedi making' },
    { value: 'Beedi sales', label: 'Beedi sales' },
    { value: 'Beetel sales', label: 'Beetel sales' },
    { value: 'Belt Sales', label: 'Belt Sales' },
    { value: 'Binding work', label: 'Binding work' },
    { value: 'Birds Rearing', label: 'Birds Rearing' },
    { value: 'Biscut Sales', label: 'Biscut Sales' },
    { value: 'Book stall', label: 'Book stall' },
    { value: 'Bottle company', label: 'Bottle company' },
    { value: 'Box making', label: 'Box making' },
    { value: 'Bread sales', label: 'Bread sales' },
    { value: 'Break stones', label: 'Break stones' },
    { value: 'Brick Work', label: 'Brick Work' },
    { value: 'Broiler sales', label: 'Broiler sales' },
    { value: 'Broom stick sales', label: 'Broom stick sales' },
    { value: 'Brush sales', label: 'Brush sales' },
    { value: 'Building work', label: 'Building work' },
    { value: 'Bullock carts', label: 'Bullock carts' },
    { value: 'Cable Work', label: 'Cable Work' },
    { value: 'Calf rearing', label: 'Calf rearing' },
    { value: 'Candle making', label: 'Candle making' },
    { value: 'Car FC', label: 'Car FC' },
    { value: 'Carpentary work', label: 'Carpentary work' },
    { value: 'Casette shop', label: 'Casette shop' },
    { value: 'Cashew Nut sales', label: 'Cashew Nut sales' },
    { value: 'Catering Work', label: 'Catering Work' },
    { value: 'Cell Phone Sales', label: 'Cell Phone Sales' },
    { value: 'Cement Tank Work', label: 'Cement Tank Work' },
    { value: 'Centring Work', label: 'Centring Work' },
    { value: 'Charcoal sales', label: 'Charcoal sales' },
    { value: 'Chemical Sales', label: 'Chemical Sales' },
    { value: 'Cheppal Sales', label: 'Cheppal Sales' },
    { value: 'Chilly Powder sales', label: 'Chilly Powder sales' },
    { value: 'Chips Sales', label: 'Chips Sales' },
    { value: 'Chocalate Sales', label: 'Chocalate Sales' },
    { value: 'Cleaning materials', label: 'Cleaning materials' },
    { value: 'Cloth Sales', label: 'Cloth Sales' },
    { value: 'Coal sales', label: 'Coal sales' },
    { value: 'Coconut sales', label: 'Coconut sales' },
    { value: 'Coffee powder sales', label: 'Coffee powder sales' },
    { value: 'Coin cover making', label: 'Coin cover making' },
    { value: 'Coir making', label: 'Coir making' },
    { value: 'Colour Powder sales', label: 'Colour Powder sales' },
    { value: 'Computer center', label: 'Computer center' },
    { value: 'Contract work', label: 'Contract work' },
    { value: 'Cooldrinks stall', label: 'Cooldrinks stall' },
    { value: 'Cooli', label: 'Cooli' },
    { value: 'Cosmetic Items', label: 'Cosmetic Items' },
    { value: 'Cotton sales', label: 'Cotton sales' },
    { value: 'Cover sales', label: 'Cover sales' },
    { value: 'Cracker shop', label: 'Cracker shop' },
    { value: 'Curd sales', label: 'Curd sales' },
    { value: 'Cut Piece Sales', label: 'Cut Piece Sales' },
    { value: 'Cutting Machine shop', label: 'Cutting Machine shop' },
    { value: 'Cycle shop', label: 'Cycle shop' },
    { value: 'Dates sales', label: 'Dates sales' },
    { value: 'Dhall sales', label: 'Dhall sales' },
    { value: 'Dosa Sales', label: 'Dosa Sales' },
    { value: 'Dothi work', label: 'Dothi work' },
    { value: 'Drilling machine', label: 'Drilling machine' },
    { value: 'Driving school', label: 'Driving school' },
    { value: 'Drumset', label: 'Drumset' },
    { value: 'Dry fruit sales', label: 'Dry fruit sales' },
    { value: 'Dryfish sales', label: 'Dryfish sales' },
    { value: 'Dyeing unit', label: 'Dyeing unit' },
    { value: 'Egg sales', label: 'Egg sales' },
    { value: 'Electrical work', label: 'Electrical work' },
    { value: 'Embroiding Work', label: 'Embroiding Work' },
    { value: 'Fancy item sales', label: 'Fancy item sales' },
    { value: 'Fancy Store', label: 'Fancy Store' },
    { value: 'Fire Wood Sales', label: 'Fire Wood Sales' },
    { value: 'Fish Sales', label: 'Fish Sales' },
    { value: 'Flour Sales', label: 'Flour Sales' },
    { value: 'Flower Sales', label: 'Flower Sales' },
    { value: 'Food sales', label: 'Food sales' },
    { value: 'Foot wear making', label: 'Foot wear making' },
    { value: 'Frame work', label: 'Frame work' },
    { value: 'Fruit Sales', label: 'Fruit Sales' },
    { value: 'Furnitre Making', label: 'Furnitre Making' },
    { value: 'Garlic sales', label: 'Garlic sales' },
    { value: 'Gem cutting', label: 'Gem cutting' },
    { value: 'Gift shop', label: 'Gift shop' },
    { value: 'Gardener', label: 'Gardener' },
    { value: 'Geologist', label: 'Geologist' },
    { value: 'Graphic Designer', label: 'Graphic Designer' },
    { value: 'Guide', label: 'Guide' },
    { value: 'Hairdresser', label: 'Hairdresser' },
    { value: 'Historian', label: 'Historian' },
    { value: 'Hotel Manager', label: 'Hotel Manager' },
    { value: 'HR Manager', label: 'HR Manager' },
    { value: 'Illustrator', label: 'Illustrator' },
    { value: 'Industrial Designer', label: 'Industrial Designer' },
    { value: 'Insurance Agent', label: 'Insurance Agent' },
    { value: 'Interior Designer', label: 'Interior Designer' },
    { value: 'Journalist', label: 'Journalist' },
    { value: 'Judge', label: 'Judge' },
    { value: 'Janitor', label: 'Janitor' },
    { value: 'Jeweller', label: 'Jeweller' },
    { value: 'Karate Instructor', label: 'Karate Instructor' },
    { value: 'Kitchen Manager', label: 'Kitchen Manager' },
    { value: 'Lab Technician', label: 'Lab Technician' },
    { value: 'Lawyer', label: 'Lawyer' },
    { value: 'Librarian', label: 'Librarian' },
    { value: 'Logistics Manager', label: 'Logistics Manager' },
    { value: 'Machine Operator', label: 'Machine Operator' },
    { value: 'Marketing Manager', label: 'Marketing Manager' },
    { value: 'Mechanic', label: 'Mechanic' },
    { value: 'Medical Representative', label: 'Medical Representative' },
    { value: 'Nurse', label: 'Nurse' },
    { value: 'Nutritionist', label: 'Nutritionist' },
    { value: 'Network Engineer', label: 'Network Engineer' },
    { value: 'Notary', label: 'Notary' },
    { value: 'Occupational Therapist', label: 'Occupational Therapist' },
    { value: 'Operations Manager', label: 'Operations Manager' },
    { value: 'Optometrist', label: 'Optometrist' },
    { value: 'Photographer', label: 'Photographer' },
    { value: 'Pilot', label: 'Pilot' },
    { value: 'Plumber', label: 'Plumber' },
    { value: 'Police Officer', label: 'Police Officer' },
    { value: 'Quality Analyst', label: 'Quality Analyst' },
    { value: 'Quantity Surveyor', label: 'Quantity Surveyor' },
    { value: 'Receptionist', label: 'Receptionist' },
    { value: 'Researcher', label: 'Researcher' },
    { value: 'Software Engineer', label: 'Software Engineer' },
    { value: 'Teacher', label: 'Teacher' },
    { value: 'Technician', label: 'Technician' },
    { value: 'Urban Planner', label: 'Urban Planner' },
    { value: 'UX Designer', label: 'UX Designer' },
    { value: 'Veterinarian', label: 'Veterinarian' },
    { value: 'Video Editor', label: 'Video Editor' },
    { value: 'Web Developer', label: 'Web Developer' },
    { value: 'Writer', label: 'Writer' },
    { value: 'Game Developer', label: 'Game Developer' },
    { value: 'Geneticist', label: 'Geneticist' },
    { value: 'Government Officer', label: 'Government Officer' },
    { value: 'Glassblower', label: 'Glassblower' },
    { value: 'Hardware Engineer', label: 'Hardware Engineer' },
    { value: 'Health Inspector', label: 'Health Inspector' },
    { value: 'Hydrologist', label: 'Hydrologist' },
    { value: 'Immigration Officer', label: 'Immigration Officer' },
    { value: 'Investment Banker', label: 'Investment Banker' },
    { value: 'IT Consultant', label: 'IT Consultant' },
    { value: 'Interpreter', label: 'Interpreter' },
    { value: 'Kindergarten Teacher', label: 'Kindergarten Teacher' },
    { value: 'Knowledge Manager', label: 'Knowledge Manager' },
    { value: 'Landscape Architect', label: 'Landscape Architect' },
    { value: 'Loan Officer', label: 'Loan Officer' },
    { value: 'Marine Engineer', label: 'Marine Engineer' },
    { value: 'Meteorologist', label: 'Meteorologist' },
    { value: 'Microbiologist', label: 'Microbiologist' },
    { value: 'Naval Architect', label: 'Naval Architect' },
    { value: 'Ophthalmologist', label: 'Ophthalmologist' },
    { value: 'Physiotherapist', label: 'Physiotherapist' },
    { value: 'Procurement Manager', label: 'Procurement Manager' },
    { value: 'Radiologist', label: 'Radiologist' },
    { value: 'Social Worker', label: 'Social Worker' },
    { value: 'Tax Consultant', label: 'Tax Consultant' },
    { value: 'Tour Operator', label: 'Tour Operator' },
    { value: 'Underwriter', label: 'Underwriter' },
    { value: 'Video Producer', label: 'Video Producer' },
    { value: 'Warehouse Manager', label: 'Warehouse Manager' },
    { value: 'Zoologist', label: 'Zoologist' }
  ];

  const qualificationOptions = [
    { value: 'BELOW SSLC', label: 'BELOW SSLC' },
    { value: 'SSLC', label: 'SSLC' },
    { value: 'HSC', label: 'HSC' },
    { value: 'DIPLOMA', label: 'DIPLOMA' },
    { value: 'NURSING', label: 'NURSING' },
    { value: 'DEGREE', label: 'DEGREE' },
    { value: 'PG', label: 'PG' }
  ];

  const relationOptions = [
    { value: 'brother', label: 'BROTHER' },
    { value: 'sister', label: 'SISTER' },
    { value: 'father', label: 'FATHER' },
    { value: 'mother', label: 'MOTHER' },
    { value: 'son', label: 'SON' },
    { value: 'daughter', label: 'DAUGHTER' },
    { value: 'uncle', label: 'UNCLE' },
    { value: 'aunty', label: 'AUNTY' },
    { value: 'spouse', label: 'SPOUSE' },
    { value: 'center leader', label: 'CENTER LEADER' },
    { value: 'daughter in law', label: 'DAUGHTER IN LAW' },
    { value: 'son in law', label: 'SON IN LAW' },
    { value: 'wife', label: 'WIFE' }
  ];

  const requestedAmountOptions = [
    { value: '10000', label: '10000' },
    { value: '15000', label: '15000' },
    { value: '20000', label: '20000' },
    { value: '40000', label: '40000' }
  ];

  const currentDate = new Date();
  const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 pb-10 overflow-y-auto pr-2 custom-scrollbar font-body [&_label]:!text-[#0B1F3A] [&_label]:!font-semibold [&_label]:!uppercase [&_label]:!tracking-wide [&_label]:!text-[0.85rem] [&_label]:!font-body"
    >
      <div className="bg-[#0B1F3A] px-8 py-4 rounded-2xl border border-[#E5E7EB]/10 flex items-center gap-3 shadow-[0_2px_10px_rgba(11,31,58,0.04)]">
        <div className="w-1 h-4 bg-[#D4AF37] rounded-full"></div>
        <h2 className="text-sm font-body font-semibold text-[#FFFFFF] tracking-wide uppercase">
          Client Enrollment & Registration
        </h2>
      </div>

      {/* KYC Verification */}
      <Card className="p-7 shadow-sm border border-[#E5E7EB] rounded-2xl">
        <h3 className="text-[#0B1F3A] font-semibold text-sm mb-6 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-1 h-4 bg-[#D4AF37] rounded-full inline-block"></span>
          KYC Verification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-x-5 gap-y-6">
          <Input label="Mobile Number" name="mobile" value={kycData.mobile} onChange={handleKycChange} />
          <Input label="Voters ID No" name="voterId" value={kycData.voterId} onChange={handleKycChange} />
          <Input label="Other ID No" name="otherId" value={kycData.otherId} onChange={handleKycChange} />
          <Input label="Pancard No" name="pan" value={kycData.pan} onChange={handleKycChange} />
          <Input label="Smart Card No" name="smartCard" value={kycData.smartCard} onChange={handleKycChange} />

          <Input label="C.A Mobile Number" name="caMobile" value={kycData.caMobile} onChange={handleKycChange} />
          <Input label="C.A Voter ID No." name="caVoterId" value={kycData.caVoterId} onChange={handleKycChange} />
          <Input label="C.A Other ID No." name="caOtherId" value={kycData.caOtherId} onChange={handleKycChange} />
          <Input label="C.A Pancard No." name="caPan" value={kycData.caPan} onChange={handleKycChange} />
        </div>

        <div className="mt-6">
          <Button 
            variant="primary" 
            className={`px-8 shadow-md transition-colors ${kycVerified ? '!bg-green-600 !border-green-600' : ''}`}
            onClick={handleVerifyKyc}
          >
            {kycVerified ? 'Verified ✓' : 'Verify'}
          </Button>
        </div>
      </Card>

      {/* Modals */}
      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title="Validation Error"
        size="md"
      >
        <div className="p-4">
          <p className="text-red-600 font-medium mb-3">Please fix the following details:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-gray-700 text-sm">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => setIsErrorModalOpen(false)}>Okay</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessClose}
        title="Success"
        size="sm"
      >
        <div className="p-4 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <Save size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Saved Successfully!</h3>
          <p className="text-sm text-gray-500 mb-6">The client enrollment has been completely saved to the system.</p>
          <Button variant="primary" className="w-full" onClick={handleSuccessClose}>Done</Button>
        </div>
      </Modal>

      {/* Client / Applicant Details */}
      <Card className="p-7 shadow-sm border border-[#E5E7EB]">
        <h3 className="text-[#0B1F3A] font-semibold text-lg mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#C9A227] rounded-full inline-block"></span>
          Client / Applicant Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-6">
          <div className="md:col-span-3">
            <Select label="Center Name" name="centerName" value={formData.centerName} onChange={handleFormChange} options={centerOptions} />
          </div>
          <div className="md:col-span-2">
            <Select label="Group Id" name="groupId" value={formData.groupId} onChange={handleFormChange} options={groupOptions} />
          </div>
          <div className="md:col-span-1">
            <Input label="Client Id" name="clientId" value={formData.clientId} onChange={handleFormChange} />
          </div>

          <Input label="Client Name" name="clientName" value={formData.clientName} onChange={handleFormChange} />
          <Input label="Address" name="address" value={formData.address} onChange={handleFormChange} />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleFormChange} />
            </div>
            <Button variant="primary" className="mb-[2px] shadow-sm px-3 text-sm">Verify</Button>
          </div>
          <SearchableSelect 
            label="Post Office" 
            name="postOffice" 
            value={formData.postOffice} 
            onChange={handleFormChange} 
            options={[]} 
            allowAdd
          />
          <Input label="District" className="bg-[#F3F4F6] text-gray-600" readOnly />
          <Input label="State" className="bg-[#F3F4F6] text-gray-600" readOnly />

          <Input label="Country" className="bg-[#F3F4F6] text-gray-600" readOnly />
          <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleFormChange} />
          <Input label="Age" className="bg-[#F3F4F6] text-gray-600" readOnly />
          <Select label="Gender" name="gender" value={formData.gender} onChange={handleFormChange} options={[
            { value: 'select', label: '-- SELECT --' },
            { value: 'male', label: 'MALE' },
            { value: 'female', label: 'FEMALE' },
            { value: 'other', label: 'OTHER' }
          ]} />

          <Select 
            label="Religion" 
            name="religion" 
            value={formData.religion} 
            onChange={handleFormChange} 
            options={[
              { value: 'select', label: '-- SELECT --' },
              { value: 'hindu', label: 'HINDU' },
              { value: 'christian', label: 'CHRISTIAN' },
              { value: 'muslim', label: 'MUSLIM' }
            ]} 
          />
          <SearchableSelect 
            label="Occupation" 
            name="occupation" 
            value={formData.occupation} 
            onChange={handleFormChange} 
            options={occupationOptions} 
            allowAdd
          />

          <SearchableSelect 
            label="Qualification" 
            name="qualification" 
            value={formData.qualification} 
            onChange={handleFormChange} 
            options={qualificationOptions} 
            allowAdd
          />
          <SearchableSelect 
            label="Marital Status" 
            name="maritalStatus" 
            value={formData.maritalStatus} 
            onChange={handleFormChange} 
            options={[
              { value: 'single', label: 'SINGLE' },
              { value: 'married', label: 'MARRIED' },
              { value: 'widow', label: 'WIDOW' }
            ]} 
            allowAdd
          />
          <Input label="Spouse Name" name="spouseName" value={formData.spouseName} onChange={handleFormChange} />
          <SearchableSelect 
            label="Spouse Occupation" 
            name="spouseOccupation" 
            value={formData.spouseOccupation} 
            onChange={handleFormChange} 
            options={occupationOptions} 
            allowAdd
          />
          <Input label="No. of Children" name="noOfChildren" type="number" value={formData.noOfChildren} onChange={handleFormChange} />
          <Input label="Monthly Family Income" name="monthlyIncome" type="number" value={formData.monthlyIncome} onChange={handleFormChange} />

          <Input label="Monthly Family Expense" name="monthlyExpense" type="number" value={formData.monthlyExpense} onChange={handleFormChange} />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleFormChange} />
            </div>
            <Button variant="primary" className="mb-[2px] shadow-sm px-3 text-sm">Verify</Button>
          </div>
          <Input label="Bank A/c No" name="bankAcNo" value={formData.bankAcNo} onChange={handleFormChange} />
          <Input label="Retype Bank A/c No" name="retypeBankAcNo" value={formData.retypeBankAcNo} onChange={handleFormChange} />
          <Input label="Bank Name" name="bankName" value={formData.bankName} onChange={handleFormChange} />
          <Input label="Bank Branch" name="bankBranch" value={formData.bankBranch} onChange={handleFormChange} />

          <SearchableSelect 
            label="House Status" 
            name="houseStatus" 
            value={formData.houseStatus} 
            onChange={handleFormChange} 
            options={[
              { value: 'own', label: 'OWN' },
              { value: 'rent', label: 'RENT' },
              { value: 'lease', label: 'LEASE' }
            ]} 
            allowAdd
          />
          <Input label="Father Name" name="fatherName" value={formData.fatherName} onChange={handleFormChange} />
          <Input label="Mother Name" name="motherName" value={formData.motherName} onChange={handleFormChange} />
        </div>
      </Card>

      {/* Nominee / Co Applicant Details */}
      <Card className="p-7 shadow-sm border border-[#E5E7EB]">
        <h3 className="text-[#0B1F3A] font-semibold text-lg mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#C9A227] rounded-full inline-block"></span>
          Nominee / Co Applicant Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-6">
          <Input label="Nominee Name" name="nomineeName" value={formData.nomineeName} onChange={handleFormChange} />
          <Select label="Gender" name="nomineeGender" value={formData.nomineeGender} onChange={handleFormChange} options={[
            { value: 'select', label: '-- SELECT --' },
            { value: 'male', label: 'MALE' },
            { value: 'female', label: 'FEMALE' },
            { value: 'other', label: 'OTHER' }
          ]} />
          <Input label="Date of Birth" name="nomineeDob" type="date" value={formData.nomineeDob} onChange={handleFormChange} />
          <Input label="Age" readOnly />
          <SearchableSelect 
            label="Relation With Client" 
            name="nomineeRelation" 
            value={formData.nomineeRelation} 
            onChange={handleFormChange} 
            options={relationOptions} 
            allowAdd
          />
          <SearchableSelect 
            label="Requested Amount" 
            name="requestedAmount" 
            value={formData.requestedAmount} 
            onChange={handleFormChange} 
            options={requestedAmountOptions} 
            allowAdd
          />

          <Input 
            label="Admission Fees" 
            type="number" 
            name="admissionFees"
            value={formData.admissionFees}
            onChange={handleFormChange}
            placeholder="Enter Amount" 
          />
        </div>
      </Card>

      {/* Action Bar */}
      <Card className="p-7 shadow-sm border border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="w-full md:w-1/4">
            <SearchableSelect
              label="Client Status"
              name="clientStatus"
              value={formData.clientStatus}
              onChange={handleFormChange}
              options={[
                { value: 'unapproved', label: 'UN APPROVED' },
                { value: 'approved', label: 'APPROVED' }
              ]}
            />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="primary" onClick={handleSave} className="px-8 shadow-md hover:shadow-lg transition-all" icon={<Save size={18} />}>Save</Button>
            <Button variant="danger" onClick={handleDelete} className="px-8 shadow-sm hover:shadow-md transition-all" icon={<Trash2 size={18} />}>Delete</Button>
            <Button variant="secondary" onClick={handleReset} className="px-8" icon={<RotateCcw size={18} />}>Reset</Button>
          </div>
        </div>
      </Card>

      <div className="text-sm font-semibold text-[#0B1F3A] px-2 opacity-80 mt-2">
        Current Working Date : {formattedDate}
      </div>
    </motion.div>
  );
};

export default ClientEnrollmentPage;
