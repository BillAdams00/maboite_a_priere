'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [isReady, setIsReady] = useState(false);

  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    // Si aucune clé n'est fournie (développement local sans Turnstile), on simule un jeton dev
    if (!siteKey) {
      onVerifyRef.current('dev-mock-turnstile-token');
      return;
    }

    const scriptId = 'cloudflare-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const renderWidget = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              onVerifyRef.current(token);
            },
            'expired-callback': () => {
              if (onExpireRef.current) onExpireRef.current();
            },
            theme: 'auto',
          });
          widgetIdRef.current = id;
          setIsReady(true);
        } catch (err) {
          console.warn('Erreur initialisation Turnstile :', err);
        }
      }
    };

    // Callback officiel Cloudflare Turnstile
    (window as any).onTurnstileLoaded = () => {
      renderWidget();
    };

    // Polling de sécurité si window.turnstile devient disponible et vérification du champ caché
    const intervalId = setInterval(() => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        renderWidget();
      }
      if (containerRef.current) {
        const input = containerRef.current.querySelector<HTMLInputElement>(
          'input[name="cf-turnstile-response"]'
        );
        if (input && input.value) {
          onVerifyRef.current(input.value);
        }
      }
      if (widgetIdRef.current) {
        // Continue monitoring until token is retrieved, then slower
      }
    }, 150);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoaded';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.turnstile) renderWidget();
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    }

    return () => {
      clearInterval(intervalId);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {}
      }
    };
  }, [siteKey]);

  if (!siteKey) {
    return (
      <div className="text-[11px] text-encre-subtile italic py-1">
        🛡️ Protection anti-robot active (mode dev)
      </div>
    );
  }

  return (
    <div className="flex justify-center my-3 min-h-[65px]">
      <div ref={containerRef} />
    </div>
  );
}
