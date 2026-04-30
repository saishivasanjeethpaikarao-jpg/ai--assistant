import { motion } from 'framer-motion';
import { FiMic, FiMicOff } from 'react-icons/fi';

const VoiceWaveform = ({ isActive, state }) => {
  const bars = Array.from({ length: 20 }, (_, i) => i);

  const getStateColor = () => {
    switch (state) {
      case 'listening':
        return 'bg-green-500';
      case 'thinking':
        return 'bg-yellow-500';
      case 'speaking':
        return 'bg-blue-500';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        className={`p-3 rounded-full transition-all ${
          isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        {isActive ? <FiMicOff size={20} /> : <FiMic size={20} />}
      </button>

      {isActive && (
        <div className="flex items-center gap-1 h-8">
          {bars.map((i) => (
            <motion.div
              key={i}
              className={`w-1 rounded-full ${getStateColor()}`}
              animate={{
                height: state === 'listening' ? [8, 24, 8] : [8, 8, 8],
                opacity: state === 'thinking' ? [0.5, 1, 0.5] : [1, 1, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.05,
              }}
            />
          ))}
        </div>
      )}

      {state && (
        <span className="text-xs text-gray-400 capitalize">{state}</span>
      )}
    </div>
  );
};

export default VoiceWaveform;
