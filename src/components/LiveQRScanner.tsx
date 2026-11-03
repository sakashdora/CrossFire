import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, UploadCloud, AlertCircle } from 'lucide-react';

interface LiveQRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const LiveQRScanner: React.FC<LiveQRScannerProps> = ({ onScanSuccess, onClose }) => {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const cameraQueue = useRef(Promise.resolve());
  const onDecode = useRef(onScanSuccess);
  onDecode.current = onScanSuccess;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'file'>('camera');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileAttempt = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const containerId = 'crossfire-qr-reader';

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => () => { fileAttempt.current++; }, [mode]);

  // Initialize and get camera devices
  useEffect(() => {
    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices: any[]) => {
        if (isMounted && devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available on mobile
          const backCam = devices.find((d: any) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedCamera(backCam ? backCam.id : devices[0].id);
        } else if (isMounted) {
          setErrorMsg('No camera detected on this device. You can still scan by uploading an image or entering Pass ID.');
        }
      })
      .catch((err: any) => {
        console.warn('[CROSSFIRE] Camera detection error:', err);
        if (isMounted) {
          setErrorMsg('Camera access was not granted. Please allow camera permissions in your browser.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Camera startup and shutdown are asynchronous. Finish releasing the previous
  // stream before switching devices, modes, or leaving the desk.
  useEffect(() => {
    if (mode !== 'camera' || !selectedCamera) return;
    let cancelled = false;
    let delivered = false;
    let streaming = false;
    let reader: Html5Qrcode | null = null;
    const started = cameraQueue.current.then(async () => {
      if (cancelled) return;
      setErrorMsg(null);
      try {
        reader = new Html5Qrcode(containerId);
        await reader.start(selectedCamera, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          code => {
            if (cancelled || delivered) return;
            delivered = true;
            try {
              const audio = new AudioContext();
              const tone = audio.createOscillator();
              const volume = audio.createGain();
              tone.connect(volume);
              volume.connect(audio.destination);
              tone.frequency.value = 800;
              volume.gain.value = 0.2;
              tone.onended = () => { void audio.close(); };
              tone.start();
              tone.stop(audio.currentTime + 0.15);
            } catch { /* Audio may be unavailable on this device. */ }
            onDecode.current(code);
          }, () => {});
        streaming = true;
        if (!cancelled) setIsScanning(true);
      } catch (error) {
        if (!cancelled) setErrorMsg(error instanceof Error ? error.message : 'Unable to access camera. Check browser permissions or upload a pass image.');
      }
    });
    return () => {
      cancelled = true;
      setIsScanning(false);
      cameraQueue.current = started.then(async () => {
        if (streaming) await reader?.stop();
        reader?.clear();
      }).catch(error => console.warn('[CROSSFIRE] Error releasing scanner:', error));
    };
  }, [selectedCamera, mode]);

  // Handle file QR scanning
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const attempt = ++fileAttempt.current;
    e.target.value = '';
    setErrorMsg(null);

    try {
      const html5QrCode = new Html5Qrcode('crossfire-file-reader');
      const result = await html5QrCode.scanFile(file, false);
      html5QrCode.clear();
      if (attempt === fileAttempt.current) onScanSuccess(result);
    } catch {
      if (attempt === fileAttempt.current) setErrorMsg('Could not detect a valid QR code in the uploaded image.');
    }
  };

  return (
    <dialog ref={dialogRef} aria-label="Pass scanner" onCancel={event => { event.preventDefault(); onClose(); }} className="m-auto w-[calc(100%-2rem)] max-w-md max-h-[90dvh] overflow-auto rounded-3xl p-0 backdrop:bg-navy-dark/85">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-orange-400 animate-pulse" />
            <h3 className="font-black text-sm tracking-wide">Pass QR scanner</h3>
            {mode === 'camera' && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isScanning ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-gray-400'}`}>
                {isScanning ? '● Live' : 'Ready'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close scanner"
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-gray-100 bg-gray-50 text-xs font-bold">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'camera' ? 'bg-white text-navy border-b-2 border-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Device Camera</span>
          </button>
          <button
            onClick={() => setMode('file')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'file' ? 'bg-white text-navy border-b-2 border-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col items-center">
          {errorMsg && (
            <div className="w-full mb-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-start gap-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'camera' ? (
            <div className="w-full flex flex-col items-center">
              {/* Camera view container */}
              <div 
                id={containerId} 
                className="w-full max-w-[280px] h-[280px] rounded-2xl overflow-hidden bg-black border-2 border-orange-500 shadow-lg relative"
              />

              {/* Camera Selector */}
              {cameras.length > 1 && (
                <div className="mt-3 w-full max-w-[280px]">
                  <select
                    aria-label="Select camera"
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full text-xs font-bold bg-gray-100 border border-gray-300 rounded-xl px-3 py-2 text-navy"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label || `Camera ${c.id.substring(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="text-[11px] text-gray-500 font-medium text-center mt-3">
                Align the pass QR code inside the viewfinder window.
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center py-6">
              <div id="crossfire-file-reader" className="hidden" />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileScan}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-[260px] p-6 border-2 border-dashed border-gray-300 hover:border-orange-500 rounded-2xl bg-gray-50 hover:bg-orange-50/30 flex flex-col items-center gap-2 cursor-pointer transition-all text-center"
              >
                <UploadCloud className="w-10 h-10 text-orange-500" />
                <span className="text-xs font-bold text-navy">Choose Pass Image / Photo</span>
                <span className="text-[10px] text-gray-400">PNG, JPG, WEBP formats</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-400 text-[10px] font-mono">
            CROSSFIRE GATE SCANNER • SRUSTI 2026
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 font-bold text-gray-700 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
};
