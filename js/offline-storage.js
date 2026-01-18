/**
 * ========================================
 * 💾 Offline Storage System - نظام التخزين المحلي
 * ========================================
 * 
 * v7.0 - Enhanced Offline Support
 * يوفر تخزين محلي كامل كبديل لـ Supabase عند انقطاع الإنترنت
 * 
 * الميزات:
 * - تخزين IndexedDB للبيانات الكبيرة
 * - localStorage للإعدادات
 * - مزامنة تلقائية عند عودة الاتصال
 * - قائمة انتظار للعمليات غير المتصلة
 */

window.OfflineStorage = (function() {
    'use strict';
    
    // ========================================
    // Constants
    // ========================================
    const DB_NAME = 'VehicleEvalDB';
    const DB_VERSION = 3; // تم زيادة الإصدار لإضافة متجر الصور المعلقة
    const STORES = {
        VEHICLES: 'vehicles',
        USERS: 'users',
        ACTIVITIES: 'activities',
        SYNC_QUEUE: 'syncQueue',
        SETTINGS: 'settings',
        PENDING_IMAGES: 'pendingImages' // متجر جديد للصور المعلقة
    };
    
    // ========================================
    // IndexedDB Instance
    // ========================================
    let db = null;
    let isInitialized = false;
    
    // ========================================
    // Initialize IndexedDB
    // ========================================
    async function init() {
        if (isInitialized && db) {
            return db;
        }
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = (event) => {
                console.error('[OfflineStorage] Error opening database:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                db = event.target.result;
                isInitialized = true;
                console.log('[OfflineStorage] Database opened successfully');
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                console.log('[OfflineStorage] Upgrading database...');
                
                // Vehicles Store
                if (!database.objectStoreNames.contains(STORES.VEHICLES)) {
                    const vehiclesStore = database.createObjectStore(STORES.VEHICLES, { keyPath: 'id' });
                    vehiclesStore.createIndex('user_id', 'user_id', { unique: false });
                    vehiclesStore.createIndex('created_at', 'created_at', { unique: false });
                    vehiclesStore.createIndex('deleted', 'deleted', { unique: false });
                }
                
                // Users Store
                if (!database.objectStoreNames.contains(STORES.USERS)) {
                    const usersStore = database.createObjectStore(STORES.USERS, { keyPath: 'id' });
                    usersStore.createIndex('email', 'email', { unique: true });
                }
                
                // Activities Store
                if (!database.objectStoreNames.contains(STORES.ACTIVITIES)) {
                    const activitiesStore = database.createObjectStore(STORES.ACTIVITIES, { keyPath: 'id', autoIncrement: true });
                    activitiesStore.createIndex('user_id', 'user_id', { unique: false });
                    activitiesStore.createIndex('created_at', 'created_at', { unique: false });
                }
                
                // Sync Queue Store
                if (!database.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                    const syncStore = database.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
                    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                    syncStore.createIndex('type', 'type', { unique: false });
                }
                
                // Settings Store
                if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
                    database.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                }
                
                // Pending Images Store - لحفظ الصور كـ Base64
                if (!database.objectStoreNames.contains(STORES.PENDING_IMAGES)) {
                    const imagesStore = database.createObjectStore(STORES.PENDING_IMAGES, { keyPath: 'id', autoIncrement: true });
                    imagesStore.createIndex('vehicleId', 'vehicleId', { unique: false });
                    imagesStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }
    
    // ========================================
    // Generic CRUD Operations
    // ========================================
    async function getStore(storeName, mode = 'readonly') {
        if (!db) await init();
        const transaction = db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }
    
    async function add(storeName, data) {
        const store = await getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async function put(storeName, data) {
        const store = await getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async function get(storeName, key) {
        const store = await getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async function getAll(storeName) {
        const store = await getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }
    
    async function getByIndex(storeName, indexName, value) {
        const store = await getStore(storeName);
        const index = store.index(indexName);
        return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }
    
    async function remove(storeName, key) {
        const store = await getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
    
    async function clear(storeName) {
        const store = await getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
    
    // ========================================
    // Vehicles Operations
    // ========================================
    const Vehicles = {
        async getAll(userId) {
            try {
                const vehicles = await getByIndex(STORES.VEHICLES, 'user_id', userId);
                return vehicles.filter(v => !v.deleted).sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
            } catch (error) {
                console.error('[OfflineStorage] Error getting vehicles:', error);
                return [];
            }
        },
        
        async get(vehicleId) {
            try {
                return await get(STORES.VEHICLES, vehicleId);
            } catch (error) {
                console.error('[OfflineStorage] Error getting vehicle:', error);
                return null;
            }
        },
        
        async create(vehicleData) {
            try {
                const id = vehicleData.id || generateUUID();
                const vehicle = {
                    ...vehicleData,
                    id,
                    created_at: vehicleData.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    deleted: false,
                    _offline: true,
                    _synced: false
                };
                
                await put(STORES.VEHICLES, vehicle);
                
                // إضافة للـ sync queue
                await addToSyncQueue('CREATE_VEHICLE', vehicle);
                
                return vehicle;
            } catch (error) {
                console.error('[OfflineStorage] Error creating vehicle:', error);
                throw error;
            }
        },
        
        async update(vehicleId, updates) {
            try {
                const existing = await get(STORES.VEHICLES, vehicleId);
                if (!existing) throw new Error('Vehicle not found');
                
                const updated = {
                    ...existing,
                    ...updates,
                    updated_at: new Date().toISOString(),
                    _offline: true,
                    _synced: false
                };
                
                await put(STORES.VEHICLES, updated);
                
                // إضافة للـ sync queue
                await addToSyncQueue('UPDATE_VEHICLE', updated);
                
                return updated;
            } catch (error) {
                console.error('[OfflineStorage] Error updating vehicle:', error);
                throw error;
            }
        },
        
        async delete(vehicleId) {
            try {
                const existing = await get(STORES.VEHICLES, vehicleId);
                if (!existing) throw new Error('Vehicle not found');
                
                const updated = {
                    ...existing,
                    deleted: true,
                    updated_at: new Date().toISOString(),
                    _offline: true,
                    _synced: false
                };
                
                await put(STORES.VEHICLES, updated);
                
                // إضافة للـ sync queue
                await addToSyncQueue('DELETE_VEHICLE', { id: vehicleId });
                
                return true;
            } catch (error) {
                console.error('[OfflineStorage] Error deleting vehicle:', error);
                throw error;
            }
        },
        
        /**
         * حفظ المركبات من السيرفر مع الحفاظ على البيانات المحلية غير المتزامنة
         */
        async saveAll(vehicles) {
            try {
                // الحصول على جميع المركبات المحلية
                const localVehicles = await getAll(STORES.VEHICLES);
                
                // فلترة المركبات المحلية غير المتزامنة (التي أُضيفت offline)
                const unsyncedLocal = localVehicles.filter(v => v._offline && !v._synced);
                
                console.log(`[OfflineStorage] Found ${unsyncedLocal.length} unsynced local vehicles`);
                
                // حفظ المركبات من السيرفر
                for (const vehicle of vehicles) {
                    // التحقق من عدم وجود نسخة محلية غير متزامنة لنفس المركبة
                    const localVersion = unsyncedLocal.find(v => v.id === vehicle.id);
                    if (!localVersion) {
                        await put(STORES.VEHICLES, {
                            ...vehicle,
                            _offline: false,
                            _synced: true
                        });
                    }
                }
                
                // إبقاء المركبات المحلية غير المتزامنة (الجديدة)
                for (const localVehicle of unsyncedLocal) {
                    // التأكد من أنها ليست موجودة في السيرفر
                    const existsOnServer = vehicles.find(v => v.id === localVehicle.id);
                    if (!existsOnServer) {
                        console.log(`[OfflineStorage] Keeping unsynced vehicle: ${localVehicle.id}`);
                        // التأكد من بقائها في القاعدة
                        await put(STORES.VEHICLES, localVehicle);
                    }
                }
                
                return true;
            } catch (error) {
                console.error('[OfflineStorage] Error saving vehicles:', error);
                throw error;
            }
        },
        
        /**
         * الحصول على المركبات غير المتزامنة
         */
        async getUnsynced(userId) {
            try {
                const allVehicles = await getByIndex(STORES.VEHICLES, 'user_id', userId);
                return allVehicles.filter(v => v._offline && !v._synced && !v.deleted);
            } catch (error) {
                console.error('[OfflineStorage] Error getting unsynced vehicles:', error);
                return [];
            }
        },
        
        /**
         * تحديث حالة المزامنة لمركبة
         */
        async markAsSynced(vehicleId, newId = null) {
            try {
                const vehicle = await get(STORES.VEHICLES, vehicleId);
                if (vehicle) {
                    // إذا تم تغيير الـ ID من السيرفر
                    if (newId && newId !== vehicleId) {
                        await remove(STORES.VEHICLES, vehicleId);
                        vehicle.id = newId;
                    }
                    vehicle._offline = false;
                    vehicle._synced = true;
                    await put(STORES.VEHICLES, vehicle);
                }
                return true;
            } catch (error) {
                console.error('[OfflineStorage] Error marking as synced:', error);
                return false;
            }
        }
    };
    
    // ========================================
    // Pending Images Operations - للصور المعلقة
    // ========================================
    const PendingImages = {
        /**
         * حفظ صورة كـ Base64 مع ربطها بمركبة
         */
        async save(vehicleId, imageFile) {
            try {
                const base64 = await fileToBase64(imageFile);
                const imageData = {
                    vehicleId,
                    base64,
                    filename: imageFile.name || `image_${Date.now()}.jpg`,
                    type: imageFile.type || 'image/jpeg',
                    size: imageFile.size,
                    timestamp: new Date().toISOString(),
                    _synced: false
                };
                
                await add(STORES.PENDING_IMAGES, imageData);
                console.log(`[OfflineStorage] Saved pending image for vehicle: ${vehicleId}`);
                return imageData;
            } catch (error) {
                console.error('[OfflineStorage] Error saving pending image:', error);
                throw error;
            }
        },
        
        /**
         * حفظ عدة صور دفعة واحدة
         */
        async saveMultiple(vehicleId, imageFiles) {
            const saved = [];
            for (const file of imageFiles) {
                try {
                    const result = await this.save(vehicleId, file);
                    saved.push(result);
                } catch (error) {
                    console.error('[OfflineStorage] Error saving image:', error);
                }
            }
            return saved;
        },
        
        /**
         * الحصول على الصور المعلقة لمركبة
         */
        async getByVehicle(vehicleId) {
            try {
                return await getByIndex(STORES.PENDING_IMAGES, 'vehicleId', vehicleId);
            } catch (error) {
                console.error('[OfflineStorage] Error getting pending images:', error);
                return [];
            }
        },
        
        /**
         * الحصول على جميع الصور غير المتزامنة
         */
        async getAllUnsynced() {
            try {
                const all = await getAll(STORES.PENDING_IMAGES);
                return all.filter(img => !img._synced);
            } catch (error) {
                console.error('[OfflineStorage] Error getting unsynced images:', error);
                return [];
            }
        },
        
        /**
         * تحديث حالة المزامنة للصورة
         */
        async markAsSynced(imageId, uploadedUrl) {
            try {
                const image = await get(STORES.PENDING_IMAGES, imageId);
                if (image) {
                    image._synced = true;
                    image.uploadedUrl = uploadedUrl;
                    await put(STORES.PENDING_IMAGES, image);
                }
                return true;
            } catch (error) {
                console.error('[OfflineStorage] Error marking image as synced:', error);
                return false;
            }
        },
        
        /**
         * حذف الصور المتزامنة لمركبة
         */
        async deleteSyncedByVehicle(vehicleId) {
            try {
                const images = await this.getByVehicle(vehicleId);
                for (const img of images) {
                    if (img._synced) {
                        await remove(STORES.PENDING_IMAGES, img.id);
                    }
                }
                return true;
            } catch (error) {
                console.error('[OfflineStorage] Error deleting synced images:', error);
                return false;
            }
        },
        
        /**
         * حذف جميع الصور لمركبة
         */
        async deleteByVehicle(vehicleId) {
            try {
                const images = await this.getByVehicle(vehicleId);
                for (const img of images) {
                    await remove(STORES.PENDING_IMAGES, img.id);
                }
                return true;
            } catch (error) {
                console.error('[OfflineStorage] Error deleting vehicle images:', error);
                return false;
            }
        },
        
        /**
         * تحويل Base64 إلى Blob للرفع
         */
        base64ToBlob(base64, type = 'image/jpeg') {
            try {
                const base64Data = base64.split(',')[1] || base64;
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                return new Blob([byteArray], { type });
            } catch (error) {
                console.error('[OfflineStorage] Error converting base64 to blob:', error);
                return null;
            }
        }
    };
    
    /**
     * تحويل ملف إلى Base64
     */
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }
    
    // ========================================
    // Users Operations
    // ========================================
    const Users = {
        async get(userId) {
            try {
                return await get(STORES.USERS, userId);
            } catch (error) {
                console.error('[OfflineStorage] Error getting user:', error);
                return null;
            }
        },
        
        async save(userData) {
            try {
                await put(STORES.USERS, userData);
                return userData;
            } catch (error) {
                console.error('[OfflineStorage] Error saving user:', error);
                throw error;
            }
        },
        
        async saveSession(session) {
            try {
                localStorage.setItem('offline_session', JSON.stringify(session));
                if (session && session.user) {
                    await this.save(session.user);
                }
                return true;
            } catch (error) {
                console.error('[OfflineStorage] Error saving session:', error);
                return false;
            }
        },
        
        getSession() {
            try {
                const session = localStorage.getItem('offline_session');
                return session ? JSON.parse(session) : null;
            } catch (error) {
                console.error('[OfflineStorage] Error getting session:', error);
                return null;
            }
        },
        
        clearSession() {
            localStorage.removeItem('offline_session');
        }
    };
    
    // ========================================
    // Activities Operations
    // ========================================
    const Activities = {
        async getAll(userId, limit = 50) {
            try {
                const activities = await getByIndex(STORES.ACTIVITIES, 'user_id', userId);
                return activities
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, limit);
            } catch (error) {
                console.error('[OfflineStorage] Error getting activities:', error);
                return [];
            }
        },
        
        async log(userId, activityType, details) {
            try {
                const activity = {
                    user_id: userId,
                    activity_type: activityType,
                    details: details,
                    created_at: new Date().toISOString(),
                    _offline: true
                };
                
                await add(STORES.ACTIVITIES, activity);
                
                // إضافة للـ sync queue
                await addToSyncQueue('LOG_ACTIVITY', activity);
                
                return activity;
            } catch (error) {
                console.error('[OfflineStorage] Error logging activity:', error);
                return null;
            }
        },
        
        async saveAll(activities) {
            try {
                for (const activity of activities) {
                    await put(STORES.ACTIVITIES, activity);
                }
                return true;
            } catch (error) {
                console.error('[OfflineStorage] Error saving activities:', error);
                throw error;
            }
        }
    };
    
    // ========================================
    // Settings Operations
    // ========================================
    const Settings = {
        async get(key, defaultValue = null) {
            try {
                const result = await get(STORES.SETTINGS, key);
                return result ? result.value : defaultValue;
            } catch (error) {
                console.error('[OfflineStorage] Error getting setting:', error);
                return defaultValue;
            }
        },
        
        async set(key, value) {
            try {
                await put(STORES.SETTINGS, { key, value });
                return true;
            } catch (error) {
                console.error('[OfflineStorage] Error setting setting:', error);
                return false;
            }
        }
    };
    
    // ========================================
    // Sync Queue Operations
    // ========================================
    async function addToSyncQueue(type, data) {
        try {
            await add(STORES.SYNC_QUEUE, {
                type,
                data,
                timestamp: new Date().toISOString(),
                retries: 0
            });
            console.log('[OfflineStorage] Added to sync queue:', type);
        } catch (error) {
            console.error('[OfflineStorage] Error adding to sync queue:', error);
        }
    }
    
    async function getSyncQueue() {
        try {
            return await getAll(STORES.SYNC_QUEUE);
        } catch (error) {
            console.error('[OfflineStorage] Error getting sync queue:', error);
            return [];
        }
    }
    
    async function clearSyncQueue() {
        try {
            await clear(STORES.SYNC_QUEUE);
            return true;
        } catch (error) {
            console.error('[OfflineStorage] Error clearing sync queue:', error);
            return false;
        }
    }
    
    async function removeFromSyncQueue(id) {
        try {
            await remove(STORES.SYNC_QUEUE, id);
            return true;
        } catch (error) {
            console.error('[OfflineStorage] Error removing from sync queue:', error);
            return false;
        }
    }
    
    // ========================================
    // Sync with Supabase
    // ========================================
    async function syncWithSupabase() {
        if (!navigator.onLine) {
            console.log('[OfflineStorage] Cannot sync - offline');
            return { success: false, message: 'Offline' };
        }
        
        const queue = await getSyncQueue();
        if (queue.length === 0) {
            console.log('[OfflineStorage] Nothing to sync');
            return { success: true, message: 'Nothing to sync', synced: 0 };
        }
        
        console.log(`[OfflineStorage] Syncing ${queue.length} items...`);
        
        let synced = 0;
        let failed = 0;
        
        for (const item of queue) {
            try {
                const success = await processSyncItem(item);
                if (success) {
                    await removeFromSyncQueue(item.id);
                    synced++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.error('[OfflineStorage] Error syncing item:', error);
                failed++;
            }
        }
        
        console.log(`[OfflineStorage] Sync complete: ${synced} synced, ${failed} failed`);
        
        return { 
            success: failed === 0, 
            message: `Synced ${synced} items`, 
            synced, 
            failed 
        };
    }
    
    async function processSyncItem(item) {
        // هذه الدالة ستحتاج للتعامل مع Supabase
        // سيتم استدعاؤها من ConnectionMonitor
        if (typeof window.processOfflineSyncItem === 'function') {
            return await window.processOfflineSyncItem(item);
        }
        return false;
    }
    
    // ========================================
    // Utility Functions
    // ========================================
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // ========================================
    // Export
    // ========================================
    return {
        init,
        Vehicles,
        Users,
        Activities,
        Settings,
        PendingImages, // جديد: للصور المعلقة
        getSyncQueue,
        clearSyncQueue,
        removeFromSyncQueue,
        syncWithSupabase,
        generateUUID,
        fileToBase64,
        
        // Direct access to generic operations
        add,
        put,
        get,
        getAll,
        getByIndex,
        remove,
        clear
    };
})();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    OfflineStorage.init().then(() => {
        console.log('[OfflineStorage] Initialized successfully');
    }).catch(error => {
        console.error('[OfflineStorage] Initialization failed:', error);
    });
});

console.log('[OfflineStorage] Module loaded');
