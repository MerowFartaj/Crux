import React, { useRef, useState, useEffect, useCallback } from 'react';

interface Props {
  url: string;
}

const WebPreview: React.FC<Props> = ({ url: initialUrl }) => {
  const webviewRef = useRef<any>(null);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const handleStartLoading = () => { setLoading(true); setError(null); };
    const handleStopLoading = () => {
      setLoading(false);
      setCanGoBack(wv.canGoBack());
      setCanGoForward(wv.canGoForward());
    };
    const handleNavigate = (e: any) => {
      setCurrentUrl(e.url);
    };
    const handleTitle = (e: any) => {
      setTitle(e.title || '');
    };
    const handleError = (e: any) => {
      // Ignore aborted loads (user navigated away)
      if (e.errorCode === -3) return;
      setError(`Failed to load: ${e.errorDescription || 'Unknown error'}`);
      setLoading(false);
    };
    const handleNewWindow = (e: any) => {
      // Open external links in system browser
      e.preventDefault();
      window.electronAPI.shell.openExternal(e.url);
    };

    wv.addEventListener('did-start-loading', handleStartLoading);
    wv.addEventListener('did-stop-loading', handleStopLoading);
    wv.addEventListener('did-navigate', handleNavigate);
    wv.addEventListener('did-navigate-in-page', handleNavigate);
    wv.addEventListener('page-title-updated', handleTitle);
    wv.addEventListener('did-fail-load', handleError);
    wv.addEventListener('new-window', handleNewWindow);

    return () => {
      wv.removeEventListener('did-start-loading', handleStartLoading);
      wv.removeEventListener('did-stop-loading', handleStopLoading);
      wv.removeEventListener('did-navigate', handleNavigate);
      wv.removeEventListener('did-navigate-in-page', handleNavigate);
      wv.removeEventListener('page-title-updated', handleTitle);
      wv.removeEventListener('did-fail-load', handleError);
      wv.removeEventListener('new-window', handleNewWindow);
    };
  }, []);

  const goBack = useCallback(() => webviewRef.current?.goBack(), []);
  const goForward = useCallback(() => webviewRef.current?.goForward(), []);
  const reload = useCallback(() => { setError(null); webviewRef.current?.reload(); }, []);
  const openExternal = useCallback(() => {
    window.electronAPI.shell.openExternal(currentUrl);
  }, [currentUrl]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
        <div className="text-[#EF4444] text-sm font-medium">Page failed to load</div>
        <div className="text-[#64748B] text-xs font-mono break-all max-w-md text-center">{currentUrl}</div>
        <div className="text-[#64748B] text-[10px]">{error}</div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={reload}
            className="px-3 py-1.5 text-xs bg-[#1E1E2E] text-[#E2E8F0] rounded-lg hover:bg-[#2A2A3E] transition-colors border border-[#3E3E4E]"
          >Retry</button>
          <button
            onClick={openExternal}
            className="px-3 py-1.5 text-xs bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors border border-blue-500/30"
          >Open in Browser</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Navigation bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[#0A0A0F] border-b border-[#1E1E2E] flex-shrink-0">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className={`px-1.5 py-0.5 text-sm rounded transition-colors ${canGoBack ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E1E2E]' : 'text-[#3E3E4E] cursor-not-allowed'}`}
          title="Back"
        >◀</button>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className={`px-1.5 py-0.5 text-sm rounded transition-colors ${canGoForward ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E1E2E]' : 'text-[#3E3E4E] cursor-not-allowed'}`}
          title="Forward"
        >▶</button>
        <button
          onClick={reload}
          className="px-1.5 py-0.5 text-sm text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E1E2E] rounded transition-colors"
          title="Refresh"
        >↻</button>

        {/* URL bar */}
        <div className="flex-1 bg-[#1E1E2E] border border-[#3E3E4E] rounded px-2 py-0.5 text-[10px] text-[#94A3B8] font-mono truncate mx-1">
          {loading && <span className="text-blue-400 mr-1">●</span>}
          {currentUrl}
        </div>

        <button
          onClick={openExternal}
          className="px-1.5 py-0.5 text-[10px] text-[#64748B] hover:text-[#E2E8F0] hover:bg-[#1E1E2E] rounded transition-colors"
          title="Open in system browser"
        >↗</button>
      </div>

      {/* Loading bar */}
      {loading && (
        <div className="h-0.5 bg-[#0A0A0F] flex-shrink-0 overflow-hidden">
          <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
        </div>
      )}

      {/* Webview */}
      <webview
        ref={webviewRef}
        src={initialUrl}
        style={{ flex: 1, border: 'none' }}
        {...{
          allowpopups: 'false',
          nodeintegration: 'false',
        } as any}
        partition="persist:crux-preview"
      />
    </div>
  );
};

export default WebPreview;
