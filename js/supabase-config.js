/**
 * ========================================
 * 🔷 Supabase Configuration File
 * ========================================
 * 
 * هذا الملف يحتوي على إعدادات Supabase
 * وجميع الدوال المساعدة للتعامل مع قاعدة البيانات والمصادقة
 * 
 * This file contains Supabase configuration
 * and all helper functions for database and authentication
 */

// ========================================
// Supabase Configuration
// ========================================
const SUPABASE_URL = 'https://enrlrqjsgcpcggyuoazr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucmxycWpzZ2NwY2dneXVvYXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODU0MjQsImV4cCI6MjA4Mzg2MTQyNH0.hV1-XB-CKIlRaqib8sTZjxzlbZO_5kUuI6L0OT2Wlvs';

// Initialize Supabase client
let supabase = null;

// Initialize when script loads
function initSupabase() {
    if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialized successfully');
        return true;
    } else {
        console.error('❌ Supabase library not loaded');
        return false;
    }
}

// Try to initialize on load
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
     * Get current user
     */
    async getCurrentUser() {
        if (!supabase) return null;
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    /**
     * Get current session
     */
    async getSession() {
        if (!supabase) return null;
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    /**
     * Sign up with email and password
     */
    async signUp(email, password, displayName) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase.auth.signUp({
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
            await SupabaseDB.createUserProfile(data.user.id, {
                name: displayName,
                email: email
            });
        }
        
        return data;
    },

    /**
     * Sign in with email and password
     */
    async signIn(email, password) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase.auth.signInWithPassword({
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase.auth.signInWithOAuth({
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase.auth.signInWithOAuth({
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { error } = await supabase.auth.signOut();
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/index.html?reset=true'
        });
        
        if (error) throw error;
        return data;
    },

    /**
     * Update password
     */
    async updatePassword(newPassword) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (error) throw error;
        return data;
    },

    /**
     * Listen to auth state changes
     */
    onAuthStateChange(callback) {
        if (!supabase) return null;
        
        return supabase.auth.onAuthStateChange((event, session) => {
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
            'For security purposes': 'لأسباب أمنية، يرجى الانتظار قبل المحاولة مرة أخرى'
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
     * Create user profile
     */
    async createUserProfile(userId, profileData) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
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
        if (!supabase) throw new Error('Supabase not initialized');
        
        const { data, error } = await supabase
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
    },

    /**
     * Subscribe to real-time changes
     */
    subscribeToVehicles(userId, callback) {
        if (!supabase) return null;
        
        return supabase
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
        if (!supabase || !channel) return;
        supabase.removeChannel(channel);
    }
};

// ========================================
// Storage Functions (for images)
// ========================================
const SupabaseStorage = {
    /**
     * Upload image
     */
    async uploadImage(userId, file, vehicleId = null) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${vehicleId || 'temp'}/${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from('vehicle-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from('vehicle-images')
            .getPublicUrl(fileName);
        
        return urlData.publicUrl;
    },

    /**
     * Delete image
     */
    async deleteImage(imagePath) {
        if (!supabase) throw new Error('Supabase not initialized');
        
        // Extract path from URL
        const path = imagePath.split('/vehicle-images/').pop();
        
        const { error } = await supabase.storage
            .from('vehicle-images')
            .remove([path]);
        
        if (error) throw error;
        return true;
    },

    /**
     * Get image URL
     */
    getImageUrl(path) {
        if (!supabase) return null;
        
        const { data } = supabase.storage
            .from('vehicle-images')
            .getPublicUrl(path);
        
        return data.publicUrl;
    }
};

// ========================================
// Export for use in other files
// ========================================
window.SupabaseAuth = SupabaseAuth;
window.SupabaseDB = SupabaseDB;
window.SupabaseStorage = SupabaseStorage;
window.getSupabase = () => supabase;
window.initSupabase = initSupabase;

// Export configuration
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
