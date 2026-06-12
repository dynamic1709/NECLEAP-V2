import React, { useState } from 'react';
import { IoClose, IoStar, IoStarOutline, IoCheckmarkCircle } from 'react-icons/io5';

export default function FeedbackModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !branch || !rating || !comments) {
      setError('Please fill out all fields and select a rating.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create FormData just like the original HTML form
      const formData = new FormData();
      formData.append('email', email);
      formData.append('branch', branch);
      formData.append('rating', rating.toString());
      formData.append('comments', comments);

      const url = "https://script.google.com/macros/s/AKfycbwWzCDisK9mh0LcRLnnbRqoE8gzc7ysfOxF5KztugZm23Y_RSDM570ryhBiny081PHl/exec";

      // mode: 'no-cors' prevents browser block issues due to Google Sheets redirect (302) response headers
      await fetch(url, {
        method: 'POST',
        body: formData,
        mode: 'no-cors',
      });

      // Since mode: 'no-cors' will not return response content or ok=true status,
      // we assume success as long as fetch does not throw an exception (network fail).
      setSuccess(true);
      setEmail('');
      setBranch('');
      setRating(0);
      setComments('');
    } catch (err) {
      console.error('Feedback submit error:', err);
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-2xl text-zinc-900 dark:text-zinc-50 transition-all duration-300">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
          aria-label="Close modal"
        >
          <IoClose size={24} />
        </button>

        {success ? (
          /* Success State */
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-scale-up">
            <IoCheckmarkCircle className="text-emerald-500 text-6xl" />
            <h3 className="text-2xl font-extrabold tracking-tight">Feedback Submitted!</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
              Thank you for sharing your thoughts! We value your input to make NEC LEAP better.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                onClose();
              }}
              className="mt-6 px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-md text-sm"
            >
              Close Window
            </button>
          </div>
        ) : (
          /* Form State */
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold tracking-tight">We value your feedback! 💬</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Help us improve the platform by telling us what you think.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 p-3 text-xs text-red-600 dark:text-red-400 font-semibold">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="fb-email" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Your Email
                </label>
                <input
                  id="fb-email"
                  type="email"
                  required
                  placeholder="e.g. name@student.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="fb-branch" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Your Name & Branch
                </label>
                <input
                  id="fb-branch"
                  type="text"
                  required
                  placeholder="e.g. Dhanush - CSE(AI)"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Your Rating
                </label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = hoverRating ? star <= hoverRating : star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-3xl text-zinc-300 hover:scale-110 transition-transform focus:outline-none"
                      >
                        {isFilled ? (
                          <IoStar className="text-amber-400 drop-shadow-sm" />
                        ) : (
                          <IoStarOutline className="text-zinc-300 dark:text-zinc-700" />
                        )}
                      </button>
                    );
                  })}
                  {rating > 0 && (
                    <span className="text-xs font-bold text-amber-500 ml-2">
                      {rating} / 5
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="fb-comments" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Your Comments
                </label>
                <textarea
                  id="fb-comments"
                  required
                  rows={4}
                  placeholder="Tell us what you liked, what's broken, or what features you'd like to see next..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:bg-zinc-400 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed transition-all shadow-md text-sm flex items-center justify-center"
              >
                {loading ? 'Submitting Feedback...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
