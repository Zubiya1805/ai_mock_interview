'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export const useCamera = () => {
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [permissions, setPermissions] = useState({
        camera: 'prompt',
        microphone: 'prompt'
    });

    const videoRef = useRef(null);

    // Check permissions
    const checkPermissions = useCallback(async () => {
        try {
            if ('permissions' in navigator) {
                const cameraPermission = await navigator.permissions.query({ name: 'camera' });
                const microphonePermission = await navigator.permissions.query({ name: 'microphone' });

                setPermissions({
                    camera: cameraPermission.state,
                    microphone: microphonePermission.state
                });
            }
        } catch (err) {
            console.log('Permission API not supported');
        }
    }, []);

    // Start camera
    const startCamera = useCallback(async (options = {}) => {
        setIsLoading(true);
        setError('');

        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                    ...options.video
                },
                audio: options.audio !== false
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            setIsCameraOn(true);
            setIsMicOn(mediaStream.getAudioTracks().length > 0);

            return mediaStream;
        } catch (err) {
            let errorMessage = 'Unable to access camera/microphone.';

            switch (err.name) {
                case 'NotAllowedError':
                    errorMessage = 'Camera and microphone access denied. Please allow permissions in your browser.';
                    break;
                case 'NotFoundError':
                    errorMessage = 'No camera or microphone found on this device.';
                    break;
                case 'NotSupportedError':
                    errorMessage = 'Camera/microphone not supported in this browser.';
                    break;
                case 'NotReadableError':
                    errorMessage = 'Camera/microphone is being used by another application.';
                    break;
                default:
                    errorMessage = `Camera error: ${err.message}`;
            }

            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
            setStream(null);
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsCameraOn(false);
        setIsMicOn(false);
    }, [stream]);

    // Toggle camera
    const toggleCamera = useCallback(async () => {
        if (isCameraOn) {
            stopCamera();
        } else {
            await startCamera();
        }
    }, [isCameraOn, startCamera, stopCamera]);

    // Toggle microphone
    const toggleMicrophone = useCallback(() => {
        if (stream) {
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0) {
                const newMicState = !isMicOn;
                audioTracks.forEach(track => {
                    track.enabled = newMicState;
                });
                setIsMicOn(newMicState);
            }
        }
    }, [stream, isMicOn]);

    // Switch camera (front/back)
    const switchCamera = useCallback(async () => {
        if (isCameraOn && stream) {
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            const newFacingMode = settings.facingMode === 'user' ? 'environment' : 'user';

            stopCamera();
            await startCamera({
                video: { facingMode: newFacingMode }
            });
        }
    }, [isCameraOn, stream, startCamera, stopCamera]);

    // Get camera stream for recording
    const getCameraStream = useCallback(() => {
        return stream;
    }, [stream]);

    // Cleanup on unmount
    useEffect(() => {
        checkPermissions();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [checkPermissions]);

    // Cleanup effect for stream
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    return {
        // State
        isCameraOn,
        isMicOn,
        stream,
        error,
        isLoading,
        permissions,
        videoRef,

        // Actions
        startCamera,
        stopCamera,
        toggleCamera,
        toggleMicrophone,
        switchCamera,
        getCameraStream,
        checkPermissions,

        // Utilities
        clearError: () => setError(''),
        isStreamActive: !!stream && stream.active
    };
};