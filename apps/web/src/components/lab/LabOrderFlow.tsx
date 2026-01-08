'use client';

import { motion } from 'framer-motion';
import { Check, ChevronUp, Palette, Shirt, Type } from 'lucide-react';
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
  { id: 'sweatshirt', label: 'Свитшот', icon: '🧥' },
  { id: 'jacket', label: 'Куртка', icon: '🧥' },
  { id: 'pants', label: 'Штаны', icon: '👖' },
  { id: 'cap', label: 'Кепка', icon: '🧢' },
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
  { id: 'front', label: 'Спереди', icon: '⬆️' },
  { id: 'back', label: 'Сзади', icon: '⬇️' },
  { id: 'sleeve', label: 'На рукаве', icon: '↔️' },
  { id: 'custom', label: 'Своё место', icon: '📍' },
];

interface LabOrderFlowProps {
  onComplete: (data: OrderData) => void;
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
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = [
    { id: 'clothing', label: 'Тип одежды', icon: Shirt },
    { id: 'size', label: 'Размер', icon: Type },
    { id: 'color', label: 'Цвет', icon: Palette },
    { id: 'placement', label: 'Размещение', icon: Check },
    { id: 'description', label: 'Описание', icon: Type },
  ];

  const scrollToStep = (stepIndex: number) => {
    const element = stepRefs.current[stepIndex];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleStepComplete = (stepIndex: number, value: string | null) => {
    const stepId = steps[stepIndex].id;
    setOrderData((prev) => ({ ...prev, [stepId]: value }));

    // Auto-scroll to next step
    if (stepIndex < steps.length - 1) {
      setTimeout(() => {
        setCurrentStep(stepIndex + 1);
        scrollToStep(stepIndex + 1);
      }, 300);
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
    onComplete(orderData);
  };

  // Scroll to current step on mount/change
  useEffect(() => {
    scrollToStep(currentStep);
  }, [currentStep]);

  const renderStep = (stepIndex: number): JSX.Element => {
    const step = steps[stepIndex];

    switch (step.id) {
      case 'clothing':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">
                Выбери тип одежды
              </h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">
                Что будем кастомизировать?
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
                Выбери размер
              </h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">
                Какой размер тебе нужен?
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
                Выбери цвет
              </h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">
                Какой цвет основы?
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
            <div className="text-center mt-4">
              <p className="text-white/60 text-sm">
                {COLORS.find((c) => c.id === orderData.color)?.label || 'Выбери цвет'}
              </p>
            </div>
          </div>
        );

      case 'placement':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-[clamp(24px,6vw,32px)] font-bold text-white mb-2">
                Где разместить дизайн?
              </h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">
                Выбери место для кастома
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
                Опиши идею
              </h3>
              <p className="text-white/70 text-[clamp(14px,3.5vw,16px)]">
                Расскажи, что хочешь видеть на кастоме
              </p>
            </div>
            <textarea
              value={orderData.description}
              onChange={(e) => setOrderData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Например: хочу логотип бренда спереди, минималистичный стиль..."
              className="w-full min-h-[200px] rounded-[20px] p-6 bg-black/30 backdrop-blur-xl
                       border border-white/10 text-white placeholder-white/40
                       focus:outline-none focus:border-white/30 focus:bg-black/35
                       resize-none text-[clamp(14px,3.5vw,16px)]"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!orderData.description.trim()}
              className={`w-full rounded-full px-6 py-4 text-base font-medium transition-all
                        ${orderData.description.trim()
                          ? 'bg-white text-black shadow-[0_4px_16px_rgba(255,255,255,0.3)] hover:bg-white/90'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                        }`}
            >
              Отправить заявку
            </motion.button>
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
        {steps.map((step, index) => (
          <div
            key={step.id}
            ref={(el) => {
              stepRefs.current[index] = el;
            }}
            className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-full max-w-[600px]"
            >
              {renderStep(index)}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

