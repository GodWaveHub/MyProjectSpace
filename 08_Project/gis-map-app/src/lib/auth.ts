import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
  type UserCredential
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * ユーザー登録（メール/パスワード）
 */
export const registerUser = async (email: string, password: string, displayName?: string): Promise<User> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // 表示名を設定
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // メール確認を送信
    if (userCredential.user) {
      await sendEmailVerification(userCredential.user);
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * ログイン（メール/パスワード）
 */
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Googleログイン
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential: UserCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error: any) {
    console.error('Google login error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * ログアウト
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error('ログアウトに失敗しました');
  }
};

/**
 * パスワードリセットメールを送信
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * 認証状態の監視
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * 現在のユーザーを取得
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Firebaseエラーコードを日本語メッセージに変換
 */
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'このメールアドレスは既に使用されています';
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません';
    case 'auth/operation-not-allowed':
      return 'この操作は許可されていません';
    case 'auth/weak-password':
      return 'パスワードが弱すぎます（6文字以上必要です）';
    case 'auth/user-disabled':
      return 'このアカウントは無効化されています';
    case 'auth/user-not-found':
      return 'ユーザーが見つかりません';
    case 'auth/wrong-password':
      return 'パスワードが間違っています';
    case 'auth/too-many-requests':
      return '試行回数が多すぎます。しばらく待ってから再試行してください';
    case 'auth/network-request-failed':
      return 'ネットワークエラーが発生しました';
    case 'auth/popup-closed-by-user':
      return 'ポップアップが閉じられました';
    case 'auth/cancelled-popup-request':
      return 'ポップアップリクエストがキャンセルされました';
    default:
      return '認証エラーが発生しました';
  }
};
