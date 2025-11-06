'use client';
import React, { useCallback, useRef, useState } from 'react';

type Props = {
  onValid?: (file: File) => void;          // made optional + guarded
  onInvalid?: (message: string) => void;   // optional
  accept?: string[];
  maxSizeMB?: number;
};

export default function Dropzone({
  onValid,
  onInvalid,
  accept = ['image/jpeg', 'image/png'],
  maxSizeMB = 8,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reportInvalid = (msg: string) => {
    if (typeof onInvalid === 'function') onInvalid(msg);
    else alert(msg); // fallback
  };

  const validateFile = (file: File) => {
    if (!accept.includes(file.type)) {
      reportInvalid('Please upload a JPG or PNG image.');
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      reportInvalid(`File too large (max ${maxSizeMB}MB).`);
      return false;
    }
    return true;
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const f = files[0];
      if (!validateFile(f)) return;

      if (typeof onValid === 'function') {
        onValid(f);
      } else {
        // Defensive fallback so the app never crashes
        alert('Upload received, but no onValid handler is wired.');
        console.warn('[Dropzone] onValid prop is missing or not a function.');
      }
    },
    [onValid]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (e.target) e.target.value = '';
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`rounded-2xl border border-dashed p-10 text-center transition ${
        dragOver ? 'border-indigo-400 bg-indigo-50/40' : 'border-gray-300 bg-white/60'
      }`}
    >
      <p className="mb-2 text-sm text-gray-700">Drag & Drop Your Scan</p>
      <p className="mb-4 text-xs text-gray-500">or click to choose a file (JPG/PNG, max {maxSizeMB}MB)</p>

      <button
        type="button"
        className="btn-primary"
        onClick={() => inputRef.current?.click()}
      >
        Choose File
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept.join(',')}
        className="hidden"
        onChange={onChange}
      />

      <div className="mt-3 text-[11px] text-gray-500">Secure • No storage • For fun only</div>
    </div>
  );
}