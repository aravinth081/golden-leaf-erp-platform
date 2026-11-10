// ──────────────────────────────────────────────────
// Golden Leaf Finance — GPS + Selfie Attendance Capture
// Full-screen mobile-first modal for punch-in/punch-out
// Steps: 1) GPS → 2) Selfie → 3) Confirm
// ──────────────────────────────────────────────────

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Camera, CheckCircle2, AlertTriangle, X,
  Navigation, RefreshCw, Clock, User, Building2,
  Loader2, ShieldAlert, ChevronRight, Aperture
} from 'lucide-react';
import type { GPSLocation } from '../../services/gpsAttendanceService';

interface AttendanceCaptureProps {
  mode: 'punch_in' | 'punch_out';
  employeeName: string;
  branchName: string;
  onComplete: (data: { gps: GPSLocation; selfie: string; withinGeofence: boolean }) => void;
  onCancel?: () => void;
  branchLat?: number;
  branchLng?: number;
  geofenceRadius?: number;
}

type Step = 'gps' | 'selfie' | 'confirm';

export const AttendanceCapture: React.FC<AttendanceCaptureProps> = ({
  mode,
  employeeName,
  branchName,
  onComplete,
  onCancel,
  branchLat,
  branchLng,
  geofenceRadius = 200,
}) => {
  const [step, setStep] = useState<Step>('gps');

  // GPS State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | null>(null);
  const [distanceFromBranch, setDistanceFromBranch] = useState<number | null>(null);
  const [withinGeofence, setWithinGeofence] = useState(true);

  // Selfie State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── GPS CAPTURE ──
  const captureGPS = useCallback(() => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        // Try reverse geocoding
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              address = data.display_name;
            }
          }
        } catch {
          // Use raw coordinates as fallback
        }

        const loc: GPSLocation = { lat: latitude, lng: longitude, address, accuracy: Math.round(accuracy) };
        setGpsLocation(loc);

        // Calculate distance from branch
        if (branchLat && branchLng) {
          const R = 6371000;
          const dLat = (branchLat - latitude) * (Math.PI / 180);
          const dLon = (branchLng - longitude) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(latitude * (Math.PI / 180)) * Math.cos(branchLat * (Math.PI / 180)) *
            Math.sin(dLon / 2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          setDistanceFromBranch(Math.round(dist));
          setWithinGeofence(dist <= geofenceRadius);
        }

        setGpsLoading(false);
      },
      (error) => {
        let msg = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission denied. Please enable GPS in your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Location unavailable. Please ensure GPS is enabled on your device.';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out. Please try again.';
            break;
        }
        setGpsError(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [branchLat, branchLng, geofenceRadius]);

  // Auto-capture GPS on mount
  useEffect(() => {
    if (step === 'gps' && !gpsLocation) {
      captureGPS();
    }
  }, [step, gpsLocation, captureGPS]);

  // ── CAMERA ──
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Failed to access camera. Please try again.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const captureSelfie = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror for front camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setSelfieData(dataUrl);
    stopCamera();
  }, [stopCamera]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  // Auto-start camera when reaching selfie step
  useEffect(() => {
    if (step === 'selfie' && !selfieData) {
      startCamera();
    }
  }, [step, selfieData, startCamera]);

  // ── SUBMIT ──
  const handleConfirm = () => {
    if (!gpsLocation || !selfieData) return;
    onComplete({ gps: gpsLocation, selfie: selfieData, withinGeofence });
  };

  const isPunchIn = mode === 'punch_in';
  const title = isPunchIn ? 'Punch In — Mark Attendance' : 'Punch Out — End of Day';
  const now = new Date();

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-body">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-white rounded-2xl border border-[#E5E7EB] w-[min(94vw,520px)] max-w-full overflow-hidden shadow-2xl max-h-[90dvh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#0B1F3A] px-5 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-1.5 h-4 rounded-full ${isPunchIn ? 'bg-[#D4AF37]' : 'bg-emerald-400'}`} />
            <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider flex-shrink-0">
          <span className={`flex items-center gap-1 ${step === 'gps' ? 'text-[#D4AF37]' : gpsLocation ? 'text-emerald-600' : 'text-gray-400'}`}>
            <MapPin size={12} /> GPS
          </span>
          <ChevronRight size={12} className="text-gray-300" />
          <span className={`flex items-center gap-1 ${step === 'selfie' ? 'text-[#D4AF37]' : selfieData ? 'text-emerald-600' : 'text-gray-400'}`}>
            <Camera size={12} /> Selfie
          </span>
          <ChevronRight size={12} className="text-gray-300" />
          <span className={`flex items-center gap-1 ${step === 'confirm' ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
            <CheckCircle2 size={12} /> Confirm
          </span>
        </div>

        {/* Employee Info Strip */}
        <div className="px-5 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <User size={12} className="text-[#D4AF37]" />
            <span className="font-bold text-[#0B1F3A]">{employeeName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={12} className="text-gray-400" />
            <span className="text-gray-600">{branchName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-gray-400" />
            <span className="font-mono text-gray-700">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: GPS ── */}
            {step === 'gps' && (
              <motion.div key="gps" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-3">
                    <Navigation size={24} className="text-blue-600" />
                  </div>
                  <h4 className="font-bold text-[#0B1F3A] text-sm">Capturing Your Location</h4>
                  <p className="text-gray-500 text-xs mt-1">We need your GPS location to verify your attendance</p>
                </div>

                {gpsLoading && (
                  <div className="flex flex-col items-center py-8 gap-3">
                    <Loader2 size={32} className="text-[#D4AF37] animate-spin" />
                    <span className="text-xs text-gray-500 font-semibold">Acquiring GPS signal...</span>
                  </div>
                )}

                {gpsError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    <div className="flex items-start gap-2">
                      <ShieldAlert size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
                      <div>
                        <p className="font-bold">Location Access Required</p>
                        <p className="mt-1 leading-relaxed">{gpsError}</p>
                      </div>
                    </div>
                    <button
                      onClick={captureGPS}
                      className="mt-3 w-full py-2.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} /> Retry GPS Capture
                    </button>
                  </div>
                )}

                {gpsLocation && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                        <CheckCircle2 size={14} />
                        Location Captured Successfully
                      </div>
                      <p className="text-[11px] text-emerald-600 leading-relaxed truncate" title={gpsLocation.address}>
                        {gpsLocation.address}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
                        <span>Lat: {gpsLocation.lat.toFixed(6)}</span>
                        <span>Lng: {gpsLocation.lng.toFixed(6)}</span>
                        <span>±{gpsLocation.accuracy}m</span>
                      </div>
                    </div>

                    {distanceFromBranch !== null && (
                      <div className={`p-3 rounded-xl border text-xs ${
                        withinGeofence
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        <div className="flex items-center gap-2 font-bold">
                          {withinGeofence ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                          {withinGeofence
                            ? `Within branch location (${distanceFromBranch}m away)`
                            : `Outside branch location (${distanceFromBranch}m away, limit: ${geofenceRadius}m)`
                          }
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setStep('selfie')}
                      className="w-full py-3.5 min-h-[44px] rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Continue to Selfie <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 2: SELFIE ── */}
            {step === 'selfie' && (
              <motion.div key="selfie" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {!selfieData ? (
                  <>
                    <div className="text-center">
                      <h4 className="font-bold text-[#0B1F3A] text-sm">Take a Live Selfie</h4>
                      <p className="text-gray-500 text-xs mt-1">Position your face within the frame and capture</p>
                    </div>

                    {cameraError && (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                        <div className="flex items-start gap-2">
                          <ShieldAlert size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
                          <div>
                            <p className="font-bold">Camera Access Required</p>
                            <p className="mt-1">{cameraError}</p>
                          </div>
                        </div>
                        <button
                          onClick={startCamera}
                          className="mt-3 w-full py-2.5 min-h-[44px] rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RefreshCw size={14} /> Retry Camera
                        </button>
                      </div>
                    )}

                    {/* Camera Preview */}
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      {/* Face guide overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-40 h-52 sm:w-48 sm:h-60 rounded-[50%] border-2 border-white/40 border-dashed" />
                      </div>
                      {!cameraActive && !cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                          <Loader2 size={32} className="text-[#D4AF37] animate-spin" />
                        </div>
                      )}
                    </div>

                    {cameraActive && (
                      <button
                        onClick={captureSelfie}
                        className="w-full py-3.5 min-h-[44px] rounded-xl bg-[#0B1F3A] hover:bg-[#142B4E] text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Aperture size={16} /> Capture Selfie
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <h4 className="font-bold text-[#0B1F3A] text-sm">Selfie Captured</h4>
                      <p className="text-gray-500 text-xs mt-1">Review your photo below</p>
                    </div>

                    <div className="relative rounded-xl overflow-hidden aspect-[4/3] border border-[#E5E7EB]">
                      <img src={selfieData} alt="Selfie" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 size={10} /> Captured
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelfieData(null);
                          startCamera();
                        }}
                        className="flex-1 py-3 min-h-[44px] rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0B1F3A] font-bold text-xs border border-[#E5E7EB] transition-colors cursor-pointer"
                      >
                        Retake
                      </button>
                      <button
                        onClick={() => setStep('confirm')}
                        className="flex-1 py-3 min-h-[44px] rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Continue <ChevronRight size={14} />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ── STEP 3: CONFIRM ── */}
            {step === 'confirm' && gpsLocation && selfieData && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-[#0B1F3A] text-sm">Confirm {isPunchIn ? 'Punch In' : 'Punch Out'}</h4>
                  <p className="text-gray-500 text-xs mt-1">Review the details below and confirm</p>
                </div>

                {/* Summary Card */}
                <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                  <div className="grid grid-cols-3 gap-0">
                    {/* Selfie Thumbnail */}
                    <div className="aspect-square">
                      <img src={selfieData} alt="Selfie" className="w-full h-full object-cover" />
                    </div>
                    {/* Details */}
                    <div className="col-span-2 p-3 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User size={11} className="text-[#D4AF37]" />
                        <span className="font-bold text-[#0B1F3A]">{employeeName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 size={11} className="text-gray-400" />
                        <span className="text-gray-600">{branchName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-gray-400" />
                        <span className="font-mono font-bold text-[#0B1F3A]">
                          {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-gray-400" />
                        <span className="text-gray-600 text-[10px] truncate" title={gpsLocation.address}>
                          {gpsLocation.address.slice(0, 50)}{gpsLocation.address.length > 50 ? '...' : ''}
                        </span>
                      </div>
                      {distanceFromBranch !== null && (
                        <div className="flex items-center gap-1.5">
                          <Navigation size={11} className={withinGeofence ? 'text-emerald-500' : 'text-amber-500'} />
                          <span className={`font-bold text-[10px] ${withinGeofence ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {withinGeofence ? '✓ Within branch' : '⚠ Outside branch'} ({distanceFromBranch}m)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!withinGeofence && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-start gap-2">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <p>Your location is outside the branch geofence. This will be flagged in attendance reports.</p>
                  </div>
                )}

                <button
                  onClick={handleConfirm}
                  className={`w-full py-3.5 min-h-[44px] rounded-xl text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isPunchIn
                      ? 'bg-[#D4AF37] hover:bg-[#C9A227]'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  {isPunchIn ? 'Confirm Punch In' : 'Confirm Punch Out'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden canvas for selfie capture */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
};

export default AttendanceCapture;
