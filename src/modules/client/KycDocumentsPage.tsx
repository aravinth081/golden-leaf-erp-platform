import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, RotateCcw, CheckCircle2, Loader2 } from 'lucide-react';
import { Input, Select, Button, Card, SearchableSelect, Modal } from '../../components/ui';
import { getCenters, type Center } from '../../services/centerService';
import { getClients, type ClientData } from '../../services/clientService';
import { uploadImage } from '../../services/cloudinary';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useUIStore } from '../../store';

const KycDocumentsPage: React.FC = () => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [formData, setFormData] = useState({
    centerName: 'select',
    clientName: 'select',
    documentName: 'select',
    clientIdReadonly: '',
    dateOfJoining: '',
  });

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    getCenters().then(setCenters);
    getClients().then(setClients);
  }, []);

  // Watch for clientName changes to auto-populate the readonly fields
  useEffect(() => {
    if (formData.clientName !== 'select') {
      const selectedClient = clients.find(c => c.id === formData.clientName);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          clientIdReadonly: selectedClient.formData.clientId || '',
          dateOfJoining: selectedClient.formData.dob || '', // Fallback to DOB or createdAt
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        clientIdReadonly: '',
        dateOfJoining: '',
      }));
    }
  }, [formData.clientName, clients]);

  const { addToast } = useUIStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFormChange = (e: { target: { name: string; value: string } } | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.documentName === 'select') {
      setValidationError("Please select a Document Name first before uploading.");
      setIsErrorModalOpen(true);
      e.target.value = ''; 
      return;
    }
    
    setSelectedFile(file);
    setUploadedUrl(null);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all entered data?")) {
      setFormData({
        centerName: 'select',
        clientName: 'select',
        documentName: 'select',
        clientIdReadonly: '',
        dateOfJoining: '',
      });
      setSelectedFile(null);
      setUploadedUrl(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (formData.clientName === 'select' && !formData.clientIdReadonly) {
      setValidationError("Please select a Client before uploading.");
      setIsErrorModalOpen(true);
      return;
    }

    if (formData.documentName === 'select') {
      setValidationError("Please select a Document Name before uploading.");
      setIsErrorModalOpen(true);
      return;
    }

    if (!selectedFile) {
      setValidationError("Please choose a file or image to upload.");
      setIsErrorModalOpen(true);
      return;
    }

    setIsUploading(true);
    try {
      const clientId = formData.clientIdReadonly || formData.clientName;
      const folderKey = formData.documentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const uploadRes = await uploadImage(selectedFile, `kyc/${clientId}/${folderKey}`);

      if (!uploadRes?.secure_url) {
        throw new Error('Upload to Cloudinary did not return a valid secure URL.');
      }

      setUploadedUrl(uploadRes.secure_url);

      // Persist document association to Supabase PostgreSQL
      if (isSupabaseConfigured() && supabase) {
        await supabase.from('documents').upsert({
          collection: 'kyc_documents',
          id: `kyc_${clientId}_${folderKey}`,
          data: {
            clientId,
            documentName: formData.documentName,
            secureUrl: uploadRes.secure_url,
            uploadedAt: new Date().toISOString(),
          },
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      addToast({
        type: 'success',
        title: 'Document Uploaded',
        message: `${formData.documentName} successfully uploaded to Cloudinary and stored in Supabase.`,
      });

      // Clear file input
      setSelectedFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setValidationError(err.message || 'Image upload failed. Please try again.');
      setIsErrorModalOpen(true);
    } finally {
      setIsUploading(false);
    }
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

  const documentOptions = [
    { value: 'select', label: '-- SELECT --' },
    { value: 'CLIENT PHOTO', label: 'CLIENT PHOTO' },
    { value: 'NOMINEE PHOTO', label: 'NOMINEE PHOTO' },
    { value: 'CLIENT WITH HOUSE PHOTO', label: 'CLIENT WITH HOUSE PHOTO' },
    { value: 'CLIENT UID FRONT', label: 'CLIENT UID FRONT' },
    { value: 'CLIENT UID BACK', label: 'CLIENT UID BACK' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 pb-10 overflow-y-auto pr-2 custom-scrollbar [&_label]:!text-[#0B1F3A] [&_label]:!font-semibold"
    >
      <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1A365D] py-4 px-6 rounded-xl shadow-md border border-[#243B55] flex items-center gap-3">
        <div className="w-2 h-8 bg-[#C9A227] rounded-full shadow-sm"></div>
        <h2 className="text-2xl font-bold font-display tracking-wide text-white">KYC Documents</h2>
      </div>

      <Card className="p-7 shadow-sm border border-[#E5E7EB]">
        <h3 className="text-[#0B1F3A] font-semibold text-lg mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#C9A227] rounded-full inline-block"></span>
          KYC Documents
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          <SearchableSelect 
            label="Center Name" 
            name="centerName" 
            value={formData.centerName} 
            onChange={handleFormChange} 
            options={centerOptions} 
          />
          <SearchableSelect 
            label="Client Name" 
            name="clientName" 
            value={formData.clientName} 
            onChange={handleFormChange} 
            options={clientOptions} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mt-6">
          <Input 
            label="Client Id" 
            name="clientIdReadonly" 
            value={formData.clientIdReadonly} 
            className="bg-[#F3F4F6] text-gray-600" 
            readOnly 
          />
          <Input 
            label="Date of Joining" 
            type="date"
            name="dateOfJoining" 
            value={formData.dateOfJoining} 
            onChange={handleFormChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mt-6">
          <Select 
            label="Document Name" 
            name="documentName" 
            value={formData.documentName} 
            onChange={handleFormChange} 
            options={documentOptions} 
          />
          <Input 
            label="Document Image" 
            type="file"
            name="documentImage"
            className="!p-1.5"
            accept="image/*,.pdf"
            onChange={handleFileChange}
          />
        </div>

        {uploadedUrl && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-4">
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-800">Uploaded to Cloudinary & Saved in Supabase</p>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-700 underline truncate block mt-0.5 hover:text-emerald-900"
              >
                {uploadedUrl}
              </a>
            </div>
            <img src={uploadedUrl} alt="Uploaded KYC" className="w-12 h-12 object-cover rounded-lg border border-emerald-300 shrink-0" />
          </div>
        )}

        <div className="flex items-center gap-4 mt-8">
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={isUploading}
            className="px-8 shadow-md hover:shadow-lg transition-all"
            icon={isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          >
            {isUploading ? 'Uploading to Cloudinary...' : 'Upload'}
          </Button>
          <Button variant="danger" onClick={handleReset} className="px-8 shadow-sm hover:shadow-md transition-all" icon={<RotateCcw size={18} />}>Reset</Button>
        </div>
      </Card>

      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title="Invalid Document"
        size="md"
      >
        <div className="p-4">
          <p className="text-red-600 font-medium mb-3">Upload Error</p>
          <p className="text-gray-700 text-sm mb-6">{validationError}</p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsErrorModalOpen(false)}>Okay</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default KycDocumentsPage;
