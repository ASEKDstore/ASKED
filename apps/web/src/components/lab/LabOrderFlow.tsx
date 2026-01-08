'use client';

import { motion, useInView } from 'framer-motion';
import { ArrowRight, Check, ChevronUp, Palette, Shirt, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface OrderData {
  clothingType: string | null;
  size: string | null;
  color: string | null;
  placement: string | null;
  description: string;
}

const CLOTHING_TYPES = [
  { id: 'hoodie', label: 'Худи', icon: '👕' },
  { id: 'tshirt', label: 'Футболка', icon: '👔' },
  { id: 'jacket', label: 'Куртка', icon: '🧥' },
  { id: 'custom', label: 'Свой вариант', icon: '✨' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const COLORS = [
  { id: 'black', label: 'Чёрный', value: '#000000' },
  { id: 'white', label: 'Белый', value: '#FFFFFF' },
  { id: 'gray', label: 'Серый', value: '#808080' },
  { id: 'navy', label: 'Тёмно-синий', value: '#000080' },
  { id: 'red', label: 'Красный', value: '#FF0000' },
  { id: 'blue', label: 'Синий', value: '#0000FF' },
  { id: 'green', label: 'Зелёный', value: '#008000' },
  { id: 'yellow', label: 'Жёлтый', value: '#FFFF00' },
];

const PLACEMENTS = [
  { id: 'front', label: 'Фронт', icon: '⬆️' },
  { id: 'back', label: 'Спина', icon: '⬇️' },
  { id: 'sleeve', label: 'Рукав', icon: '↔️' },
  { id: 'custom', label: 'Произвольно', icon: '📍' },
];

interface LabOrderFlowProps {
  onComplete: (data: OrderData) => void;
}

interface StepWrapperProps {
  stepIndex: number;
  isHighlighted: boolean;
  stepRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  renderStep: (index: number) => JSX.Element;
}

function StepWrapper({ stepIndex, isHighlighted, stepRefs, renderStep }: StepWrapperProps): JSX.Element {
  const stepRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(stepRef, { once: true, margin: '-100px' });

  return (
    <div
      ref={(el) => {
        stepRefs.current[stepIndex] = el;
      }}
      id={`step-${stepIndex}`}
      className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 relative"
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
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
        className="w-full max-w-[600px] relative z-10"
      >
        {renderStep(stepIndex)}
      </motion.div>
    </div>
  );
}

export function LabOrderFlow({ onComplete }: LabOrderFlowProps): JSX.Element {
  const [currentStep, setCurrentStep] = useState(0);
  const [orderData, setOrderData] = useState<OrderData>({
    clothingType: null,
    size: null,
    color: null,
    placement: null,
    description: '',
  });
  const [highlightedStep, setHighlightedStep] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLElement | null>(null);

  const steps = [
    { id: 'clothing', label: 'Тип одежды', icon: Shirt },
    { id: 'size', label: 'Размер', icon: Type },
    { id: 'color', label: 'Цвет', icon: Palette },
    { id: 'placement', label: 'Размещение', icon: Check },
    { id: 'description', label: 'Описание', icon: Type },
  ];

  // Find scroll container (parent with overflow-y-auto)
  useEffect(() => {
    const findScrollContainer = () => {
      let element: HTMLElement | null = stepRefs.current[0]?.parentElement ?? null;
      while (element) {
        const style = window.getComputedStyle(element);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          containerRef.current = element;
          return;
        }
        element = element.parentElement ?? null;
      }
      // Fallback to window
      containerRef.current = null;
    };
    findScrollContainer();
  }, []);

  const scrollToStep = (stepIndex: number) => {
    const element = stepRefs.current[stepIndex];
    if (!element) return;

    const container = containerRef.current;
    if (!container) {
      // Fallback to window scroll
      const elementRect = element.getBoundingClientRect();
      const targetTop = window.scrollY + elementRect.top - 100;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const targetTop = scrollTop + elementRect.top - containerRect.top - 100; // 100px offset
      
      if (container.scrollTo) {
        container.scrollTo({ top: targetTop, behavior: 'smooth' });
      } else {
        // Fallback for older browsers
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

    const stepId = steps[stepIndex].id;
    setOrderData((prev) => ({ ...prev, [stepId]: value }));

    // Auto-scroll to next step
    if (stepIndex < steps.length - 1) {
      setTimeout(() => {
        const nextStep = stepIndex + 1;
        setCurrentStep(nextStep);
        scrollToStep(nextStep);
      }, 100); // 80-120ms delay
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      scrollToStep(newStep);
    }
  };

  const handleSubmit = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');
    } catch { /* noop */ }
    setIsSubmitted(true);
    // Delay to show success screen before calling onComplete
    setTimeout(() => {
      onComplete(orderData);
    }, 2000);
  };

  const handleBackToLab = () => {
    onComplete(orderData);
  };

  // Scroll to current step on mount/change
  useEffect(() => {
    scrollToStep(currentStep);
  }, [currentStep]);

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
            <h2 className="text-[clamp(28px,7vw,40px)] font-bold text-white mb-4">
              Принято.
            </h2>
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

  const renderStep = (stepIndex: number): JSX.Element => {
    const step = steps[stepIndex];

    switch (step.id) {
      case 'clothing':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">
                Что кастомим?
              </h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">
                Выбери базу — остальное мы доведём до идеала.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {CLOTHING_TYPES.map((type) => (
                <motion.button
                  key={type.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleStepComplete(0, type.id)}
                  className={`rounded-[20px] p-6 bg-black/30 backdrop-blur-xl border transition-all
                            ${orderData.clothingType === type.id
                              ? 'border-white/30 bg-white/10 shadow-[0_8px_24px_rgba(255,255,255,0.1)]'
                              : 'border-white/10 hover:border-white/20 hover:bg-black/35'
                            }`}
                >
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <div className="text-white font-medium text-base">{type.label}</div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 'size':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">
                Размер
              </h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">
                Чтобы посадка была в точку.
              </p>
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

      case 'color':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">
                Цвет базы
              </h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">
                Подберём под стиль и идею.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {COLORS.map((color) => (
                <motion.button
                  key={color.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStepComplete(2, color.id)}
                  className={`relative rounded-[16px] aspect-square flex items-center justify-center
                            transition-all border-2
                            ${orderData.color === color.id
                              ? 'border-white shadow-[0_0_0_4px_rgba(255,255,255,0.2)] scale-105'
                              : 'border-white/20 hover:border-white/40'
                            }`}
                  style={{ backgroundColor: color.value }}
                >
                  {orderData.color === color.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Check className="w-6 h-6 text-white drop-shadow-lg" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 'placement':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">
                Где будет кастом?
              </h3>
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
        );

      case 'description':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">
                Коротко про идею
              </h3>
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
            <p className="text-white/50 text-sm text-center">
              Ответим в Telegram. Обычно быстро.
            </p>
          </div>
        );

      default:
        return <div />;
    }
  };

  return (
    <div className="relative w-full">
      {/* Progress Indicator */}
      <div className="sticky top-0 z-20 px-4 py-4 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm">
            Шаг {currentStep + 1} из {steps.length}
          </span>
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
              Назад
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 h-1 rounded-full transition-all
                        ${index <= currentStep ? 'bg-white' : 'bg-white/20'}
                      `}
            />
          ))}
        </div>
      </div>

      {/* Steps Container */}
      <div className="relative">
        {steps.map((step, index) => {
          const isHighlighted = highlightedStep === index;

          return (
            <StepWrapper
              key={step.id}
              stepIndex={index}
              isHighlighted={isHighlighted}
              stepRefs={stepRefs}
              renderStep={renderStep}
            />
          );
        })}
      </div>
    </div>
  );
}
