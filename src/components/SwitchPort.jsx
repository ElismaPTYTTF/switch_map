
import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Monitor, Smartphone, Laptop, Server } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const getDeviceIcon = (deviceType) => {
  switch (deviceType) {
    case 'computer':
      return Monitor;
    case 'laptop':
      return Laptop;
    case 'phone':
      return Smartphone;
    case 'server':
      return Server;
    default:
      return Monitor;
  }
};

const SwitchPort = ({ port, onClick, disabled }) => {
  const isConnected = port.device !== null;
  const DeviceIcon = isConnected ? getDeviceIcon(port.device?.type) : WifiOff;

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={`transition-all duration-300 ${
          disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:shadow-xl'
        } ${
          isConnected 
            ? 'port-connected pulse-glow border-green-500/50' 
            : 'port-disconnected border-gray-600/50'
        }`}
        onClick={() => !disabled && onClick(port)}
      >
        <CardContent className="p-4">
          <div className="flex flex-col items-center space-y-3">
            <div className={`p-3 rounded-full ${
              isConnected 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              <DeviceIcon className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <div className="font-semibold text-sm mb-1">
                Porta {port.number}
              </div>
              
              {isConnected ? (
                <div className="space-y-1">
                  <div className="text-xs text-green-400 font-medium truncate max-w-[100px]">
                    {port.device.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {port.device.ip}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  Desconectada
                </div>
              )}
            </div>
            
            <div className={`w-3 h-3 rounded-full ${
              isConnected 
                ? 'bg-green-400 shadow-lg shadow-green-400/50' 
                : 'bg-gray-500'
            }`} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SwitchPort;
