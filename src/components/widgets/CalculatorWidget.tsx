import React, { useState, useEffect, useCallback } from 'react';
import { Calculator as CalcIcon, Percent, IndianRupee, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export const CalculatorWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'standard' | 'finance'>('standard');
  const [financeMode, setFinanceMode] = useState<'emi' | 'si' | 'ci'>('emi');

  // -------------------------
  // STANDARD CALCULATOR LOGIC
  // -------------------------
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState(''); // Shows history like "5 + 5 ="
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [lastOperator, setLastOperator] = useState<string | null>(null);
  const [lastOperand, setLastOperand] = useState<number | null>(null);

  const formatDisplay = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 'Error';
    // Format to prevent JS float issues (like 0.30000000000000004)
    return parseFloat(num.toFixed(10)).toString();
  };

  const handleNumClick = useCallback((numStr: string) => {
    if (waitingForNewValue) {
      setDisplay(numStr);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? numStr : display + numStr);
    }
  }, [display, waitingForNewValue]);

  const handleDotClick = useCallback(() => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForNewValue]);

  const calculate = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : NaN;
      default: return b;
    }
  };

  const handleOpClick = useCallback((op: string) => {
    const currentVal = parseFloat(display);
    
    if (prevValue === null) {
      setPrevValue(currentVal);
      setEquation(`${formatDisplay(currentVal)} ${op}`);
    } else if (operator) {
      if (!waitingForNewValue) {
        const result = calculate(prevValue, currentVal, operator);
        setDisplay(formatDisplay(result));
        setPrevValue(result);
        setEquation(`${formatDisplay(result)} ${op}`);
      } else {
        // User changed operator before typing a new number
        setEquation(`${formatDisplay(prevValue)} ${op}`);
      }
    }
    
    setOperator(op);
    setLastOperator(null);
    setLastOperand(null);
    setWaitingForNewValue(true);
  }, [display, prevValue, operator, waitingForNewValue]);

  const handleEqual = useCallback(() => {
    let currentVal = parseFloat(display);
    let op = operator;
    let leftVal = prevValue;

    // Handle repeat operation (e.g. hitting = multiple times)
    if (!op && lastOperator && lastOperand !== null) {
      op = lastOperator;
      leftVal = currentVal;
      currentVal = lastOperand;
    }

    if (op && leftVal !== null) {
      const result = calculate(leftVal, currentVal, op);
      
      setEquation(`${formatDisplay(leftVal)} ${op} ${formatDisplay(currentVal)} =`);
      setDisplay(formatDisplay(result));
      setPrevValue(null);
      setOperator(null);
      setLastOperator(op);
      setLastOperand(currentVal);
      setWaitingForNewValue(true);
    }
  }, [operator, prevValue, display, lastOperator, lastOperand]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setEquation('');
    setPrevValue(null);
    setOperator(null);
    setLastOperator(null);
    setLastOperand(null);
    setWaitingForNewValue(false);
  }, []);

  const handleDelete = useCallback(() => {
    if (waitingForNewValue) return;
    setDisplay((prev) => {
      const newVal = prev.slice(0, -1);
      return (newVal === '' || newVal === '-') ? '0' : newVal;
    });
  }, [waitingForNewValue]);

  const handlePercentage = useCallback(() => {
    const currentVal = parseFloat(display);
    if (operator && prevValue !== null && (operator === '+' || operator === '-')) {
      const percentVal = (prevValue * currentVal) / 100;
      setDisplay(formatDisplay(percentVal));
    } else {
      setDisplay(formatDisplay(currentVal / 100));
    }
  }, [display, operator, prevValue]);

  const handleSignToggle = useCallback(() => {
    const currentVal = parseFloat(display);
    setDisplay(formatDisplay(currentVal * -1));
  }, [display]);

  // Keyboard Support
  useEffect(() => {
    if (activeTab !== 'standard') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      if (/[0-9]/.test(key)) handleNumClick(key);
      if (key === '.') handleDotClick();
      if (key === 'Escape') handleClear();
      if (key === 'Backspace') handleDelete();
      if (['+', '-', '*', '/'].includes(key)) handleOpClick(key);
      if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEqual();
      }
      if (key === '%') handlePercentage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handleNumClick, handleDotClick, handleClear, handleDelete, handleOpClick, handleEqual, handlePercentage]);


  // -------------------------
  // FINANCE CALCULATOR LOGIC
  // -------------------------
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('12');
  const [tenure, setTenure] = useState('60');
  const [tenureType, setTenureType] = useState<'months' | 'years'>('months');
  
  // Results
  const [emiResult, setEmiResult] = useState<number | null>(null);
  const [totalInterest, setTotalInterest] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);

  const calculateFinance = () => {
    const p = Math.abs(parseFloat(principal));
    const r = Math.abs(parseFloat(rate));
    let t = Math.abs(parseFloat(tenure));

    if (isNaN(p) || isNaN(r) || isNaN(t) || t === 0) {
      // If fields are empty, reset results
      setEmiResult(null);
      setTotalInterest(null);
      setTotalAmount(null);
      return;
    }

    if (financeMode === 'emi') {
      const months = tenureType === 'years' ? t * 12 : t;
      const monthlyRate = r / (12 * 100);
      let emi = 0;
      if (monthlyRate === 0) {
        emi = p / months;
      } else {
        emi = (p * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      }
      const totalPmt = emi * months;
      setEmiResult(Math.round(emi));
      setTotalAmount(Math.round(totalPmt));
      setTotalInterest(Math.round(totalPmt - p));
    } 
    else if (financeMode === 'si') {
      const years = tenureType === 'months' ? t / 12 : t;
      const interest = (p * r * years) / 100;
      setTotalInterest(Math.round(interest));
      setTotalAmount(Math.round(p + interest));
    }
    else if (financeMode === 'ci') {
      const years = tenureType === 'months' ? t / 12 : t;
      const amount = p * Math.pow((1 + r/100), years);
      setTotalAmount(Math.round(amount));
      setTotalInterest(Math.round(amount - p));
    }
  };

  const clearFinance = () => {
    setPrincipal('');
    setRate('');
    setTenure('');
    setEmiResult(null);
    setTotalInterest(null);
    setTotalAmount(null);
  };

  // Reset results when mode changes
  useEffect(() => {
    setEmiResult(null);
    setTotalInterest(null);
    setTotalAmount(null);
  }, [financeMode]);

  return (
    <div className="w-[min(94vw,420px)] max-w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-surface-muted overflow-hidden flex flex-col font-body">
      {/* Header Tabs */}
      <div className="flex p-1.5 bg-[#F8F9FA] border-b border-surface-muted m-2 rounded-xl">
        <button
          onClick={() => setActiveTab('standard')}
          className={clsx(
            "flex-1 py-2 min-h-[40px] text-[13px] font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'standard' ? "bg-white shadow-sm text-gold-600 border border-black/5" : "text-rich-silver hover:text-rich-black"
          )}
        >
          <CalcIcon size={14} /> Standard
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={clsx(
            "flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2",
            activeTab === 'finance' ? "bg-white shadow-sm text-gold-600 border border-black/5" : "text-rich-silver hover:text-rich-black"
          )}
        >
          <Percent size={14} /> Finance
        </button>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* STANDARD CALCULATOR UI */}
          {activeTab === 'standard' && (
            <motion.div
              key="standard"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-4 flex flex-col bg-white min-h-[440px]"
            >
              {/* Display Area */}
              <div className="bg-[#F8F9FA] rounded-xl p-4 mb-5 flex-none border border-surface-muted shadow-inner relative overflow-hidden flex flex-col justify-end min-h-[90px]">
                <div className="text-right text-xs text-rich-silver font-medium h-5 tracking-wider mb-1">
                  {equation}
                </div>
                <div 
                  className={clsx(
                    "text-right font-sans font-semibold text-rich-black tabular-nums tracking-tight text-ellipsis overflow-hidden",
                    display.length > 12 ? 'text-2xl' : 'text-4xl'
                  )}
                >
                  {display}
                </div>
              </div>
              
              {/* Keypad */}
              <div className="grid grid-cols-4 gap-2.5 flex-1">
                {/* Row 1 */}
                <CalcBtn onClick={handleClear} className="bg-[#FFF1F2] text-[#E11D48] hover:bg-[#FFE4E6] font-bold">AC</CalcBtn>
                <CalcBtn onClick={handleSignToggle} className="bg-gray-50 text-gray-700 hover:bg-gray-100 font-medium">±</CalcBtn>
                <CalcBtn onClick={handlePercentage} className="bg-gray-50 text-gray-700 hover:bg-gray-100 font-medium">%</CalcBtn>
                <CalcBtn onClick={() => handleOpClick('/')} className={clsx("font-bold text-lg", operator === '/' && waitingForNewValue ? "bg-gold-600 text-white" : "bg-gold-50 text-gold-600 hover:bg-gold-100")}>÷</CalcBtn>
                
                {/* Row 2 */}
                <CalcBtn onClick={() => handleNumClick('7')}>7</CalcBtn>
                <CalcBtn onClick={() => handleNumClick('8')}>8</CalcBtn>
                <CalcBtn onClick={() => handleNumClick('9')}>9</CalcBtn>
                <CalcBtn onClick={() => handleOpClick('*')} className={clsx("font-bold text-lg", operator === '*' && waitingForNewValue ? "bg-gold-600 text-white" : "bg-gold-50 text-gold-600 hover:bg-gold-100")}>×</CalcBtn>
                
                {/* Row 3 */}
                <CalcBtn onClick={() => handleNumClick('4')}>4</CalcBtn>
                <CalcBtn onClick={() => handleNumClick('5')}>5</CalcBtn>
                <CalcBtn onClick={() => handleNumClick('6')}>6</CalcBtn>
                <CalcBtn onClick={() => handleOpClick('-')} className={clsx("font-bold text-lg", operator === '-' && waitingForNewValue ? "bg-gold-600 text-white" : "bg-gold-50 text-gold-600 hover:bg-gold-100")}>−</CalcBtn>
                
                {/* Row 4 */}
                <CalcBtn onClick={() => handleNumClick('1')}>1</CalcBtn>
                <CalcBtn onClick={() => handleNumClick('2')}>2</CalcBtn>
                <CalcBtn onClick={() => handleNumClick('3')}>3</CalcBtn>
                <CalcBtn onClick={() => handleOpClick('+')} className={clsx("font-bold text-lg", operator === '+' && waitingForNewValue ? "bg-gold-600 text-white" : "bg-gold-50 text-gold-600 hover:bg-gold-100")}>+</CalcBtn>
                
                {/* Row 5 */}
                <CalcBtn onClick={() => handleNumClick('0')} className="col-span-2">0</CalcBtn>
                <CalcBtn onClick={handleDotClick}>.</CalcBtn>
                <CalcBtn onClick={handleEqual} className="bg-gold-600 text-white hover:bg-gold-700 shadow-md font-bold text-xl">=</CalcBtn>
              </div>
            </motion.div>
          )}

          {/* FINANCE CALCULATOR UI */}
          {activeTab === 'finance' && (
            <motion.div
              key="finance"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="p-5 flex flex-col bg-white"
            >
              {/* Finance Mode Selector */}
              <div className="flex bg-surface-cream rounded-lg p-1 mb-5">
                {[
                  { id: 'emi', label: 'EMI' },
                  { id: 'si', label: 'Simple Int.' },
                  { id: 'ci', label: 'Comp. Int.' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setFinanceMode(mode.id as any)}
                    className={clsx(
                      "flex-1 text-[11px] font-bold py-1.5 rounded-md uppercase tracking-wide transition-all",
                      financeMode === mode.id ? "bg-white text-gold-700 shadow-sm" : "text-rich-silver hover:text-rich-black"
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-rich-silver mb-1.5 uppercase tracking-wide">
                    Principal Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    placeholder="e.g. 100000"
                    className="w-full px-3 py-2.5 bg-[#F8F9FA] border border-surface-muted rounded-xl text-sm font-semibold text-rich-black focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all placeholder:font-normal"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rich-silver mb-1.5 uppercase tracking-wide">
                    Interest Rate (% P.A.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full px-3 py-2.5 bg-[#F8F9FA] border border-surface-muted rounded-xl text-sm font-semibold text-rich-black focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all placeholder:font-normal"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-[11px] font-bold text-rich-silver uppercase tracking-wide">
                      Tenure
                    </label>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                      <button 
                        onClick={() => setTenureType('months')}
                        className={clsx("px-2 py-0.5 rounded transition-colors", tenureType === 'months' ? "bg-gold-100 text-gold-700" : "text-rich-silver hover:text-rich-black")}
                      >Months</button>
                      <button 
                        onClick={() => setTenureType('years')}
                        className={clsx("px-2 py-0.5 rounded transition-colors", tenureType === 'years' ? "bg-gold-100 text-gold-700" : "text-rich-silver hover:text-rich-black")}
                      >Years</button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={tenure}
                    onChange={(e) => setTenure(e.target.value)}
                    placeholder={tenureType === 'months' ? "e.g. 60" : "e.g. 5"}
                    className="w-full px-3 py-2.5 bg-[#F8F9FA] border border-surface-muted rounded-xl text-sm font-semibold text-rich-black focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all placeholder:font-normal"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-5">
                <button
                  onClick={clearFinance}
                  className="p-2.5 bg-surface-cream text-rich-silver hover:text-rich-black hover:bg-surface-muted rounded-xl transition-colors"
                  title="Reset fields"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={calculateFinance}
                  className="flex-1 py-2.5 bg-gold-600 text-white text-[13px] font-bold uppercase tracking-wider rounded-xl hover:bg-gold-700 transition-colors shadow-md shadow-gold-600/20 active:scale-[0.98]"
                >
                  Calculate
                </button>
              </div>

              {/* Results Area */}
              {totalAmount !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-gradient-to-br from-gold-50 to-white border border-gold-100 rounded-2xl shadow-sm"
                >
                  {financeMode === 'emi' && emiResult !== null && (
                    <div className="mb-3 pb-3 border-b border-gold-200/50">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-gold-600 mb-1">Monthly EMI</p>
                      <p className="text-3xl font-sans font-bold text-gold-800 tabular-nums tracking-tight">
                        ₹{emiResult.toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between items-center gap-4">
                     <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-rich-silver mb-0.5">Total Interest</p>
                        <p className="text-sm font-sans font-bold text-rich-black tabular-nums tracking-tight">
                          ₹{totalInterest?.toLocaleString('en-IN')}
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-rich-silver mb-0.5">Total Payment</p>
                        <p className="text-sm font-sans font-bold text-rich-black tabular-nums tracking-tight">
                          ₹{totalAmount?.toLocaleString('en-IN')}
                        </p>
                     </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface CalcBtnProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const CalcBtn: React.FC<CalcBtnProps> = ({ children, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={clsx(
      "flex items-center justify-center rounded-xl text-xl min-h-[44px] transition-all active:scale-95 active:shadow-inner cursor-pointer",
      className.includes('bg-') ? className : "bg-white border border-surface-muted text-rich-black hover:bg-[#F8F9FA] hover:border-gray-300 shadow-sm font-medium",
      className
    )}
  >
    {children}
  </button>
);
