import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiClock, FiLoader, FiX } from 'react-icons/fi';

const AgentTaskView = ({ tasks }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-gray-500" size={16} />;
      case 'running':
        return <FiLoader className="text-yellow-500 animate-spin" size={16} />;
      case 'done':
        return <FiCheck className="text-green-500" size={16} />;
      case 'failed':
        return <FiX className="text-red-500" size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 border-t border-gray-800">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Agent Execution</h3>
      <div className="space-y-2">
        <AnimatePresence>
          {tasks.map((task, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
            >
              <div className="flex-shrink-0">{getStatusIcon(task.status)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{task.step}</p>
                {task.result && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{task.result}</p>
                )}
              </div>
              <span className="text-xs text-gray-500 capitalize">{task.status}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AgentTaskView;
