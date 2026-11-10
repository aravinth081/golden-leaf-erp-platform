// ──────────────────────────────────────────────────
// Golden Leaf Finance — Forgot Password Page
// ──────────────────────────────────────────────────

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResetForm = z.infer<typeof resetSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (_data: ResetForm) => {
    setIsSubmitting(true);
    // Simulate instant dispatch
    setTimeout(() => {
      setIsSuccess(true);
      setIsSubmitting(false);
    }, 400);
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-4"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-md">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold text-[#0A1628]">Check Your Email</h2>
        <p className="mt-2 text-sm text-[#6B7280] font-body leading-relaxed max-w-sm mx-auto">
          If an account exists with that email, we&apos;ve sent a secure password reset link.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm text-[#D4A017] font-semibold hover:underline"
        >
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#0A1628] font-medium mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Login
      </Link>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-display font-bold text-[#0A1628] mb-2 tracking-tight">
          Reset Password
        </h2>
        <p className="text-[14px] text-[#6B7280] font-body">
          Enter your registered email to receive a recovery link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#0A1628] mb-1.5 font-body">
            Email Address
          </label>
          <div className="relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#D4A017] transition-colors">
              <Mail size={18} />
            </span>
            <input
              type="email"
              placeholder="user@goldenleaf.finance"
              {...register('email')}
              className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] rounded-[10px] text-[#111827] placeholder-[#9CA3AF] font-body text-sm focus:outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20 transition-all duration-200 shadow-sm"
            />
          </div>
          <AnimatePresence>
            {errors.email?.message && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1.5 text-xs text-red-500 font-body flex items-center gap-1"
              >
                <AlertTriangle size={12} /> {errors.email.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.98 }}
          className="w-full relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4A017] via-[#E8B923] to-[#D4A017] hover:from-[#C49415] hover:via-[#D9AD20] hover:to-[#C49415] text-white font-body font-bold text-[15px] py-3.5 rounded-[10px] transition-all duration-200 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_6px_20px_rgba(212,160,23,0.35)] cursor-pointer"
        >
          {isSubmitting ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>Send Reset Link</span>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ForgotPasswordPage;
