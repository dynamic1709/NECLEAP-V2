import axios from 'axios';
import { API_URL } from '../context/AuthContext';

/**
 * Downloads a PDF file with a specific naming convention: TeacherName_PdfName_ApplicationName.pdf
 * Directly downloads to the user's local device storage.
 * Falls back to opening the storage URL in a new tab if direct blob downloading fails (e.g. CORS).
 *
 * @param {Object} pdf - The PDF details object
 * @param {string} pdf.id - PDF Database ID (used to increment download count)
 * @param {string} pdf.pdf_title - PDF Title
 * @param {string} pdf.teacher_name - Teacher Name
 * @param {string} pdf.storage_url - Direct download URL
 */
export const downloadPdf = async (pdf) => {
  if (!pdf || !pdf.storage_url) {
    console.error('Invalid PDF data for download');
    return;
  }

  // Increment download count first (non-blocking)
  if (pdf.id) {
    axios.post(`${API_URL}/pdfs/${pdf.id}/download`).catch((err) => {
      console.warn('Could not increment download count on backend:', err);
    });
  }

  try {
    // Attempt direct blob download to enforce the custom filename
    const response = await fetch(pdf.storage_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Clean string helper: replace non-alphanumeric chars with underscore
    const sanitize = (str) => {
      if (!str) return 'unnamed';
      return str
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '_') // Replace special characters and spaces with underscores
        .replace(/_+/g, '_')           // Deduplicate consecutive underscores
        .replace(/^_+|_+$/g, '');       // Trim leading/trailing underscores
    };

    const teacherName = sanitize(pdf.teacher_name || 'Teacher');
    const subjectName = sanitize(pdf.subject || 'Subject');
    const pdfTitle = sanitize(pdf.pdf_title || 'Notes');
    const filename = `${teacherName}_${subjectName}_${pdfTitle}.pdf`;

    // Trigger local download using a hidden anchor element
    const localUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = localUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(localUrl);
  } catch (error) {
    console.warn('CORS or network error during direct blob download. Falling back to default browser download:', error);
    // Fallback: Open in new tab which triggers default browser behavior
    const link = document.createElement('a');
    link.href = pdf.storage_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }
};
