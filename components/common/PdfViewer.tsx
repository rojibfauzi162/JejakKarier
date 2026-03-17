
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Use a more standard worker URL from cdnjs which is often more reliable than unpkg for some environments
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
  className?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: any = null;

    const renderPdf = async () => {
      if (!url) return;
      setLoading(true);
      setError(null);
      setUseFallback(false);

      // Set a safety timeout: if PDF doesn't render in 7 seconds, use fallback
      timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          console.warn('PDF rendering timed out, switching to fallback');
          setUseFallback(true);
          setLoading(false);
        }
      }, 7000);

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: url,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });
        
        const pdf = await loadingTask.promise;
        
        if (!isMounted) return;
        setNumPages(pdf.numPages);

        const page = await pdf.getPage(currentPage);
        if (!isMounted) return;

        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext: any = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error rendering PDF:', err);
        if (isMounted) {
          clearTimeout(timeoutId);
          setUseFallback(true);
          setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [url, currentPage]);

  if (useFallback) {
    return (
      <div className={`flex flex-col bg-slate-100 rounded-xl overflow-hidden ${className}`}>
        <div className="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Mode Pratinjau Alternatif</span>
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
          </div>
          <div className="flex gap-3">
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer" 
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              Buka Tab Baru
            </a>
            <a 
              href={url} 
              download="sertifikat.pdf"
              className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:underline"
            >
              Download
            </a>
          </div>
        </div>
        <iframe 
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0`} 
          className="w-full flex-1 border-none min-h-[400px]" 
          title="PDF Fallback Viewer"
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center bg-slate-100 rounded-xl overflow-hidden ${className}`}>
      {loading && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Memuat Sertifikat...</p>
        </div>
      )}
      
      {error && !useFallback && (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm font-bold text-slate-600">{error}</p>
          <div className="flex gap-3">
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer" 
              className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all"
            >
              Buka di Tab Baru
            </a>
            <button 
              onClick={() => setUseFallback(true)}
              className="px-6 py-3 bg-slate-200 text-slate-700 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all"
            >
              Gunakan Fallback
            </button>
          </div>
        </div>
      )}

      {!loading && !error && !useFallback && (
        <div className="w-full flex flex-col items-center">
          <div className="w-full overflow-auto flex justify-center p-4">
            <canvas ref={canvasRef} className="max-w-full shadow-lg rounded-lg" />
          </div>
          
          {numPages > 1 && (
            <div className="flex items-center gap-4 p-4 border-t border-slate-200 w-full justify-center bg-white">
              <button 
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 bg-slate-100 rounded-lg disabled:opacity-30"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Halaman {currentPage} / {numPages}</span>
              <button 
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 bg-slate-100 rounded-lg disabled:opacity-30"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
