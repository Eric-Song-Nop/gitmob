import { useState, useCallback } from 'react';
import { Platform, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { request } from '@octokit/request';
import { useAuthStore } from '@/stores/authStore';
import { GITHUB_CLIENT_ID, GITHUB_SCOPES } from '@/constants/github';

// Web: proxy OAuth requests through Metro dev server to bypass CORS
const webRequest = request.defaults({ baseUrl: '/proxy/github' });

type AuthStatus = 'idle' | 'awaiting_code' | 'polling' | 'success' | 'error';

export function useGitHubAuth() {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [userCode, setUserCode] = useState('');
  const [verificationUri, setVerificationUri] = useState('');
  const [error, setError] = useState('');
  const { setToken, fetchUser } = useAuthStore();

  const login = useCallback(async () => {
    try {
      setStatus('awaiting_code');
      setError('');

      const auth = createOAuthDeviceAuth({
        clientType: 'oauth-app',
        clientId: GITHUB_CLIENT_ID,
        scopes: [...GITHUB_SCOPES],
        onVerification: (verification) => {
          setUserCode(verification.user_code);
          setVerificationUri(verification.verification_uri);
          setStatus('polling');
        },
        ...(Platform.OS === 'web' && { request: webRequest }),
      });

      // Triggers Device Flow: request device code -> poll for token
      const { token } = await auth({ type: 'oauth' });

      await setToken(token);
      await fetchUser();
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [setToken, fetchUser]);

  const copyCodeAndOpenBrowser = useCallback(async () => {
    await Clipboard.setStringAsync(userCode);
    await Linking.openURL(verificationUri);
  }, [userCode, verificationUri]);

  return {
    status,
    userCode,
    verificationUri,
    error,
    login,
    copyCodeAndOpenBrowser,
  };
}
