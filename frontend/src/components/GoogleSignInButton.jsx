import React, { useEffect, useRef, useState } from 'react';

export const GoogleSignInButton = ({ onSuccess, onError, disabled = false }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1089234857291-demo_google_client_id.apps.googleusercontent.com';

  useEffect(() => {
    const handleCredentialResponse = async (response) => {
      if (!response || !response.credential) {
        const msg = 'Google authentication response failed.';
        setErrorMsg(msg);
        if (onError) onError(msg);
        return;
      }

      try {
        setLoading(true);
        setErrorMsg('');
        if (onSuccess) {
          await onSuccess(response.credential);
        }
      } catch (err) {
        console.error('Google auth backend verification error:', err);
        const msg = err.response?.data?.detail || 'Google authentication failed. Please try again.';
        setErrorMsg(msg);
        if (onError) onError(msg);
      } finally {
        setLoading(false);
      }
    };

    const setupGoogleAuth = () => {
      if (window.google?.accounts?.id) {
        setScriptLoaded(true);
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
          });

          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(containerRef.current, {
              theme: 'outline',
              size: 'large',
              width: containerRef.current.offsetWidth || 356,
              type: 'standard',
              shape: 'rectangular',
              text: 'continue_with',
              logo_alignment: 'center'
            });
          }
        } catch (err) {
          console.warn('Google Identity initialization notice:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogleAuth();
    } else {
      const existingScript = document.getElementById('google-gsi-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = setupGoogleAuth;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', setupGoogleAuth);
      }
    }
  }, [clientId, onSuccess, onError]);

  const handleCustomClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setErrorMsg('Google Sign-In service loading... Please try again in a moment.');
    }
  };

  return (
    <div style={{ width: '100%', marginTop: '16px' }}>
      {errorMsg && (
        <div style={{
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          fontSize: '0.85rem',
          marginBottom: '10px',
          textAlign: 'center',
          border: '1px solid #fecaca'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Official Google render button container */}
      <div 
        ref={containerRef} 
        style={{
          width: '100%',
          minHeight: '44px',
          display: scriptLoaded && !loading ? 'flex' : 'none',
          justifyContent: 'center'
        }} 
      />

      {/* Custom styled Fallback / Loading button */}
      {(!scriptLoaded || loading) && (
        <button
          type="button"
          onClick={handleCustomClick}
          disabled={disabled || loading}
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '4px',
            border: '1px solid var(--border-color, #dadce0)',
            backgroundColor: '#ffffff',
            color: '#3c4043',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'Roboto, arial, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: loading ? 'wait' : 'pointer',
            transition: 'background-color 0.2s, box-shadow 0.2s',
            boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
          }}
        >
          {loading ? (
            <span>Verifying Google Login...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.617z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
