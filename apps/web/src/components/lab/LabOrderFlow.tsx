'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Image as ImageIcon,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

interface OrderData {
  clothingType: string | null;
  size: string | null;
  colorChoice: string | null;
  customColor: string | null;
  placement: string | null;
  description: string;
  attachment: File | null;
  phoneRaw: string; // 11 digits starting with "7"
  address: string;
}

// Clothing types with images
const CLOTHING_TYPES = [
  { id: 'hoodie', label: 'Худи', image: '/assets/placements/front.png' },
  { id: 'custom', label: 'Своё', icon: '✨' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Limited colors: black, white, gray (circles only, no images)
const COLORS = [
  { id: 'black', label: 'Черный', value: '#000000' },
  { id: 'white', label: 'Белый', value: '#FFFFFF' },
  { id: 'gray', label: 'Серый', value: '#808080' },
];

// Placement options with images
const PLACEMENTS = [
  { id: 'front', label: 'Фронт', image: '/assets/placements/front.png' },
  { id: 'back', label: 'Спина', image: '/assets/placements/back.png' },
  { id: 'sleeve', label: 'Рукав', image: '/assets/placements/sleeve.png' },
  { id: 'individual', label: 'Индивидуально', image: '/assets/placements/individual.png' },
];

const STEP_LABELS = [
  'Выбор одежды',
  'Размер',
  'Цвет базы',
  'Место кастома',
  'Доставка',
  'Описание и файл',
];

// Phone input helper: extract and normalize 10 digits after +7
function extractPhoneDigits(input: string): string {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '');
  
  // If starts with 7 or 8, drop first digit and keep last 10
  if (digits.length > 0 && (digits[0] === '7' || digits[0] === '8')) {
    return digits.slice(1, 11);
  }
  
  // Otherwise just take first 10 digits
  return digits.slice(0, 10);
}

interface LabOrderFlowProps {
  onComplete: (data: OrderData) => void;
  onProgressChange?: (progress: {
    currentStep: number;
    totalSteps: number;
    stepLabels: string[];
    isStepVisible: (index: number) => boolean;
    onBack: () => void;
  }) => void;
  onExit?: () => void;
}


export function LabOrderFlow({ onComplete, onProgressChange, onExit }: LabOrderFlowProps): JSX.Element {
  const [orderData, setOrderData] = useState<OrderData>({
    clothingType: null, // Start fresh - user must select on step 1
    size: null,
    colorChoice: null,
    customColor: null,
    placement: null,
    description: '',
    attachment: null,
    phoneRaw: '', // 11 digits starting with "7"
    address: '',
  });
  const [currentStep, setCurrentStep] = useState(0); // Track current step for single-step view
  const [customBaseDescription, setCustomBaseDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step validation (used for enabling next button on delivery step)

  // Navigation functions for single-step wizard
  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 5)); // Max step is 5 (index 0-5)
  }, []);

  const goBack = useCallback(() => {
    if (currentStep === 0) {
      // Exit wizard if on step 0 (first step)
      if (onExit) {
        onExit();
      }
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, onExit]);

  // Notify parent about progress changes
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange({
        currentStep: currentStep + 1, // 1-indexed for display
        totalSteps: 6,
        stepLabels: STEP_LABELS,
        isStepVisible: () => true, // Not used in single-step view
        onBack: goBack,
      });
    }
  }, [currentStep, onProgressChange, goBack]);

  const handleStepComplete = (stepIndex: number, value: string | null) => {
    // Haptic feedback
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch { /* noop */ }

    // Update order data and advance to next step
    if (stepIndex === 0) {
      setOrderData((prev) => ({ ...prev, clothingType: value }));
      goNext();
    } else if (stepIndex === 1) {
      setOrderData((prev) => ({ ...prev, size: value }));
      goNext();
    } else if (stepIndex === 2) {
      setOrderData((prev) => ({ ...prev, colorChoice: value }));
      goNext();
    } else if (stepIndex === 3) {
      setOrderData((prev) => ({ ...prev, placement: value }));
      goNext();
    }
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
      if (validTypes.includes(file.type)) {
        setOrderData((prev) => ({ ...prev, attachment: file }));
      }
    }
  };

  const handleRemoveFile = () => {
    setOrderData((prev) => ({ ...prev, attachment: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');
    } catch { /* noop */ }
    setIsSubmitted(true);
    setTimeout(() => {
      onComplete(orderData);
    }, 2000);
  };

  const handleBackToLab = () => {
    onComplete(orderData);
  };

  // Success screen
  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-[600px] text-center space-y-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 mx-auto rounded-full bg-white/10 backdrop-blur-xl 
                     border border-white/20 flex items-center justify-center"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>

          <div>
            <h2 className="text-[clamp(28px,7vw,40px)] font-bold text-white mb-4">Принято.</h2>
            <p className="text-[clamp(16px,4vw,18px)] text-white/75 leading-relaxed">
              Мы посмотрим заявку и напишем тебе с уточнениями.
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleBackToLab}
            className="w-full rounded-full px-6 py-4 text-base font-medium
                     bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.3)] 
                     hover:bg-white/90 transition-colors"
          >
            Вернуться в LAB
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Render step content helper
  const renderStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">Что кастомим?</h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">
                Выбери базу — остальное мы доведём до идеала.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {CLOTHING_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <motion.button
                    key={type.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStepComplete(0, type.id)}
                    className={`rounded-[20px] p-6 bg-black/30 backdrop-blur-xl border transition-all
                              ${orderData.clothingType === type.id
                                ? 'border-white/30 bg-white/10 shadow-[0_8px_24px_rgba(255,255,255,0.1)]'
                                : 'border-white/10 hover:border-white/20 hover:bg-black/35'
                              }`}
                  >
                    {type.image ? (
                      <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-3 relative">
                        <Image
                          src={type.image}
                          alt={type.label}
                          fill
                          className="object-contain"
                          sizes="112px"
                        />
                      </div>
                    ) : (
                      Icon && <div className="text-4xl mb-3">{Icon}</div>
                    )}
                    <div className="text-white font-medium text-base">{type.label}</div>
                  </motion.button>
                );
              })}
            </div>
            {orderData.clothingType === 'custom' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <textarea
                  value={customBaseDescription}
                  onChange={(e) => setCustomBaseDescription(e.target.value)}
                  placeholder="Опиши базу..."
                  className="w-full min-h-[100px] rounded-[16px] p-4 bg-black/30 backdrop-blur-xl
                           border border-white/10 text-white placeholder-white/40
                           focus:outline-none focus:border-white/30 focus:bg-black/35
                           resize-none text-sm"
                />
              </motion.div>
            )}
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">Размер</h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">Чтобы посадка была в точку.</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {SIZES.map((size) => (
                <motion.button
                  key={size}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStepComplete(1, size)}
                  className={`rounded-full px-6 py-3 text-base font-medium transition-all
                            ${orderData.size === size
                              ? 'bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.3)]'
                              : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                            }`}
                >
                  {size}
                </motion.button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">Цвет базы</h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">Подберём под стиль и идею.</p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {COLORS.map((color) => (
                <div key={color.id} className="flex flex-col items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStepComplete(2, color.id)}
                    className={`relative rounded-full w-16 h-16 flex items-center justify-center
                              transition-all border-2
                              ${orderData.colorChoice === color.id
                                ? 'border-white shadow-[0_0_0_4px_rgba(255,255,255,0.2)] scale-105'
                                : 'border-white/20 hover:border-white/40'
                              }`}
                    style={{ backgroundColor: color.value }}
                  >
                    {orderData.colorChoice === color.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Check className="w-6 h-6 text-white drop-shadow-lg" />
                      </motion.div>
                    )}
                  </motion.button>
                  <span className="text-white/70 text-sm">{color.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">Где будет кастом?</h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">
                Фронт, спина, рукав — или по твоей схеме.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {PLACEMENTS.map((placement) => (
                <motion.button
                  key={placement.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleStepComplete(3, placement.id)}
                  className={`rounded-[20px] p-6 bg-black/30 backdrop-blur-xl border transition-all
                            ${orderData.placement === placement.id
                              ? 'border-white/30 bg-white/10 shadow-[0_8px_24px_rgba(255,255,255,0.1)]'
                              : 'border-white/10 hover:border-white/20 hover:bg-black/35'
                            }`}
                >
                  {placement.image && (
                    <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-3 relative">
                      <Image
                        src={placement.image}
                        alt={placement.label}
                        fill
                        className="object-contain"
                        sizes="112px"
                      />
                    </div>
                  )}
                  <div className="text-white font-medium text-base">{placement.label}</div>
                </motion.button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">Доставка</h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">
                Укажи номер телефона и адрес доставки
              </p>
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <label className="block text-white/70 text-sm font-medium">Телефон</label>
              <input
                type="tel"
                value={`+7 ${orderData.phoneRaw.length > 0 ? orderData.phoneRaw.slice(1) : ''}`}
                onChange={(e) => {
                  const newDigits = extractPhoneDigits(e.target.value);
                  // Limit to 10 digits
                  const limitedDigits = newDigits.slice(0, 10);
                  // Always update phoneRaw as "7" + 10 digits
                  const phoneRaw = limitedDigits.length > 0 ? '7' + limitedDigits : '';
                  setOrderData((prev) => ({ ...prev, phoneRaw }));
                }}
                placeholder="+7 999 999 99 99"
                className="w-full rounded-[16px] p-4 bg-black/30 backdrop-blur-xl
                         border border-white/10 text-white placeholder-white/40
                         focus:outline-none focus:border-white/30 focus:bg-black/35
                         text-[clamp(14px,3.5vw,16px)]"
              />
              {orderData.phoneRaw.length > 0 && !(orderData.phoneRaw.length === 11 && orderData.phoneRaw.startsWith('7')) && (
                <p className="text-red-400 text-sm">Номер должен содержать 11 цифр</p>
              )}
            </div>

            {/* Address Input */}
            <div className="space-y-2">
              <label className="block text-white/70 text-sm font-medium">
                Адрес доставки <span className="text-red-400">*</span>
              </label>
              <textarea
                value={orderData.address}
                onChange={(e) => setOrderData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Введите адрес доставки"
                className="w-full min-h-[100px] rounded-[16px] p-4 bg-black/30 backdrop-blur-xl
                         border border-white/10 text-white placeholder-white/40
                         focus:outline-none focus:border-white/30 focus:bg-black/35
                         resize-none text-[clamp(14px,3.5vw,16px)]"
                required
              />
              {orderData.address.trim().length > 0 && orderData.address.trim().length < 5 && (
                <p className="text-red-400 text-sm">Адрес должен содержать минимум 5 символов</p>
              )}
            </div>

            {/* Next Button */}
            {orderData.phoneRaw.length === 11 && orderData.phoneRaw.startsWith('7') && orderData.address.trim().length >= 5 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={goNext}
                className="w-full rounded-full px-6 py-4 text-base font-medium
                         bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.3)] 
                         hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                Продолжить
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">Коротко про идею</h3>
            </div>
            <textarea
              value={orderData.description}
              onChange={(e) => setOrderData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Настроение, символы, цвета, референсы… Можно одним предложением."
              className="w-full min-h-[200px] rounded-[20px] p-6 bg-black/30 backdrop-blur-xl
                       border border-white/10 text-white placeholder-white/40
                       focus:outline-none focus:border-white/30 focus:bg-black/35
                       resize-none text-[clamp(14px,3.5vw,16px)]"
            />
            <p className="text-white/50 text-sm text-center">
              Если есть фото/ссылка — добавь в конце текста.
            </p>

            {/* File Upload */}
            <div className="space-y-3">
              {!orderData.attachment ? (
                <label className="block">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-[20px] p-6 bg-black/30 backdrop-blur-xl
                             border border-white/10 border-dashed cursor-pointer
                             hover:border-white/20 hover:bg-black/35 transition-all
                             flex items-center justify-center gap-3"
                  >
                    <Upload className="w-5 h-5 text-white/70" />
                    <span className="text-white/70 text-[clamp(14px,3.5vw,16px)]">
                      Добавить файл (фото/видео)
                    </span>
                  </motion.div>
                </label>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[20px] p-4 bg-black/30 backdrop-blur-xl border border-white/10
                           flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {orderData.attachment.type.startsWith('image/') ? (
                      <ImageIcon className="w-5 h-5 text-white/70 flex-shrink-0" />
                    ) : (
                      <Upload className="w-5 h-5 text-white/70 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{orderData.attachment.name}</p>
                      <p className="text-white/50 text-xs">
                        {(orderData.attachment.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20
                             flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!orderData.description.trim()}
              className={`w-full rounded-full px-6 py-4 text-base font-medium transition-all flex items-center justify-center gap-2
                        ${orderData.description.trim()
                          ? 'bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.3)] hover:bg-white/90'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                        }`}
            >
              Отправить заявку
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <p className="text-white/50 text-sm text-center">Ответим в Telegram. Обычно быстро.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full">
      {/* Single Step View - only render current step */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-[600px]">
          {/* Step Header */}
          <div className="mb-6 text-center">
            <p className="text-[clamp(11px,2.5vw,12px)] font-semibold tracking-[0.1em] uppercase text-white/60 mb-2">
              Шаг {currentStep + 1} из 6 · {STEP_LABELS[currentStep]}
            </p>
          </div>

          {/* Step Content */}
          {renderStepContent(currentStep)}
        </div>
      </motion.div>
    </div>
  );
}
