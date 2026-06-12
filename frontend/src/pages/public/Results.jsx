import React from 'react';
import PublicHeader from '../../components/layout/PublicHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { IoOpenOutline, IoWarningOutline } from 'react-icons/io5';

export default function Results() {
  const resultsUrl = 'https://gedc.campx.in/nrtec/ums/results';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col transition-colors duration-300">
      <PublicHeader />

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        <header className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">UMS Academic Results Portal</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Access your semester grades and exams results directly from the Narasaraopet Engineering College portal.
          </p>
        </header>

        {/* Security Warning Notice */}
        <div className="flex gap-3 items-start p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-xs md:text-sm text-amber-800 dark:text-amber-300">
          <IoWarningOutline className="text-xl flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Important Notice:</span>
            <p>
              Some browser settings or security headers may block the UMS Portal from displaying inside this inline frame.
              If the area below remains blank or fails to load, please click the button on the right to open it directly.
            </p>
          </div>
          <a
            href={resultsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex-shrink-0"
          >
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none text-xs flex items-center gap-1.5 font-bold">
              Open in New Tab <IoOpenOutline />
            </Button>
          </a>
        </div>

        {/* Embedded Iframe Container */}
        <Card className="flex-1 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-lg flex flex-col min-h-[600px]">
          <CardHeader className="bg-zinc-50 dark:bg-zinc-800/40 py-3 border-b border-zinc-200 dark:border-zinc-850 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              UMS Embedded Browser
            </CardTitle>
            <span className="text-xs font-semibold text-zinc-400 select-none hidden md:inline">
              gedc.campx.in/nrtec/ums/results
            </span>
          </CardHeader>
          <CardContent className="p-0 flex-1 relative">
            <iframe
              src={resultsUrl}
              title="NEC UMS Results Portal"
              className="absolute inset-0 w-full h-full border-none bg-white"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
