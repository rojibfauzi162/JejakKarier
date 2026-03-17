
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to CDN for simplicity in this environment
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

  useEffect(() => {
    let isMounted = true;
    const renderPdf = async () => {
      if (!url) return;
      setLoading(true);
      setError(null);

      try {
        const loadingTask = pdfjsLib.getDocument(url);
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
        if (isMounted) setLoading(false);
      } catch (err: any) {
        console.error('Error rendering PDF:', err);
        if (isMounted) {
          setError('Gagal memuat PDF. Silakan coba buka di tab baru atau download.');
          setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      isMounted = false;
    };
  }, [url, currentPage]);

  return (
    <div className={`flex flex-col items-center bg-slate-100 rounded-xl overflow-hidden ${className}`}>
      {loading && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Memuat Sertifikat...</p>
        </div>
      )}
      
      {error && (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm font-bold text-slate-600">{error}</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noreferrer" 
            className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all"
          >
            Buka di Tab Baru
          </a>
        </div>
      )}

      {!loading && !error && (
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
