import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export default function PdfDetail() {
  const { slug } = useParams();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const currentUrl = window.location.href;

  const { data: pdf, isLoading, error } = useQuery({
    queryKey: ['pdf', slug],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/pdfs/${slug}`);
      return res.data;
    }
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const incrementDownloadCount = async () => {
    if (!pdf) return;
    try {
      await axios.post(`${API_URL}/pdfs/${pdf.id}/download`);
    } catch (err) {
      console.warn('Could not record download event.');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">Loading PDF details...</div>;
  }

  if (error || !pdf) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 space-y-4">
        <h2 className="text-2xl font-bold">PDF Not Found</h2>
        <p className="text-zinc-500">The requested academic file does not exist or has been removed.</p>
        <Link to="/explorer"><Button>Back to Explorer</Button></Link>
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`;
  const displayPdfUrl = pdf.storage_url;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <Link to="/explorer" className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:underline">← Back to Explorer</Link>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2">{pdf.pdf_title}</h1>
            <p className="text-zinc-500 mt-1">{pdf.subject} • By {pdf.teacher_name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopyLink} className="border-zinc-200 dark:border-zinc-800">
              {copied ? 'Copied! ✅' : 'Copy Link'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowQr(!showQr)} className="border-zinc-200 dark:border-zinc-800">
              {showQr ? 'Hide QR' : 'QR Code'}
            </Button>
            <a href={displayPdfUrl} onClick={incrementDownloadCount} download target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-black text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold">
                Download Notes
              </Button>
            </a>
          </div>
        </header>

        {/* QR Code display */}
        {showQr && (
          <div className="flex justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-sm mx-auto shadow-md">
            <div className="text-center space-y-3">
              <img src={qrCodeUrl} alt="PDF Sharing QR Code" className="mx-auto rounded border p-2 bg-white" />
              <p className="text-xs text-zinc-500 font-medium">Scan this QR code to view notes on mobile device.</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main built-in PDF viewer container */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-md">
              <CardHeader className="bg-zinc-50 dark:bg-zinc-800/40 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <CardTitle className="text-sm font-bold">Built-In PDF Viewer</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[600px]">
                {displayPdfUrl ? (
                  <iframe 
                    src={displayPdfUrl} 
                    title={pdf.pdf_title}
                    className="w-full h-full border-none"
                    allow="autoplay"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-zinc-100 dark:bg-zinc-800">
                    <p className="text-zinc-500 text-sm mb-4">No preview URL available for this resource.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details Sidebar */}
          <div className="space-y-4">
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Document Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase">Description</label>
                  <p className="text-sm mt-1 text-zinc-700 dark:text-zinc-300">
                    {pdf.description || 'No description provided by the instructor.'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase">Branch</label>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{pdf.branch}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase">Academic Year</label>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Year {pdf.year} - Sem {pdf.semester}</p>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Total Downloads:</span>
                    <span className="font-semibold">{pdf.downloads}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Instructor:</span>
                    <span className="font-semibold">{pdf.teacher_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
