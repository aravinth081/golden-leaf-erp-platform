import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, RotateCcw, Loader2, MapPin } from 'lucide-react';
import { createCenter } from '../../services/centerService';

const LocateCenterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    centerName: '',
    latitude: '',
    longitude: '',
    centerLeader: '',
    mobileNumber: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      centerName: '',
      latitude: '',
      longitude: '',
      centerLeader: '',
      mobileNumber: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.centerName) {
      alert("Please enter Center Name before submitting.");
      return;
    }
    
    setLoading(true);
    try {
      await createCenter({
        name: formData.centerName,
        latitude: formData.latitude,
        longitude: formData.longitude,
        leader: formData.centerLeader,
        mobileNumber: formData.mobileNumber,
      });
      alert('Center data saved successfully!');
      handleReset();
    } catch (error) {
      console.error('Error saving center data:', error);
      alert('Failed to save center data to database.');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = () => {
    // Get current location if latitude/longitude are empty
    if (!formData.latitude || !formData.longitude) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setFormData((prev) => ({
              ...prev,
              latitude: latitude.toString(),
              longitude: longitude.toString(),
            }));
            const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
            window.open(mapUrl, '_blank');
          },
          (error) => {
            console.error('Error getting location:', error);
            alert('Unable to retrieve your location.');
          }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
      }
    } else {
      // Use existing lat/lng
      const mapUrl = `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`;
      window.open(mapUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full w-full min-w-0 max-w-full pb-16"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_10px_rgba(11,31,58,0.04)] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#0B1F3A] px-4 sm:px-8 py-4 border-b border-[#E5E7EB]/10 flex items-center gap-3">
          <div className="w-1 h-4 bg-[#D4AF37] rounded-full shrink-0"></div>
          <h2 className="text-sm font-body font-semibold text-[#FFFFFF] tracking-wide uppercase">
            Locate Center
          </h2>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            
            {/* Center Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">
                Center Name
              </label>
              <input
                type="text"
                name="centerName"
                value={formData.centerName}
                onChange={handleChange}
                placeholder="Enter center name..."
                className="w-full px-3.5 py-2.5 sm:py-3.5 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] placeholder:text-[#9CA3AF] font-body text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/50 shadow-sm"
              />
            </div>

            {/* Latitude */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">
                Latitude
              </label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="Enter latitude..."
                className="w-full px-3.5 py-2.5 sm:py-3.5 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] placeholder:text-[#9CA3AF] font-body text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/50 shadow-sm"
              />
            </div>

            {/* Longitude */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">
                Longitude
              </label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="Enter longitude..."
                className="w-full px-3.5 py-2.5 sm:py-3.5 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] placeholder:text-[#9CA3AF] font-body text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/50 shadow-sm"
              />
            </div>

            {/* Center Leader */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">
                Center Leader
              </label>
              <input
                type="text"
                name="centerLeader"
                value={formData.centerLeader}
                onChange={handleChange}
                placeholder="Enter center leader..."
                className="w-full px-3.5 py-2.5 sm:py-3.5 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] placeholder:text-[#9CA3AF] font-body text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/50 shadow-sm"
              />
            </div>

            {/* Mobile Number */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">
                Mobile Number
              </label>
              <input
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="Enter mobile no..."
                className="w-full px-3.5 py-2.5 sm:py-3.5 rounded-[10px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B1F3A] placeholder:text-[#9CA3AF] font-body text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] hover:border-[#D4AF37]/50 shadow-sm"
              />
            </div>

            {/* Locate Center Map Icon */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#0B1F3A] font-body tracking-wide uppercase">
                Locate Center
              </label>
              <div 
                className="cursor-pointer inline-flex items-center justify-center w-[54px] h-[54px] bg-[#FFFFFF] border border-[#E5E7EB] rounded-[10px] shadow-sm hover:shadow-md hover:border-[#D4AF37]/50 transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] overflow-hidden min-h-[44px] min-w-[44px] touch-target group"
                onClick={handleMapClick}
                title="Open Google Maps"
              >
                <img 
                  src="/images/google-maps.svg" 
                  alt="Google Maps" 
                  className="w-[85%] h-[85%] object-contain drop-shadow-sm scale-[1.15] transition-transform duration-200 group-hover:scale-[1.25]"
                  onError={(e) => {
                    const parent = e.currentTarget.parentElement;
                    e.currentTarget.remove();
                    if (parent) {
                      const icon = document.createElement('div');
                      icon.innerHTML = '📍';
                      icon.style.fontSize = '26px';
                      parent.appendChild(icon);
                    }
                  }}
                />
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 sm:py-3.5 rounded-[10px] bg-[#D4AF37] text-[#FFFFFF] font-semibold text-xs sm:text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#C9A227] font-body min-w-[140px] shadow-sm hover:shadow-md min-h-[44px] touch-target"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {loading ? 'Submitting...' : 'Submit'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 sm:py-3.5 rounded-[10px] bg-[#F8F9FA] text-[#0B1F3A] font-semibold text-xs sm:text-sm border border-[#E5E7EB] hover:bg-[#E5E7EB]/50 transition-all duration-200 font-body min-w-[140px] min-h-[44px] touch-target"
            >
              <RotateCcw size={18} />
              Reset
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LocateCenterPage;
