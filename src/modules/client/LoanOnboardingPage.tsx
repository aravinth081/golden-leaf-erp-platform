import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Select, SearchableSelect, Button, Card, Modal } from '../../components/ui';
import { getCenters, type Center } from '../../services/centerService';
import { getClients, type ClientData } from '../../services/clientService';
import { createLoanOnboarding } from '../../services/loanService';
import { Save } from 'lucide-react';

const LoanOnboardingPage: React.FC = () => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [formData, setFormData] = useState({
    centerName: 'select',
    clientName: 'select',
    frequency: 'select',
    loanProduct: 'select',
    purpose: 'select',
  });
  
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);


  useEffect(() => {
    getCenters().then(setCenters);
    getClients().then(setClients);
  }, []);

  const centerOptions = [
    { value: 'select', label: '-- SELECT --' },
    ...centers.map(c => ({
      value: c.id,
      label: `${c.shortId} - ${c.name.toUpperCase()}`
    }))
  ];

  const filteredClients = formData.centerName === 'select' 
    ? clients 
    : clients.filter(c => c.formData?.centerName === formData.centerName);

  const clientOptions = [
    { value: 'select', label: '-- SELECT --' },
    ...filteredClients.map(c => ({
      value: c.id!,
      label: `${c.formData.clientId || c.id} - ${c.formData.clientName?.toUpperCase() || 'UNKNOWN'}`
    }))
  ];

  const purposeOptions = [
    { value: 'select', label: '-- SELECT --' },
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

  const handleReset = () => {
    setFormData({
      centerName: 'select',
      clientName: 'select',
      frequency: 'select',
      loanProduct: 'select',
      purpose: 'select',
    });
    setSelectedClient(null);
  };

  const handleFormChange = (e: { target: { name: string; value: string } } | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'centerName') {
      setFormData(prev => ({ ...prev, [name]: value, clientName: 'select' }));
      setSelectedClient(null);
    } else if (name === 'clientName') {
      setFormData(prev => ({ ...prev, [name]: value }));
      const client = clients.find(c => c.id === value);
      setSelectedClient(client || null);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getProductInfo = (product: string) => {
    if (product === 'select' || !product) {
      return { name: '-', amt: '-', dues: '-', int: '-', fee: '-', ins: '-' };
    }

    // Try to extract amount and dues from the string (e.g., "IL 15,000 25 W" or "WKS 10000 20D")
    const amtMatch = product.match(/(\d{2,3}(?:,\d{3})*|\d{4,5})/);
    const duesMatch = product.match(/(\d+)\s*[WD]/i) || product.match(/(\d+)$/);

    const amtStr = amtMatch ? amtMatch[1].replace(/,/g, '') : '0';
    const duesStr = duesMatch ? duesMatch[1] : '0';

    const amt = parseInt(amtStr, 10);
    
    if (amt > 0) {
      // Standard product calculation (interest, processing fee, insurance)
      const intAmt = Math.round(amt * 0.20); 
      const fee = Math.round(amt * 0.03); 
      const ins = Math.round(amt * 0.03);
      return { 
        name: product, 
        amt: amt.toString(), 
        dues: duesStr !== '0' ? duesStr : '-', 
        int: intAmt.toString(), 
        fee: fee.toString(), 
        ins: ins.toString() 
      };
    }

    return { name: product, amt: '-', dues: '-', int: '-', fee: '-', ins: '-' };
  };
  const productInfo = getProductInfo(formData.loanProduct);

  const handleSave = async () => {
    if (formData.clientName === 'select' || formData.centerName === 'select') {
      alert("Please select a Center and a Client before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const applicationData = {
        ...formData,
        clientData: selectedClient
      };
      
      await createLoanOnboarding(applicationData);
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("Failed to save onboarding application:", error);
      alert("Failed to save application. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    handleReset();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 pb-10 overflow-y-auto pr-2 custom-scrollbar [&_label]:!text-[#0B1F3A] [&_label]:!font-semibold"
    >
      <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1A365D] py-4 px-6 rounded-xl shadow-md border border-[#243B55] flex items-center gap-3">
        <div className="w-2 h-8 bg-[#C9A227] rounded-full shadow-sm"></div>
        <h2 className="text-2xl font-bold font-display tracking-wide text-white">Loan Application</h2>
      </div>

      <Card className="p-7 shadow-sm border border-[#E5E7EB]">
        
        {/* Top Section - 5 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-x-4 gap-y-6 mb-6 items-start">
          <SearchableSelect 
            label="Center Name" 
            name="centerName" 
            value={formData.centerName} 
            onChange={handleFormChange} 
            options={centerOptions} 
          />
          
          <div className="flex flex-col">
            <SearchableSelect 
              label="Client Name" 
              name="clientName" 
              value={formData.clientName} 
              onChange={handleFormChange} 
              options={clientOptions} 
              allowAdd
            />
            <p className="text-sm font-semibold mt-4 text-[#0B1F3A]">Sanctioned Amount : </p>
          </div>

          <SearchableSelect 
            label="Frequency" 
            name="frequency" 
            value={formData.frequency} 
            onChange={handleFormChange} 
            options={[
              { value: 'select', label: '-- SELECT --' },
              { value: 'WKS', label: 'WKS' }
            ]} 
            allowAdd
          />

          <SearchableSelect 
            label="Loan Product" 
            name="loanProduct" 
            value={formData.loanProduct} 
            onChange={handleFormChange} 
            options={[
              { value: 'select', label: '-- SELECT --' },
              { value: 'IL 10,000 20 W', label: 'IL 10,000 20 W' },
              { value: 'IL 15,000 25 W', label: 'IL 15,000 25 W' },
              { value: 'IL 20,000 30 W', label: 'IL 20,000 30 W' },
              { value: 'T V 10,000 20 W', label: 'T V 10,000 20 W' },
              { value: 'T V 15,000 25 W', label: 'T V 15,000 25 W' },
              { value: 'T V 20,000 30 W', label: 'T V 20,000 30 W' },
              { value: 'WKS 10000 20D', label: 'WKS 10000 20D' },
              { value: 'WKS 15000 25D', label: 'WKS 15000 25D' }
            ]} 
            allowAdd
          />

          <SearchableSelect 
            label="Purpose" 
            name="purpose" 
            value={formData.purpose} 
            onChange={handleFormChange} 
            options={purposeOptions} 
            allowAdd
          />
        </div>

        {/* Details Sections */}
        <div className="flex flex-col gap-10 mt-12 mb-16">
          <div className="text-[#0B1F3A] font-semibold text-[17px]">KYC Details</div>
          <div className="text-[#0B1F3A] font-semibold text-[17px]">Exist Loan Details</div>
          <div className="text-[#0B1F3A] font-semibold text-[17px]">Product Details</div>
        </div>

        {/* Client Details Section */}
        {selectedClient && (
          <div className="mt-8 space-y-8 animate-fadeIn">
            {/* KYC Details */}
            <div>
              <h4 className="text-[#0B1F3A] font-semibold text-md mb-3">KYC Details</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead className="bg-[#1A365D] text-white">
                    <tr>
                      <th className="p-2 border border-gray-300 text-left text-sm font-medium">Type</th>
                      <th className="p-2 border border-gray-300 text-left text-sm font-medium">Phone</th>
                      <th className="p-2 border border-gray-300 text-left text-sm font-medium">Voter ID</th>
                      <th className="p-2 border border-gray-300 text-left text-sm font-medium">Pancard</th>
                      <th className="p-2 border border-gray-300 text-left text-sm font-medium">Rationcard</th>
                      <th className="p-2 border border-gray-300 text-left text-sm font-medium">UID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="hover:bg-gray-50 text-sm text-gray-700">
                      <td className="p-2 border border-gray-200 font-semibold uppercase">CLIENT</td>
                      <td className="p-2 border border-gray-200">{selectedClient.kycData?.mobile || 'X'}</td>
                      <td className="p-2 border border-gray-200">{selectedClient.kycData?.voterId || 'X'}</td>
                      <td className="p-2 border border-gray-200">{selectedClient.kycData?.pan || 'X'}</td>
                      <td className="p-2 border border-gray-200">{selectedClient.kycData?.smartCard || 'X'}</td>
                      <td className="p-2 border border-gray-200">{selectedClient.kycData?.otherId || 'X'}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 text-sm text-gray-700">
                      <td className="p-2 border border-gray-200 font-semibold uppercase">NOMINEE</td>
                      <td className="p-2 border border-gray-200">{selectedClient.kycData?.caMobile || 'X'}</td>
                      <td className="p-2 border border-gray-200">{selectedClient.kycData?.caVoterId || 'X'}</td>
                      <td className="p-2 border border-gray-200">{selectedClient.kycData?.caPan || '0'}</td>
                      <td className="p-2 border border-gray-200">X</td>
                      <td className="p-2 border border-gray-200">{selectedClient.kycData?.caOtherId || 'X'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exist Loan Details */}
            <div>
              <h4 className="text-[#0B1F3A] font-semibold text-md mb-3">Exist Loan Details</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead className="bg-[#1A365D] text-white">
                    <tr className="text-[11px] uppercase tracking-wider">
                      <th className="p-2 border border-gray-300 text-left font-medium">Disb. Date</th>
                      <th className="p-2 border border-gray-300 text-left font-medium">Loan A/c</th>
                      <th className="p-2 border border-gray-300 text-left font-medium">Loan Amt</th>
                      <th className="p-2 border border-gray-300 text-left font-medium">Total Dues</th>
                      <th className="p-2 border border-gray-300 text-left font-medium">Comp. Dues</th>
                      <th className="p-2 border border-gray-300 text-left font-medium">Coll.Dues</th>
                      <th className="p-2 border border-gray-300 text-left font-medium">Due Start Date</th>
                      <th className="p-2 border border-gray-300 text-left font-medium">Maturity Date</th>
                      <th className="p-2 border border-gray-300 text-left font-medium">Closed Date</th>
                      <th className="p-2 border border-gray-300 text-left font-medium">Pri. Balance</th>
                      <th className="p-2 border border-gray-300 text-left font-medium">Int. Balance</th>
                      <th className="p-2 border border-gray-300 text-left font-medium">Closing Arr. Pri.</th>
                      <th className="p-2 border border-gray-300 text-left font-medium">Closing Arr. Int.</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td colSpan={13} className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                        No existing loans found for this client.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Details (Table) */}
            {formData.frequency === 'WKS' && (
              <div className="animate-fadeIn">
                <h4 className="text-[#0B1F3A] font-semibold text-md mb-3">Product Details</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead className="bg-[#1A365D] text-white">
                      <tr className="text-sm">
                        <th className="p-2 border border-gray-300 text-left font-medium text-center">Product Name</th>
                        <th className="p-2 border border-gray-300 text-left font-medium text-center">Frequency</th>
                        <th className="p-2 border border-gray-300 text-left font-medium text-center">Loan Amt</th>
                        <th className="p-2 border border-gray-300 text-left font-medium text-center">Total Dues</th>
                        <th className="p-2 border border-gray-300 text-left font-medium text-center">Int Amt</th>
                        <th className="p-2 border border-gray-300 text-left font-medium text-center">Proc. Fee</th>
                        <th className="p-2 border border-gray-300 text-left font-medium text-center">Insurance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr className="hover:bg-gray-50 text-sm text-gray-700 text-center">
                        <td className="p-2 border border-gray-200 text-left">{productInfo.name}</td>
                        <td className="p-2 border border-gray-200 text-left">{formData.frequency}</td>
                        <td className="p-2 border border-gray-200 text-left">{productInfo.amt}</td>
                        <td className="p-2 border border-gray-200 text-left">{productInfo.dues}</td>
                        <td className="p-2 border border-gray-200 text-left">{productInfo.int}</td>
                        <td className="p-2 border border-gray-200 text-left">{productInfo.fee}</td>
                        <td className="p-2 border border-gray-200 text-left">{productInfo.ins}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Details (Warnings) */}
            <div>
              <h4 className="text-[#0B1F3A] font-semibold text-md mb-3">Alerts & Warnings</h4>
              <div className="space-y-1 bg-white p-4 border border-gray-200">
                <p className="text-red-600 font-bold text-sm leading-tight inline-block bg-yellow-300 px-1 mb-1">* Loan Balance Exists For This Client</p><br/>
                <p className="text-red-600 font-bold text-sm leading-tight inline-block bg-yellow-300 px-1 mb-1">* Arrear Exists For This Client</p><br/>
                <p className="text-red-600 font-bold text-sm leading-tight inline-block bg-yellow-300 px-1 mb-1">* `CLIENT PHOTO` Image Not Uploaded.</p><br/>
                <p className="text-red-600 font-bold text-sm leading-tight inline-block bg-yellow-300 px-1 mb-1">* `CLIENT WITH HOUSE PHOTO` Image Not Uploaded.</p><br/>
                <p className="text-red-600 font-bold text-sm leading-tight inline-block bg-yellow-300 px-1 mb-1">* `CLIENT UID FRONT` Image Not Uploaded.</p><br/>
                <p className="text-red-600 font-bold text-sm leading-tight inline-block bg-yellow-300 px-1 mb-1">* `CLIENT UID BACK` Image Not Uploaded.</p><br/>
                <p className="text-red-600 font-bold text-sm leading-tight inline-block bg-yellow-300 px-1 mb-1">* `NOMINEE UID FRONT` Image Not Uploaded.</p><br/>
                <p className="text-red-600 font-bold text-sm leading-tight inline-block bg-yellow-300 px-1 mb-1">* `NOMINEE UID BACK` Image Not Uploaded.</p><br/>
                <p className="text-red-600 font-bold text-sm leading-tight inline-block bg-yellow-300 px-1 mb-1">* `CURRENT ADDRESS PROOF` Image Not Uploaded.</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200">
          <Button variant="primary" onClick={handleSave} loading={isSaving} className="px-8 shadow-md hover:shadow-lg transition-all">Save</Button>
          <Button variant="danger" onClick={handleReset} disabled={isSaving} className="px-8 shadow-sm hover:shadow-md transition-all">Reset</Button>
        </div>
      </Card>

      {/* Success Modal */}
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
          <p className="text-sm text-gray-500 mb-6">The loan application has been successfully saved to Firebase.</p>
          <Button variant="primary" className="w-full" onClick={handleSuccessClose}>Done</Button>
        </div>
      </Modal>
    </motion.div>
  );
};

export default LoanOnboardingPage;
