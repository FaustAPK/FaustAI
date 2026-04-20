import {makeAutoObservable, runInAction} from 'mobx';
import {makePersistable} from 'mobx-persist-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {supabase} from './supabase';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  APP_URL,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from '@env';
import type {User, Session} from '@supabase/supabase-js';
// import {
//   GoogleSignin,
//   statusCodes,
// } from '@react-native-google-signin/google-signin'; // Удалено

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  provider_user_id?: string;
  provider_profile_url?: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

class AuthService {
  user: User | null = null;
  profile: Profile | null = null;
  session: Session | null = null;
  isLoading: boolean = false;
  isAuthenticated: boolean = false;
  error: string | null = null;

  constructor() {
    try {
      makeAutoObservable(this);
      makePersistable(this, {
        name: 'AuthService',
        properties: ['profile'], // Only persist profile, let Supabase handle session
        storage: AsyncStorage,
      });

      // Check if Supabase is properly configured
      if (this.isSupabaseConfigured()) {
        console.log(
          'AuthService: Supabase is configured, initializing auth listener',
        );
        // Listen for auth state changes
        this.initAuthListener();
        // Configure Google Sign-In (disabled)
        // this.configureGoogleSignIn(); // Удалено
        // Check for existing session
        this.checkExistingSession().then(() => {
          console.log('AuthService: Session restoration completed');
        });
      } else {
        console.warn(
          'Supabase not configured - PalsHub features will be disabled',
        );
        this.isAuthenticated = false;
      }

      console.log('AuthService: Constructor completed successfully');
    } catch (error) {
      console.error('AuthService: Error in constructor:', error);
      throw error;
    }
  }

  private isSupabaseConfigured(): boolean {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  private initAuthListener() {
    if (!supabase) {
      console.warn(