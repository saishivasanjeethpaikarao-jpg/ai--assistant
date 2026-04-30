import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMemory, FiBell, FiSettings, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Sidebar = ({ isOpen, onToggle }) => {
  const [activeTab, setActiveTab] = useState('memory');

  const tabs = [
    { id: 'memory', icon: FiMemory, label: 'Memory' },
    { id: 'reminders', icon: FiBell, label: 'Reminders' },
    { id: 'settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <motion.div
      animate={{ width: isOpen ? 280 : 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-900 border-r border-gray-800 overflow-hidden"
    >
      <div className="w-80 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-100">Jarvis</h2>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isOpen ? <FiChevronLeft size={20} /> : <FiChevronRight size={20} />}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'memory' && (
              <motion.div
                key="memory"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-300">Remember: User prefers dark mode</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-300">Remember: User is a developer</p>
                  <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'reminders' && (
              <motion.div
                key="reminders"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <div className="p-3 bg-gray-800 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-sm text-gray-300">Team meeting at 3 PM</p>
                  <p className="text-xs text-gray-500 mt-1">Today</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-gray-300">Review pull requests</p>
                  <p className="text-xs text-gray-500 mt-1">Tomorrow</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Dark Mode</span>
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Notifications</span>
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Voice</span>
                  <div className="w-12 h-6 bg-gray-700 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-gray-400 rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
