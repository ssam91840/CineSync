import React from 'react';
import { Bell } from 'lucide-react';

const notifications = [
  {
    id: 'scan-complete',
    title: 'Scan Complete',
    description: 'Get notified when library scan finishes'
  },
  {
    id: 'errors',
    title: 'Errors',
    description: 'Get notified about errors during scanning'
  },
  {
    id: 'new-import',
    title: 'New Imports',
    description: 'Get notified when new media is imported'
  },
  {
    id: 'desktop',
    title: 'Desktop Notifications',
    description: 'Show notifications on your desktop'
  }
];

export default function NotificationSettings() {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
        <Bell className="h-5 w-5 text-indigo-400" />
        Notification Settings
      </h2>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
          >
            <div>
              <h3 className="font-medium text-gray-200">{notification.title}</h3>
              <p className="text-sm text-gray-400">{notification.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}