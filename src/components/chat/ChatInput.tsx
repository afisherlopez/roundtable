'use client';

import { useState, useRef, useEffect, KeyboardEvent, DragEvent, ChangeEvent } from 'react';
import type { ImageAttachment, PdfAttachment } from '@/types/chat';

interface ChatInputProps {
  onSubmit: (message: string, images?: ImageAttachment[], pdfs?: PdfAttachment[]) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_PDF_TYPE = 'application/pdf';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function ChatInput({ onSubmit, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [pdfs, setPdfs] = useState<PdfAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newImages: ImageAttachment[] = [];
    const newPdfs: PdfAttachment[] = [];

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        continue;
      }

      const base64 = await fileToBase64(file);

      if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        newImages.push({
          id: crypto.randomUUID(),
          data: base64,
          mimeType: file.type as ImageAttachment['mimeType'],
          name: file.name,
        });
      } else if (file.type === ACCEPTED_PDF_TYPE) {
        newPdfs.push({
          id: crypto.randomUUID(),
          data: base64,
          mimeType: 'application/pdf',
          name: file.name,
        });
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
    }
    if (newPdfs.length > 0) {
      setPdfs((prev) => [...prev, ...newPdfs]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
    e.target.value = '';
  };

  const handlePdfSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const removePdf = (id: string) => {
    setPdfs((prev) => prev.filter((pdf) => pdf.id !== id));
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if ((!trimmed && images.length === 0 && pdfs.length === 0) || isLoading || disabled) return;
    onSubmit(
      trimmed, 
      images.length > 0 ? images : undefined,
      pdfs.length > 0 ? pdfs : undefined
    );
    setInput('');
    setImages([]);
    setPdfs([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  };

  const hasAttachments = images.length > 0 || pdfs.length > 0;
  const canSubmit = (input.trim() || hasAttachments) && !isLoading && !disabled;

  const getPlaceholder = () => {
    if (images.length > 0 && pdfs.length > 0) {
      return "Add a message about your files...";
    } else if (images.length > 0) {
      return "Add a message about your image(s)...";
    } else if (pdfs.length > 0) {
      return "Add a message about your PDF(s)...";
    }
    return "Ask anything...";
  };

  return (
    <div 
      className={`border-t border-spring-300 bg-spring-100 p-4 transition-colors ${
        isDragging ? 'bg-spring-200' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="max-w-3xl mx-auto">
        {/* Attachment previews */}
        {hasAttachments && (
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Image previews */}
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={`data:${img.mimeType};base64,${img.data}`}
                  alt={img.name}
                  className="h-16 w-16 object-cover rounded-lg border border-spring-300"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-400 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
            {/* PDF previews */}
            {pdfs.map((pdf) => (
              <div key={pdf.id} className="relative group">
                <div className="h-16 w-28 bg-white rounded-lg border border-spring-300 flex items-center gap-2 px-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-rose-500 flex-shrink-0">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2v6h6M10 13h4M10 17h4M8 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[10px] text-bark-600 truncate flex-1" title={pdf.name}>
                    {pdf.name}
                  </span>
                </div>
                <button
                  onClick={() => removePdf(pdf.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-400 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Remove PDF"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* PDF upload button (paperclip) */}
          <input
            ref={pdfInputRef}
            type="file"
            accept={ACCEPTED_PDF_TYPE}
            multiple
            onChange={handlePdfSelect}
            className="hidden"
          />
          <button
            onClick={() => pdfInputRef.current?.click()}
            disabled={isLoading || disabled}
            className="bg-white border border-spring-300 hover:border-spring-500 text-bark-600 p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Attach PDF"
            title="Attach PDF"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 5.5v5a4.5 4.5 0 01-9 0V4a3 3 0 116 0v6.5a1.5 1.5 0 01-3 0V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Image upload button */}
          <input
            ref={imageInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={isLoading || disabled}
            className="bg-white border border-spring-300 hover:border-spring-500 text-bark-600 p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Attach images"
            title="Attach images"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="5" cy="6" r="1.25" stroke="currentColor" strokeWidth="1"/>
              <path d="M2 12l3-3.5 2 2 4-4.5 3 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={isLoading || disabled}
            rows={1}
            className="flex-1 bg-white border border-spring-300 rounded-lg px-4 py-3 text-sm text-bark-800 placeholder-bark-500/50 focus:outline-none focus:border-spring-500 resize-none font-mono disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-spring-500 hover:bg-spring-400 text-white px-4 py-3 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-spring-100 border-t-white rounded-full animate-spin" />
            ) : (
              '\u279C'
            )}
          </button>
        </div>

        {/* Drag overlay hint */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-spring-200/80 rounded-lg pointer-events-none">
            <p className="text-sm text-bark-600 font-medium">Drop files here</p>
          </div>
        )}
      </div>
    </div>
  );
}
