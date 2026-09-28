import Constants, { ExecutionEnvironment } from 'expo-constants';
import { GOOGLE_WEB_CLIENT_ID } from '../config/env';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

let GoogleSignin = null;
if (!isExpoGo) {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  } catch (e) {
    console.log('[GoogleAuth] Native module not loaded:', e?.message);
  }
}

let configured = false;

// Safe to call multiple times / from multiple screens.
export function configureGoogleSignin() {
  if (configured || !GoogleSignin) return;
  try {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    configured = true;
  } catch (e) {
    console.log('[GoogleAuth] configure error:', e?.message);
  }
}

// GoogleSignin.signIn() changed shape in v13: it now resolves to
// `{ type: 'success' | 'cancelled', data: User }`, while older versions
// resolved directly to the User. This normalises both so callers never have to
// care which version is installed.
export async function signInWithGoogle() {
  if (isExpoGo || !GoogleSignin) {
    throw new Error('Google Sign-In requires an APK build and is not supported in Expo Go.');
  }
  configureGoogleSignin();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  const type = response?.type ?? (response?.idToken ? 'success' : undefined);

  if (type === 'cancelled') {
    const error = new Error('Google Sign-In was cancelled.');
    error.code = 'SIGN_IN_CANCELLED';
    throw error;
  }

  const user = response?.data ?? response;
  const idToken = user?.idToken;

  if (!idToken) {
    const error = new Error(
      'Google did not return an ID token. Check the Google OAuth client (SHA-1) and google-services.json setup.'
    );
    error.code = 'NO_ID_TOKEN';
    throw error;
  }

  return { idToken, user };
}

// True when the user simply backed out of the Google sheet, so we can stay
// silent instead of showing a scary "failed" alert.
export function isGoogleSignInCancelled(error) {
  const code = error?.code;
  return code === 'SIGN_IN_CANCELLED' || code === '12501'; // 12501 = legacy statusCodes.SIGN_IN_CANCELLED
}
