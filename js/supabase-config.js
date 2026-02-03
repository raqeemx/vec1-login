/**
 * ========================================
 * 🔷 Supabase Configuration File - Enhanced v2.0
 * ========================================
 * 
 * هذا الملف يحتوي على إعدادات Supabase
 * وجميع الدوال المساعدة للتعامل مع قاعدة البيانات والمصادقة
 * 
 * This file contains Supabase configuration
 * and all helper functions for database and authentication
 * 
 * ✅ Fixed: supabaseClient is null error
 * ✅ Added: Robust initialization with retry mechanism
 * ✅ Added: Global client access
 */

// ========================================
// Supabase Configuration
// ========================================
const SUPABASE_URL = 'https://enrlrqjsgcpcggyuoazr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucmxycWpzZ2NwY2dneXVvYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODU0MjQsImV4cCI6MjA4Mzg2MTQyNH0.hV1-XB-CKIlRaqib8sTZjxzlbZO_5kUuI6L0OT2Wlvs';

// ========================================
// Global Supabase Client
// ========================================
let _supabaseClient = null;
let _initPromise = null;
let _initAttempts = 0;
const MAX_INIT_ATTEMPTS = 5;
const INIT_RETRY_DELAY = 500;

/**
 * Initialize Supabase client with retry mechanism
 * @returns {Promise<object|null>} Supabase client or null
 */
function initSupabase() {
    // Return existing promise if initialization is in progress
    if (_initPromise) {
        return _initPromise;
    }
    
    // Return client if already initialized
    if (_supabaseClient) {
        return Promise.resolve(_supabaseClient);
    }
    
    _initPromise = new Promise((resolve) => {
        const tryInit = () => {
            _initAttempts++;
            
            // Check if Supabase library is loaded
            if (typeof window !== 'undefined' && 
                typeof window.supabase !== 'undefined' && 
                typeof window.supabase.createClient === 'function') {
                
                try {
                    _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    console.log('✅ Supabase initialized successfully (attempt ' + _initAttempts + ')');
                    _initPromise = null;
                    resolve(_supabaseClient);
                } catch (error) {
                    console.error('❌ Error creating Supabase client:', error);
                    _initPromise = null;
                    resolve(null);
                }
            } else if (_initAttempts < MAX_INIT_ATTEMPTS) {
                console.log('⏳ Waiting for Supabase library... (attempt ' + _initAttempts + ')');
                setTimeout(tryInit, INIT_RETRY_DELAY);
            } else {
                console.error('❌ Supabase library failed to load after ' + MAX_INIT_ATTEMPTS + ' attempts');
                _initPromise = null;
                resolve(null);
            }
        };
        
        tryInit();
    });
    
    return _initPromise;
}

/**
 * Get the Supabase client (synchronous - may return null if not initialized)
 * @returns {object|null} Supabase client
 */
function getSupabaseClient() {
    return _supabaseClient;
}

/**
 * Get the Supabase client (async - waits for initialization)
 * @returns {Promise<object|null>} Supabase client
 */
async function getSupabaseClientAsync() {
    if (_supabaseClient) {
        return _supabaseClient;
    }
    return await initSupabase();
}

/**
 * Check if Supabase is initialized
 * @returns {boolean}
 */
function isSupabaseInitialized() {
    return _supabaseClient !== null;
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
        initSupabase();
    }
}

// ========================================
// Authentication Functions
// ========================================
const SupabaseAuth = {
    /**
     * Get Supabase client with null check
     */
    async _getClient() {
        const client = await getSupabaseClientAsync();
        if (!client) {
            throw new Error('Supabase not initialized. Please refresh the page.');
        }
        return client;
    },

    /**
     * Get current user
     */
    async getCurrentUser() {
        try {
            const client = await this._getClient();
            const { data: { user }, error } = await client.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    /**
     * Get current session
     */
    async getSession() {
        try {
            const client = await this._getClient();
            const { data: { session }, error } = await client.auth.getSession();
            if (error) throw error;
            return session;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    },

    /**
     * Sign up with email and password
     */
    async signUp(email, password, displayName) {
        const client = await this._getClient();
        
        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                    full_name: displayName
                }
            }
        });
        
        if (error) throw error;
        
        // Create user profile in database
        if (data.user) {
            try {
                await SupabaseDB.createUserProfile(data.user.id, {
                    name: displayName,
                    email: email
                });
            } catch (profileError) {
                console.warn('Could not create user profile:', profileError);
            }
        }
        
        return data;
    },

    /**
     * Sign in with email and password
     */
    async signIn(email, password) {
        const client = await this._getClient();
        
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        return data;
    },

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        const client = await this._getClient();
        
        const { data, error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        });
        
        if (error) throw error;
        return data;
    },

    /**
     * Sign in with Microsoft/Azure
     */
    async signInWithMicrosoft() {
        const client = await this._getClient();
        
        const { data, error } = await client.auth.signInWithOAuth({
            provider: 'azure',
            options: {
                redirectTo: window.location.origin + '/dashboard.html',
                scopes: 'email profile openid'
            }
        });
        
        if (error) throw error;
        return data;
    },

    /**
     * Sign out
     */
    async signOut() {
        const client = await this._getClient();
        
        const { error } = await client.auth.signOut();
        if (error) throw error;
        
        // Clear local storage
        localStorage.removeItem('vehicleData');
        localStorage.removeItem('currentVehicle');
        
        return true;
    },

    /**
     * Send password reset email
     */
    async resetPassword(email) {
        const client = await this._getClient();
        
        const { data, error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/index.html?reset=true'
        });
        
        if (error) throw error;
        return data;
    },

    /**
     * Update password
     */
    async updatePassword(newPassword) {
        const client = await this._getClient();
        
        const { data, error } = await client.auth.updateUser({
            password: newPassword
        });
        
        if (error) throw error;
        return data;
    },

    /**
     * Listen to auth state changes
     */
    onAuthStateChange(callback) {
        const client = getSupabaseClient();
        if (!client) {
            console.warn('Supabase not initialized for auth state change listener');
            return null;
        }
        
        return client.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    },

    /**
     * Convert Supabase error to Arabic message
     */
    getErrorMessage(error) {
        const errorMessages = {
            'Invalid login credentials': 'بيانات الدخول غير صحيحة',
            'User already registered': 'البريد الإلكتروني مستخدم بالفعل',
            'Password should be at least 6 characters': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            'Invalid email': 'البريد الإلكتروني غير صالح',
            'Email not confirmed': 'يرجى تأكيد البريد الإلكتروني',
            'User not found': 'المستخدم غير موجود',
            'Too many requests': 'تم تجاوز عدد المحاولات. يرجى الانتظار',
            'Network error': 'خطأ في الاتصال بالإنترنت',
            'Email rate limit exceeded': 'تم تجاوز حد الإرسال. حاول لاحقاً',
            'Signup disabled': 'التسجيل معطل حالياً',
            'For security purposes': 'لأسباب أمنية، يرجى الانتظار قبل المحاولة مرة أخرى',
            'Supabase not initialized': 'لم يتم تحميل النظام. يرجى تحديث الصفحة'
        };
        
        const errorMsg = error.message || error.toString();
        
        for (const [key, value] of Object.entries(errorMessages)) {
            if (errorMsg.includes(key)) {
                return value;
            }
        }
        
        return errorMsg;
    }
};

// ========================================
// Database Functions
// ========================================
const SupabaseDB = {
    /**
     * Get Supabase client with null check
     */
    async _getClient() {
        const client = await getSupabaseClientAsync();
        if (!client) {
            throw new Error('Supabase not initialized');
        }
        return client;
    },

    /**
     * Create user profile
     */
    async createUserProfile(userId, profileData) {
        const client = await this._getClient();
        
        const { data, error } = await client
            .from('users')
            .upsert({
                id: userId,
                name: profileData.name,
                email: profileData.email,
                photo_url: profileData.photoURL || null,
                provider: profileData.provider || 'email',
                settings: {
                    darkMode: false,
                    language: 'ar',
                    notifications: true
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        return data;
    },

    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        const client = await this._getClient();
        
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Update user profile
     */
    async updateUserProfile(userId, updates) {
        const client = await this._getClient();
        
        const { data, error } = await client
            .from('users')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) throw error;
        return data;
    },

    /**
     * Get all vehicles for user
     */
    async getVehicles(userId) {
        const client = await this._getClient();
        
        const { data, error } = await client
            .from('vehicles')
            .select('*')
            .eq('user_id', userId)
            .eq('deleted', false)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    },

    /**
     * Get single vehicle
     */
    async getVehicle(userId, vehicleId) {
        const client = await this._getClient();
        
        const { data, error } = await client
            .from('vehicles')
            .select('*')
            .eq('id', vehicleId)
            .eq('user_id', userId)
            .single();
        
        if (error) throw error;
        return data;
    },

    /**
     * Create vehicle
     */
    async createVehicle(userId, vehicleData) {
        const client = await this._getClient();
        
        const { data, error } = await client
            .from('vehicles')
            .insert({
                ...vehicleData,
                user_id: userId,
                deleted: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    /**
     * Update vehicle
     */
    async updateVehicle(userId, vehicleId, updates) {
        const client = await this._getClient();
        
        const { data, error } = await client
            .from('vehicles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', vehicleId)
            .eq('user_id', userId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    /**
     * Delete vehicle (soft delete)
     */
    async deleteVehicle(userId, vehicleId) {
        const client = await this._getClient();
        
        const { data, error } = await client
            .from('vehicles')
            .update({
                deleted: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', vehicleId)
            .eq('user_id', userId);
        
        if (error) throw error;
        return data;
    },

    /**
     * Hard delete vehicle
     */
    async permanentDeleteVehicle(userId, vehicleId) {
        const client = await this._getClient();
        
        const { data, error } = await client
            .from('vehicles')
            .delete()
            .eq('id', vehicleId)
            .eq('user_id', userId);
        
        if (error) throw error;
        return data;
    },

    /**
     * Get activity logs
     */
    async getActivityLogs(userId, limit = 50) {
        const client = await this._getClient();
        
        const { data, error } = await client
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data || [];
    },

    /**
     * Log activity
     */
    async logActivity(userId, activityType, details) {
        try {
            const client = await this._getClient();
            
            const { data, error } = await client
                .from('activity_logs')
                .insert({
                    user_id: userId,
                    activity_type: activityType,
                    details: details,
                    created_at: new Date().toISOString()
                });
            
            if (error) {
                console.warn('Could not log activity:', error);
            }
            return data;
        } catch (error) {
            console.warn('Could not log activity:', error);
            return null;
        }
    },

    /**
     * Subscribe to real-time changes
     */
    subscribeToVehicles(userId, callback) {
        const client = getSupabaseClient();
        if (!client) {
            console.warn('Supabase not initialized for subscription');
            return null;
        }
        
        return client
            .channel('vehicles_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'vehicles',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();
    },

    /**
     * Unsubscribe from channel
     */
    unsubscribe(channel) {
        const client = getSupabaseClient();
        if (!client || !channel) return;
        client.removeChannel(channel);
    }
};

// ========================================
// Storage Functions (for images)
// ========================================
const SupabaseStorage = {
    /**
     * Get Supabase client with null check
     */
    async _getClient() {
        const client = await getSupabaseClientAsync();
        if (!client) {
            throw new Error('Supabase not initialized');
        }
        return client;
    },

    /**
     * Upload image
     */
    async uploadImage(userId, file, vehicleId = null) {
        const client = await this._getClient();
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${vehicleId || 'temp'}/${Date.now()}.${fileExt}`;
        
        const { data, error } = await client.storage
            .from('vehicle-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = client.storage
            .from('vehicle-images')
            .getPublicUrl(fileName);
        
        return urlData.publicUrl;
    },

    /**
     * Delete image
     */
    async deleteImage(imagePath) {
        const client = await this._getClient();
        
        // Extract path from URL
        const path = imagePath.split('/vehicle-images/').pop();
        
        const { error } = await client.storage
            .from('vehicle-images')
            .remove([path]);
        
        if (error) throw error;
        return true;
    },

    /**
     * Get image URL
     */
    getImageUrl(path) {
        const client = getSupabaseClient();
        if (!client) return null;
        
        const { data } = client.storage
            .from('vehicle-images')
            .getPublicUrl(path);
        
        return data.publicUrl;
    }
};

// ========================================
// Export for use in other files
// ========================================
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.SupabaseAuth = SupabaseAuth;
window.SupabaseDB = SupabaseDB;
window.SupabaseStorage = SupabaseStorage;
window.initSupabase = initSupabase;
window.getSupabaseClient = getSupabaseClient;
window.getSupabaseClientAsync = getSupabaseClientAsync;
window.isSupabaseInitialized = isSupabaseInitialized;

// Legacy support - getSupabase function
window.getSupabase = getSupabaseClient;

// ========================================
// Debug helper
// ========================================
window.debugSupabase = function() {
    console.log('=== Supabase Debug Info ===');
    console.log('Initialized:', isSupabaseInitialized());
    console.log('Client:', _supabaseClient ? 'Available' : 'Not available');
    console.log('Init attempts:', _initAttempts);
    console.log('URL:', SUPABASE_URL);
    console.log('Library loaded:', typeof window.supabase !== 'undefined');
    console.log('===========================');
};
