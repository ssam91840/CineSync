import React, { useState } from 'react';
import SymlinkPreferences from '../components/Settings/SymlinkPreferences';
import NotificationSettings from '../components/Settings/NotificationSettings';
import EnvironmentSettings from '../components/Settings/EnvironmentSettings';
import { Save, Settings as SettingsIcon } from 'lucide-react';

type SettingsTab = 'environment' | 'preferences' | 'notifications';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('environment');

  const tabs = [
    { id: 'environment', label: 'Environment' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'notifications', label: 'Notifications' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <button className="btn btn-primary flex items-center gap-2">
          <Save className="h-5 w-5" />
          Save All Changes
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative
                ${activeTab === tab.id ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-300'}`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'environment' && <EnvironmentSettings />}
          {activeTab === 'preferences' && <SymlinkPreferences />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </div>
  );
}