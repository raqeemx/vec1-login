/**
 * ========================================
 * 🌐 Connection Monitor - مراقب حالة الاتصال
 * ========================================
 * 
 * v7.0 - Smart Connection Handler
 * يراقب حالة الاتصال ويتبدل بين الوضع المحلي والسحابي تلقائياً
 * 
 * الميزات:
 * - مراقبة حالة الاتصال بالإنترنت
 * - التبديل التلقائي بين Supabase والتخزين المحلي
 * - مزامنة البيانات عند عودة الاتصال
 * - إشعارات حالة الاتصال
 */

window.ConnectionMonitor = (function() {
    'use strict';
    
    // ========================================
    // State
    // ========================================
    let isOnline = navigator.onLine;
    let isSupabaseAvailable = false;
    let syncInProgress = false;
    let listeners = [];
    let checkInterval = null;
    let lastSyncTime = null;
    
    // ========================================
    // Constants
    // ========================================
    const CHECK_INTERVAL = 30000; // 30 seconds
    const SYNC_DELAY = 2000; // 2 seconds after coming online
    
    // ========================================
    // Initialize
    // ========================================
    function init() {
        console.log('[ConnectionMonitor] Initializing...');
        
        // إعداد مستمعي الأحداث
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // فحص Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        }
        
        // فحص دوري للاتصال
        startPeriodicCheck();
        
        // فحص أولي
        checkConnection();
        
        console.log('[ConnectionMonitor] Initialized. Online:', isOnline);
        
        // عرض حالة الاتصال
        updateConnectionUI();
    }
    
    // ========================================
    // Connection Handlers
    // ========================================
    function handleOnline() {
        console.log('[ConnectionMonitor] Online event triggered');
        isOnline = true;
        
        // تأخير قليل ثم محاولة المزامنة
        setTimeout(() => {
            checkSupabaseConnection().then(() => {
                if (isSupabaseAvailable) {
                    syncOfflineData();
                }
            });
        }, SYNC_DELAY);
        
        updateConnectionUI();
        notifyListeners('online');
        showNotification('تم استعادة الاتصال بالإنترنت', 'success');
    }
    
    function handleOffline() {
        console.log('[ConnectionMonitor] Offline event triggered');
        isOnline = false;
        isSupabaseAvailable = false;
        
        updateConnectionUI();
        notifyListeners('offline');
        showNotification('أنت الآن في وضع عدم الاتصال - البيانات تُحفظ محلياً', 'warning');
    }
    
    function handleServiceWorkerMessage(event) {
        if (event.data && event.data.type === 'ONLINE') {
            handleOnline();
        } else if (event.data && event.data.type === 'OFFLINE') {
            handleOffline();
        }
    }
    
    // ========================================
    // Connection Check
    // ========================================
    async function checkConnection() {
        // فحص الاتصال بالإنترنت
        isOnline = navigator.onLine;
        
        if (isOnline) {
            await checkSupabaseConnection();
        } else {
            isSupabaseAvailable = false;
        }
        
        updateConnectionUI();
        return { isOnline, isSupabaseAvailable };
    }
    
    async function checkSupabaseConnection() {
        if (!navigator.onLine) {
            isSupabaseAvailable = false;
            return false;
        }
        
        try {
            // محاولة الوصول إلى Supabase
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('https://enrlrqjsgcpcggyuoazr.supabase.co/rest/v1/', {
                method: 'HEAD',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            isSupabaseAvailable = response.ok || response.status === 400;
            console.log('[ConnectionMonitor] Supabase available:', isSupabaseAvailable);
        } catch (error) {
            console.log('[ConnectionMonitor] Supabase not available:', error.message);
            isSupabaseAvailable = false;
        }
        
        return isSupabaseAvailable;
    }
    
    function startPeriodicCheck() {
        if (checkInterval) clearInterval(checkInterval);
        
        checkInterval = setInterval(() => {
            checkConnection();
        }, CHECK_INTERVAL);
    }
    
    // ========================================
    // Sync Operations
    // ========================================
    async function syncOfflineData() {
        if (syncInProgress) {
            console.log('[ConnectionMonitor] Sync already in progress');
            return;
        }
        
        if (!isOnline || !isSupabaseAvailable) {
            console.log('[ConnectionMonitor] Cannot sync - not connected');
            return;
        }
        
        syncInProgress = true;
        console.log('[ConnectionMonitor] Starting sync...');
        
        try {
            // الحصول على قائمة الانتظار
            const queue = await window.OfflineStorage.getSyncQueue();
            
            if (queue.length === 0) {
                console.log('[ConnectionMonitor] Nothing to sync');
                syncInProgress = false;
                return;
            }
            
            showNotification(`جاري مزامنة ${queue.length} عنصر...`, 'info');
            
            let synced = 0;
            let failed = 0;
            
            for (const item of queue) {
                try {
                    const success = await processOfflineSyncItem(item);
                    if (success) {
                        await window.OfflineStorage.removeFromSyncQueue(item.id);
                        synced++;
                    } else {
                        failed++;
                    }
                } catch (error) {
                    console.error('[ConnectionMonitor] Error syncing item:', error);
                    failed++;
                }
            }
            
            lastSyncTime = new Date();
            
            if (synced > 0) {
                showNotification(`تمت مزامنة ${synced} عنصر بنجاح`, 'success');
            }
            
            if (failed > 0) {
                showNotification(`فشلت مزامنة ${failed} عنصر`, 'warning');
            }
            
            // إعادة تحميل البيانات من Supabase
            notifyListeners('synced', { synced, failed });
            
        } catch (error) {
            console.error('[ConnectionMonitor] Sync error:', error);
            showNotification('حدث خطأ أثناء المزامنة', 'error');
        } finally {
            syncInProgress = false;
        }
    }
    
    // ========================================
    // Process Sync Items
    // ========================================
    async function processOfflineSyncItem(item) {
        const client = window.getSupabaseClient ? window.getSupabaseClient() : null;
        
        if (!client) {
            console.warn('[ConnectionMonitor] Supabase client not available');
            return false;
        }
        
        try {
            switch (item.type) {
                case 'CREATE_VEHICLE':
                    return await syncCreateVehicle(client, item.data);
                    
                case 'UPDATE_VEHICLE':
                    return await syncUpdateVehicle(client, item.data);
                    
                case 'DELETE_VEHICLE':
                    return await syncDeleteVehicle(client, item.data);
                    
                case 'LOG_ACTIVITY':
                    return await syncLogActivity(client, item.data);
                    
                default:
                    console.warn('[ConnectionMonitor] Unknown sync type:', item.type);
                    return false;
            }
        } catch (error) {
            console.error('[ConnectionMonitor] Error processing sync item:', error);
            return false;
        }
    }
    
    async function syncCreateVehicle(client, data) {
        try {
            // إزالة الحقول المحلية
            const vehicleData = { ...data };
            delete vehicleData._offline;
            delete vehicleData._synced;
            delete vehicleData._pendingImageCount; // حذف عدد الصور المعلقة
            
            // إذا كانت هناك صور Base64 محلية، حذفها من البيانات (سيتم رفعها لاحقاً)
            if (vehicleData._localImages) {
                delete vehicleData._localImages;
            }
            
            // أولاً: رفع الصور المعلقة إلى Storage
            if (window.OfflineStorage && window.OfflineStorage.PendingImages) {
                const pendingImages = await window.OfflineStorage.PendingImages.getByVehicle(data.id);
                
                if (pendingImages.length > 0) {
                    console.log(`[ConnectionMonitor] Uploading ${pendingImages.length} pending images for vehicle ${data.id}`);
                    const uploadedUrls = [];
                    
                    for (let i = 0; i < pendingImages.length; i++) {
                        const img = pendingImages[i];
                        try {
                            const url = await uploadPendingImage(client, img, data.id, i);
                            if (url) {
                                uploadedUrls.push(url);
                                await window.OfflineStorage.PendingImages.markAsSynced(img.id, url);
                            }
                        } catch (uploadError) {
                            console.error('[ConnectionMonitor] Error uploading image:', uploadError);
                        }
                    }
                    
                    // إضافة روابط الصور المرفوعة
                    vehicleData.images = [...(vehicleData.images || []), ...uploadedUrls];
                    
                    // حذف الصور المتزامنة من التخزين المحلي
                    await window.OfflineStorage.PendingImages.deleteSyncedByVehicle(data.id);
                }
            }
            
            const { error } = await client
                .from('vehicles')
                .upsert(vehicleData);
            
            if (error) throw error;
            
            // تحديث الحالة المحلية
            await window.OfflineStorage.Vehicles.markAsSynced(data.id);
            
            return true;
        } catch (error) {
            console.error('[ConnectionMonitor] Error syncing create vehicle:', error);
            return false;
        }
    }
    
    /**
     * رفع صورة معلقة إلى Supabase Storage
     */
    async function uploadPendingImage(client, imageData, vehicleId, index) {
        try {
            // تحويل Base64 إلى Blob
            const blob = window.OfflineStorage.PendingImages.base64ToBlob(imageData.base64, imageData.type);
            if (!blob) {
                console.error('[ConnectionMonitor] Failed to convert base64 to blob');
                return null;
            }
            
            const fileName = `${vehicleId}_${Date.now()}_${index}.jpg`;
            const filePath = `vehicles/${fileName}`;
            
            const { data, error } = await client.storage
                .from('vehicle-images')
                .upload(filePath, blob, {
                    contentType: imageData.type || 'image/jpeg',
                    upsert: false
                });
            
            if (error) throw error;
            
            // الحصول على الرابط العام
            const { data: { publicUrl } } = client.storage
                .from('vehicle-images')
                .getPublicUrl(filePath);
            
            console.log(`[ConnectionMonitor] Image uploaded: ${publicUrl}`);
            return publicUrl;
            
        } catch (error) {
            console.error('[ConnectionMonitor] Error uploading pending image:', error);
            return null;
        }
    }
    
    async function syncUpdateVehicle(client, data) {
        try {
            const vehicleData = { ...data };
            delete vehicleData._offline;
            delete vehicleData._synced;
            delete vehicleData._pendingImageCount;
            delete vehicleData._localImages;
            
            // رفع الصور المعلقة
            if (window.OfflineStorage && window.OfflineStorage.PendingImages) {
                const pendingImages = await window.OfflineStorage.PendingImages.getByVehicle(data.id);
                
                if (pendingImages.length > 0) {
                    console.log(`[ConnectionMonitor] Uploading ${pendingImages.length} pending images for update`);
                    const uploadedUrls = [];
                    
                    for (let i = 0; i < pendingImages.length; i++) {
                        const img = pendingImages[i];
                        try {
                            const url = await uploadPendingImage(client, img, data.id, i);
                            if (url) {
                                uploadedUrls.push(url);
                                await window.OfflineStorage.PendingImages.markAsSynced(img.id, url);
                            }
                        } catch (uploadError) {
                            console.error('[ConnectionMonitor] Error uploading image:', uploadError);
                        }
                    }
                    
                    vehicleData.images = [...(vehicleData.images || []), ...uploadedUrls];
                    await window.OfflineStorage.PendingImages.deleteSyncedByVehicle(data.id);
                }
            }
            
            const { error } = await client
                .from('vehicles')
                .update(vehicleData)
                .eq('id', data.id);
            
            if (error) throw error;
            
            await window.OfflineStorage.Vehicles.markAsSynced(data.id);
            
            return true;
        } catch (error) {
            console.error('[ConnectionMonitor] Error syncing update vehicle:', error);
            return false;
        }
    }
    
    async function syncDeleteVehicle(client, data) {
        try {
            const { error } = await client
                .from('vehicles')
                .update({ deleted: true, updated_at: new Date().toISOString() })
                .eq('id', data.id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[ConnectionMonitor] Error syncing delete vehicle:', error);
            return false;
        }
    }
    
    async function syncLogActivity(client, data) {
        try {
            const activityData = { ...data };
            delete activityData._offline;
            delete activityData.id;
            
            const { error } = await client
                .from('activity_logs')
                .insert(activityData);
            
            // نتجاهل أخطاء تسجيل النشاط
            if (error) {
                console.warn('[ConnectionMonitor] Could not sync activity:', error);
            }
            
            return true;
        } catch (error) {
            console.warn('[ConnectionMonitor] Error syncing activity:', error);
            return true; // نعتبرها ناجحة لعدم إيقاف المزامنة
        }
    }
    
    // ========================================
    // UI Updates
    // ========================================
    function updateConnectionUI() {
        // تحديث مؤشر الاتصال
        const indicator = document.getElementById('connection-indicator');
        if (indicator) {
            if (isOnline && isSupabaseAvailable) {
                indicator.className = 'connection-indicator online';
                indicator.innerHTML = '<i class="fas fa-wifi"></i> متصل';
            } else if (isOnline) {
                indicator.className = 'connection-indicator limited';
                indicator.innerHTML = '<i class="fas fa-wifi"></i> اتصال محدود';
            } else {
                indicator.className = 'connection-indicator offline';
                indicator.innerHTML = '<i class="fas fa-wifi-slash"></i> غير متصل';
            }
        }
        
        // إضافة class للـ body
        document.body.classList.toggle('is-offline', !isOnline);
        document.body.classList.toggle('is-online', isOnline);
    }
    
    function showNotification(message, type = 'info') {
        if (window.NFNotify) {
            window.NFNotify.show({ message, type });
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    // ========================================
    // Event Listeners
    // ========================================
    function addListener(callback) {
        if (typeof callback === 'function') {
            listeners.push(callback);
        }
    }
    
    function removeListener(callback) {
        listeners = listeners.filter(l => l !== callback);
    }
    
    function notifyListeners(event, data = {}) {
        listeners.forEach(callback => {
            try {
                callback(event, { isOnline, isSupabaseAvailable, ...data });
            } catch (error) {
                console.error('[ConnectionMonitor] Error in listener:', error);
            }
        });
    }
    
    // ========================================
    // Public API for Data Operations
    // ========================================
    
    /**
     * Get vehicles - يستخدم Supabase إذا متصل، وإلا يستخدم التخزين المحلي
     */
    async function getVehicles(userId) {
        if (isOnline && isSupabaseAvailable && window.SupabaseDB) {
            try {
                const vehicles = await window.SupabaseDB.getVehicles(userId);
                // حفظ نسخة محلية
                await window.OfflineStorage.Vehicles.saveAll(vehicles);
                return vehicles;
            } catch (error) {
                console.warn('[ConnectionMonitor] Error getting vehicles from Supabase, using offline:', error);
            }
        }
        
        // استخدام التخزين المحلي
        return await window.OfflineStorage.Vehicles.getAll(userId);
    }
    
    /**
     * Create vehicle - يحفظ محلياً ويضيف للمزامنة إذا offline
     */
    async function createVehicle(userId, vehicleData) {
        const data = {
            ...vehicleData,
            user_id: userId
        };
        
        if (isOnline && isSupabaseAvailable && window.SupabaseDB) {
            try {
                const vehicle = await window.SupabaseDB.createVehicle(userId, vehicleData);
                // حفظ نسخة محلية
                await window.OfflineStorage.Vehicles.saveAll([vehicle]);
                return vehicle;
            } catch (error) {
                console.warn('[ConnectionMonitor] Error creating vehicle on Supabase, saving offline:', error);
            }
        }
        
        // حفظ محلياً
        return await window.OfflineStorage.Vehicles.create(data);
    }
    
    /**
     * Update vehicle
     */
    async function updateVehicle(userId, vehicleId, updates) {
        if (isOnline && isSupabaseAvailable && window.SupabaseDB) {
            try {
                const vehicle = await window.SupabaseDB.updateVehicle(userId, vehicleId, updates);
                await window.OfflineStorage.Vehicles.saveAll([vehicle]);
                return vehicle;
            } catch (error) {
                console.warn('[ConnectionMonitor] Error updating vehicle on Supabase, saving offline:', error);
            }
        }
        
        return await window.OfflineStorage.Vehicles.update(vehicleId, updates);
    }
    
    /**
     * Delete vehicle
     */
    async function deleteVehicle(userId, vehicleId) {
        if (isOnline && isSupabaseAvailable && window.SupabaseDB) {
            try {
                await window.SupabaseDB.deleteVehicle(userId, vehicleId);
                await window.OfflineStorage.Vehicles.delete(vehicleId);
                return true;
            } catch (error) {
                console.warn('[ConnectionMonitor] Error deleting vehicle on Supabase, marking offline:', error);
            }
        }
        
        return await window.OfflineStorage.Vehicles.delete(vehicleId);
    }
    
    /**
     * Get current user session
     */
    async function getCurrentSession() {
        if (isOnline && isSupabaseAvailable && window.SupabaseAuth) {
            try {
                const session = await window.SupabaseAuth.getSession();
                if (session) {
                    await window.OfflineStorage.Users.saveSession(session);
                }
                return session;
            } catch (error) {
                console.warn('[ConnectionMonitor] Error getting session from Supabase:', error);
            }
        }
        
        // استخدام الجلسة المحفوظة محلياً
        return window.OfflineStorage.Users.getSession();
    }
    
    // ========================================
    // Export
    // ========================================
    return {
        init,
        checkConnection,
        syncOfflineData,
        isOnline: () => isOnline,
        isSupabaseAvailable: () => isSupabaseAvailable,
        isSyncInProgress: () => syncInProgress,
        getLastSyncTime: () => lastSyncTime,
        addListener,
        removeListener,
        
        // Data operations
        getVehicles,
        createVehicle,
        updateVehicle,
        deleteVehicle,
        getCurrentSession
    };
})();

// إضافة دالة معالجة المزامنة للـ OfflineStorage
window.processOfflineSyncItem = async function(item) {
    return await ConnectionMonitor.processOfflineSyncItem(item);
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // انتظار تحميل OfflineStorage أولاً
    setTimeout(() => {
        ConnectionMonitor.init();
    }, 500);
});

console.log('[ConnectionMonitor] Module loaded');
