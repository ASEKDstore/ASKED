'use client';

import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface OrderData {
  clothingType: string | null;
  size: string | null;
  colorChoice: string | null;
  customColor: string | null;
  placement: string | null;
  description: string;
  attachment: File | null;
}

// Clothing types with images
const CLOTHING_TYPES = [
  { id: 'hoodie', label: 'Худи', image: '/lab/hudi.png' },
  { id: 'tshirt', label: 'Футболка', image: '/lab/t-short.png' },
  { id: 'custom', label: 'Свой вариант', icon: Sparkles },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Limited colors: black, white, gray, custom
const COLORS = [
  { id: 'black', label: 'Черный', value: '#000000' },
  { id: 'white', label: 'Белый', value: '#FFFFFF' },
  { id: 'gray', label: 'Серый', value: '#808080' },
  { id: 'custom', label: 'Свой цвет', value: null },
];

// Placement options with icons
const PLACEMENTS = [
  { id: 'front', label: 'Фронт', icon: '⬆️' },
  { id: 'back', label: 'Спина', icon: '⬇️' },
  { id: 'sleeve', label: 'Рукав', icon: '↔️' },
  { id: 'individual', label: 'Индивидуально', icon: '📍' },
];

const STEP_LABELS = [
  'Выбор одежды',
  'Размер',
  'Цвет базы',
  'Место кастома',
  'Описание и файл',
];

interface LabOrderFlowProps {
  onComplete: (data: OrderData) => void;
  onProgressChange?: (progress: {
    currentStep: number;
    totalSteps: number;
    stepLabels: string[];
    isStepVisible: (index: number) => boolean;
  }) => void;
}

interface StepBlockProps {
  stepIndex: number;
  isVisible: boolean;
  isHighlighted: boolean;
  stepRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  children: React.ReactNode;
}

function StepBlock({ stepIndex, isVisible, isHighlighted, stepRefs, children }: StepBlockProps): JSX.Element {
  const stepRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(stepRef, { once: true, margin: '-100px' });

  // Always render to ensure ref is set and element exists in DOM for scrolling
  // Non-visible steps are hidden with opacity but maintain height for proper scrolling
  return (
    <div
      ref={(el) => {
        if (el) {
          stepRefs.current[stepIndex] = el;
        }
      }}
      id={`step-${stepIndex}`}
      className={`min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 relative transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Highlight glow effect */}
      {isHighlighted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
      )}

      <motion.div
        ref={stepRef}
        initial={{ opacity: 0, y: 16, scale: 0.985, filter: 'blur(2px)' }}
        animate={
          isInView
            ? { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
            : { opacity: 0, y: 16, scale: 0.985, filter: 'blur(2px)' }
        }
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
        className="w-full max-w-[600px] relative z-10"
      >
        {/* Step Header */}
        <div className="mb-6 text-center">
          <p className="text-[clamp(11px,2.5vw,12px)] font-semibold tracking-[0.1em] uppercase text-white/60 mb-2">
            Шаг {stepIndex + 1} из 5 · {STEP_LABELS[stepIndex]}
          </p>
        </div>

        {children}
      </motion.div>
    </div>
  );
}

export function LabOrderFlow({ onComplete, onProgressChange }: LabOrderFlowProps): JSX.Element {
  const [orderData, setOrderData] = useState<OrderData>({
    clothingType: null,
    size: null,
    colorChoice: null,
    customColor: null,
    placement: null,
    description: '',
    attachment: null,
  });
  const [highlightedStep, setHighlightedStep] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Robust gating booleans for step visibility
  const isStep1Complete = Boolean(orderData.clothingType);
  const isStep2Complete = isStep1Complete && Boolean(orderData.size);
  const isStep3Complete = isStep2Complete && Boolean(orderData.colorChoice);
  const isStep4Complete = isStep3Complete && Boolean(orderData.placement);

  // Determine which steps are visible (gated)
  const isStepVisible = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return true; // Always show first step
      case 1:
        return isStep1Complete; // Step 2 becomes visible after Step 1 is complete
      case 2:
        return isStep2Complete; // Step 3 becomes visible after Step 2 is complete
      case 3:
        return isStep3Complete; // Step 4 becomes visible after Step 3 is complete
      case 4:
        return isStep4Complete; // Step 5 becomes visible after Step 4 is complete
      default:
        return false;
    }
  };

  // Find scroll container - retry until found
  const findScrollContainer = () => {
    // Try to find scroll container from any rendered step
    for (let i = 0; i < stepRefs.current.length; i++) {
      let element: HTMLElement | null = stepRefs.current[i]?.parentElement ?? null;
      while (element) {
        const style = window.getComputedStyle(element);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') {
          containerRef.current = element;
          return;
        }
        element = element.parentElement ?? null;
      }
    }
    // Fallback: try to find any scrollable container in the component tree
    if (!containerRef.current && stepRefs.current[0]) {
      let element: HTMLElement | null = stepRefs.current[0].closest('[class*="overflow"]') as HTMLElement | null;
      if (element) {
        const style = window.getComputedStyle(element);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') {
          containerRef.current = element;
          return;
        }
      }
    }
    containerRef.current = null;
  };

  // Find scroll container on mount and when steps become visible
  useEffect(() => {
    findScrollContainer();
  }, [isStep1Complete, isStep2Complete, isStep3Complete, isStep4Complete]);

  // Helper function to scroll to step with retries
  const scrollToStepWithRetry = (stepIndex: number, maxRetries = 10, delay = 100) => {
    let attempts = 0;
    const tryScroll = () => {
      const element = stepRefs.current[stepIndex];
      if (element) {
        scrollToStep(stepIndex);
      } else if (attempts < maxRetries) {
        attempts++;
        setTimeout(tryScroll, delay);
      }
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(tryScroll); // Double RAF to ensure DOM update
    });
  };

  // Auto-scroll when steps become visible
  useEffect(() => {
    if (isStep1Complete && !orderData.size) {
      scrollToStepWithRetry(1);
    }
  }, [isStep1Complete, orderData.size]);

  useEffect(() => {
    if (isStep2Complete && !orderData.colorChoice) {
      scrollToStepWithRetry(2);
    }
  }, [isStep2Complete, orderData.colorChoice]);

  useEffect(() => {
    if (isStep3Complete && !orderData.placement) {
      scrollToStepWithRetry(3);
    }
  }, [isStep3Complete, orderData.placement]);

  useEffect(() => {
    if (isStep4Complete && !orderData.description) {
      scrollToStepWithRetry(4);
    }
  }, [isStep4Complete, orderData.description]);

  // Notify parent about progress changes
  useEffect(() => {
    if (onProgressChange) {
      const currentStep = orderData.placement ? 5 : orderData.colorChoice ? 4 : orderData.size ? 3 : orderData.clothingType ? 2 : 1;
      onProgressChange({
        currentStep,
        totalSteps: 5,
        stepLabels: STEP_LABELS,
        isStepVisible,
      });
    }
  }, [orderData, isStepVisible, onProgressChange]);

  const scrollToStep = (stepIndex: number) => {
    const element = stepRefs.current[stepIndex];
    if (!element) return;

    const container = containerRef.current;
    if (!container) {
      const elementRect = element.getBoundingClientRect();
      const targetTop = window.scrollY + elementRect.top - 100;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const targetTop = scrollTop + elementRect.top - containerRect.top - 100;

      if (container.scrollTo) {
        container.scrollTo({ top: targetTop, behavior: 'smooth' });
      } else {
        container.scrollTop = targetTop;
      }
    }

    // Highlight the step
    setHighlightedStep(stepIndex);
    setTimeout(() => setHighlightedStep(null), 600);
  };

  const handleStepComplete = (stepIndex: number, value: string | null) => {
    // Haptic feedback
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch { /* noop */ }

    // Update order data - auto-scroll is handled by useEffect hooks
    if (stepIndex === 0) {
      setOrderData((prev) => ({ ...prev, clothingType: value }));
    } else if (stepIndex === 1) {
      setOrderData((prev) => ({ ...prev, size: value }));
    } else if (stepIndex === 2) {
      setOrderData((prev) => ({ ...prev, colorChoice: value, customColor: value === 'custom' ? null : null }));
    } else if (stepIndex === 3) {
      setOrderData((prev) => ({ ...prev, placement: value }));
    }
  };

  const handleCustomColorChange = (color: string) => {
    setOrderData((prev) => ({ ...prev, customColor: color }));
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

  return (
    <div className="relative w-full">
      {/* Steps Container */}
      <div className="relative">
        {/* Step 1: Clothing Type */}
        <StepBlock
          stepIndex={0}
          isVisible={isStepVisible(0)}
          isHighlighted={highlightedStep === 0}
          stepRefs={stepRefs}
        >
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
                      <div className="w-16 h-16 mx-auto mb-3 relative">
                        <Image
                          src={type.image}
                          alt={type.label}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      Icon && <Icon className="w-8 h-8 mx-auto mb-3 text-white" />
                    )}
                    <div className="text-white font-medium text-base">{type.label}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </StepBlock>

        {/* Step 2: Size */}
        <StepBlock
          stepIndex={1}
          isVisible={isStepVisible(1)}
          isHighlighted={highlightedStep === 1}
          stepRefs={stepRefs}
        >
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
        </StepBlock>

        {/* Step 3: Color */}
        <StepBlock
          stepIndex={2}
          isVisible={isStepVisible(2)}
          isHighlighted={highlightedStep === 2}
          stepRefs={stepRefs}
        >
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
                    style={
                      color.value
                        ? { backgroundColor: color.value }
                        : {
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                          }
                    }
                  >
                    {color.id === 'custom' && (
                      <Palette className="w-6 h-6 text-white" />
                    )}
                    {orderData.colorChoice === color.id && color.id !== 'custom' && (
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
            {orderData.colorChoice === 'custom' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <input
                  type="color"
                  value={orderData.customColor || '#000000'}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-full h-12 rounded-[16px] bg-black/30 backdrop-blur-xl border border-white/10 cursor-pointer"
                />
                <p className="text-white/50 text-sm text-center mt-2">
                  Или введите код цвета: {orderData.customColor || '#000000'}
                </p>
              </motion.div>
            )}
          </div>
        </StepBlock>

        {/* Step 4: Placement */}
        <StepBlock
          stepIndex={3}
          isVisible={isStepVisible(3)}
          isHighlighted={highlightedStep === 3}
          stepRefs={stepRefs}
        >
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
                  <div className="text-3xl mb-3">{placement.icon}</div>
                  <div className="text-white font-medium text-base">{placement.label}</div>
                </motion.button>
              ))}
            </div>
          </div>
        </StepBlock>

        {/* Step 5: Description + File Upload */}
        <StepBlock
          stepIndex={4}
          isVisible={isStepVisible(4)}
          isHighlighted={highlightedStep === 4}
          stepRefs={stepRefs}
        >
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
        </StepBlock>
      </div>
    </div>
  );
}
