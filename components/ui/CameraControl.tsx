'use client';

import React from 'react';
import { Camera, CameraOff, Mic, MicOff, RotateCcw, Settings } from 'lucide-react';
import { useCamera } from '@/lib/hooks/useCamera';

interface CameraControlsProps {
    onCameraToggle?: (isOn: boolean) => void;
    showSettings?: boolean;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

const CameraControls: React.FC<CameraControlsProps> = ({
                                                           onCameraToggle,
                                                           showSettings = true,
                                                           className = "",
                                                           size = "default"
                                                       }) => {
    const {
        isCameraOn,
        isMicOn,
        error,
        isLoading,
        permissions,
        videoRef,
        toggleCamera,
        toggleMicrophone,
        switchCamera,
        clearError
    } = useCamera();

    // Notify parent component when camera toggles
    React.useEffect(() => {
        if (onCameraToggle) {
            onCameraToggle(isCameraOn);
        }
    }, [isCameraOn, onCameraToggle]);

    const buttonSizes = {
        small: "p-2 text-sm",
        default: "p-3",
        large: "p-4 text-lg"
    };

    const iconSizes = {
        small: "w-4 h-4",
        default: "w-5 h-5",
        large: "w-6 h-6"
    };

    return (
        <div className={`flex flex-col space-y-4 ${className}`}>
            {/* Video Preview */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                {isCameraOn ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-48 sm:h-64 object-cover"
                    />
                ) : (
                    <div className="w-full h-48 sm:h-64 flex items-center justify-center bg-gray-800">
                        <div className="text-center">
                            <Camera className={`${iconSizes.large} text-gray-400 mx-auto mb-2`} />
                            <p className="text-gray-400 text-sm">Camera is off</p>
                        </div>
                    </div>
                )}

                {/* Status Indicators */}
                <div className="absolute top-2 right-2 flex space-x-2">
                    {isCameraOn && (
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    )}
                    {isMicOn && (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                </div>

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
                        <div className="bg-red-600 text-white p-3 rounded-lg text-center max-w-sm">
                            <p className="text-sm mb-2">{error}</p>
                            <button
                                onClick={clearError}
                                className="bg-red-500 hover:bg-red-400 px-3 py-1 rounded text-xs"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center space-x-2">
                {/* Camera Toggle */}
                <button
                    onClick={toggleCamera}
                    disabled={isLoading}
                    className={`
            flex items-center justify-center ${buttonSizes[size]} rounded-lg font-medium 
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            ${isCameraOn
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }
          `}
                    title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                >
                    {isLoading ? (
                        <div className={`${iconSizes[size]} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
                    ) : isCameraOn ? (
                        <CameraOff className={iconSizes[size]} />
                    ) : (
                        <Camera className={iconSizes[size]} />
                    )}
                </button>

                {/* Microphone Toggle */}
                <button
                    onClick={toggleMicrophone}
                    className={`
            flex items-center justify-center ${buttonSizes[size]} rounded-lg font-medium 
            transition-all duration-200
            ${isMicOn
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-500 hover:bg-gray-600 text-white'
                    }
          `}
                    title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                    {isMicOn ? (
                        <Mic className={iconSizes[size]} />
                    ) : (
                        <MicOff className={iconSizes[size]} />
                    )}
                </button>

                {/* Camera Switch (Front/Back) */}
                {isCameraOn && (
                    <button
                        onClick={switchCamera}
                        className={`
              flex items-center justify-center ${buttonSizes[size]} rounded-lg font-medium 
              transition-all duration-200 bg-gray-600 hover:bg-gray-700 text-white
            `}
                        title="Switch camera"
                    >
                        <RotateCcw className={iconSizes[size]} />
                    </button>
                )}

                {/* Settings Button */}
                {showSettings && (
                    <button
                        className={`
              flex items-center justify-center ${buttonSizes[size]} rounded-lg font-medium 
              transition-all duration-200 bg-gray-400 hover:bg-gray-500 text-white
            `}
                        title="Camera settings"
                    >
                        <Settings className={iconSizes[size]} />
                    </button>
                )}
            </div>

            {/* Status Information */}
            {showSettings && (
                <div className="text-xs text-gray-600 text-center space-y-1">
                    <div className="flex justify-center space-x-4">
            <span className={isCameraOn ? 'text-green-600' : 'text-red-600'}>
              Camera: {isCameraOn ? 'On' : 'Off'}
            </span>
                        <span className={isMicOn ? 'text-blue-600' : 'text-gray-600'}>
              Mic: {isMicOn ? 'On' : 'Off'}
            </span>
                    </div>

                    {permissions.camera === 'denied' && (
                        <div className="text-red-600">
                            Camera permission denied. Please enable in browser settings.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CameraControls;