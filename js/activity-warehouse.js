/**
 * ========================================
 * 📋 Activity Log & Warehouse Management
 * ========================================
 * 
 * نظام سجل النشاطات وإدارة المستودعات
 * v3.0 - يستخدم localStorage + Supabase/Firebase
 * 
 * ⚠️ لا يعدل أي JavaScript موجود - إضافة فقط!
 */

// ===== Activity Log System =====
window.NFActivity = (function() {
    'use strict';
    
    // Storage key for localStorage
    const STORAGE_KEY = 'nf_activity_logs';
    const MAX_LOCAL_ACTIVITIES = 500; // Keep last 500 activities locally
    
    const ACTIVITY_TYPES = {
        // Vehicle operations
        VEHICLE_ADDED: { icon: 'fa-plus-circle', color: 'success', label: 'إضافة مركبة', category: 'vehicles' },
        VEHICLE_UPDATED: { icon: 'fa-edit', color: 'warning', label: 'تعديل مركبة', category: 'vehicles' },
        VEHICLE_DELETED: { icon: 'fa-trash', color: 'danger', label: 'حذف مركبة', category: 'vehicles' },
        VEHICLE_VIEWED: { icon: 'fa-eye', color: 'info', label: 'عرض مركبة', category: 'vehicles' },
        
        // Export/Import operations
        EXPORT_EXCEL: { icon: 'fa-file-excel', color: 'success', label: 'تصدير Excel', category: 'export' },
        EXPORT_JSON: { icon: 'fa-file-code', color: 'info', label: 'تصدير JSON', category: 'export' },
        EXPORT_IMAGES: { icon: 'fa-images', color: 'primary', label: 'تصدير روابط الصور', category: 'export' },
        IMPORT_DATA: { icon: 'fa-file-import', color: 'primary', label: 'استيراد بيانات', category: 'export' },
        
        // Warehouse operations
        WAREHOUSE_TRANSFER: { icon: 'fa-exchange-alt', color: 'warning', label: 'نقل للمستودع', category: 'warehouse' },
        WAREHOUSE_ADDED: { icon: 'fa-plus', color: 'success', label: 'إضافة مستودع', category: 'warehouse' },
        WAREHOUSE_DELETED: { icon: 'fa-trash', color: 'danger', label: 'حذف مستودع', category: 'warehouse' },
        
        // Evaluator operations
        EVALUATOR_ADDED: { icon: 'fa-user-plus', color: 'success', label: 'إضافة قائم بالتقييم', category: 'evaluators' },
        EVALUATOR_DELETED: { icon: 'fa-user-minus', color: 'danger', label: 'حذف قائم بالتقييم', category: 'evaluators' },
        
        // Status changes
        STATUS_CHANGE: { icon: 'fa-cog', color: 'info', label: 'تغيير الحالة', category: 'system' },
        
        // Auth operations
        LOGIN: { icon: 'fa-sign-in-alt', color: 'success', label: 'تسجيل دخول', category: 'auth' },
        LOGOUT: { icon: 'fa-sign-out-alt', color: 'warning', label: 'تسجيل خروج', category: 'auth' },
        
        // Page navigation
        PAGE_VIEW: { icon: 'fa-eye', color: 'secondary', label: 'عرض صفحة', category: 'navigation' },
        SECTION_OPENED: { icon: 'fa-folder-open', color: 'secondary', label: 'فتح قسم', category: 'navigation' },
        
        // Search and filter
        SEARCH: { icon: 'fa-search', color: 'info', label: 'بحث', category: 'search' },
        FILTER_APPLIED: { icon: 'fa-filter', color: 'info', label: 'تطبيق فلتر', category: 'search' },
        
        // Photo operations
        PHOTO_ADDED: { icon: 'fa-camera', color: 'success', label: 'إضافة صورة', category: 'photos' },
        PHOTO_DELETED: { icon: 'fa-trash', color: 'danger', label: 'حذف صورة', category: 'photos' },
        ALBUM_VIEWED: { icon: 'fa-images', color: 'info', label: 'عرض ألبوم الصور', category: 'photos' },
        
        // Settings
        SETTINGS_CHANGED: { icon: 'fa-cog', color: 'warning', label: 'تغيير الإعدادات', category: 'system' },
        DARK_MODE_TOGGLE: { icon: 'fa-moon', color: 'secondary', label: 'تبديل الوضع المظلم', category: 'system' },
        
        // Errors
        ERROR: { icon: 'fa-exclamation-triangle', color: 'danger', label: 'خطأ', category: 'system' }
    };
    
    // Category labels for filtering
    const CATEGORIES = {
        vehicles: 'المركبات',
        export: 'التصدير والاستيراد',
        warehouse: 'المستودعات',
        evaluators: 'القائمين بالتقييم',
        auth: 'تسجيل الدخول',
        navigation: 'التنقل',
        search: 'البحث والفلترة',
        photos: 'الصور',
        system: 'النظام'
    };
    
    // Get activities from localStorage
    function getLocalActivities() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('Error reading local activities:', e);
            return [];
        }
    }
    
    // Save activities to localStorage
    function saveLocalActivities(activities) {
        try {
            // Keep only the last MAX_LOCAL_ACTIVITIES
            const trimmed = activities.slice(0, MAX_LOCAL_ACTIVITIES);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch (e) {
            console.warn('Error saving local activities:', e);
        }
    }
    
    // Log activity - Saves to localStorage first, then tries remote
    async function logActivity(type, details = {}) {
        // Ensure we have a type
        if (!type) {
            console.error('Activity type is required');
            return;
        }
        
        const typeInfo = ACTIVITY_TYPES[type];
        if (!typeInfo) {
            console.warn('Unknown activity type:', type);
        }
        
        // Create activity object
        const activity = {
            id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: type,
            details: details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 100)
        };
        
        // Always save to localStorage first (for reliability)
        const localActivities = getLocalActivities();
        localActivities.unshift(activity);
        saveLocalActivities(localActivities);
        
        console.log('📋 Activity logged locally:', type, details);
        
        // Try to save to Supabase (non-blocking)
        saveToRemote(activity).catch(err => {
            console.warn('Could not save activity to remote:', err.message);
        });
        
        return activity;
    }
    
    // Save activity to remote database (Supabase/Firebase)
    async function saveToRemote(activity) {
        // Try Supabase first
        let client = window.supabaseClient;
        const user = window.currentUser;
        
        if (client && user) {
            try {
                const { error } = await client
                    .from('activity_logs')
                    .insert({
                        activity_type: activity.type,
                        details: activity.details,
                        user_id: user.id,
                        created_at: activity.timestamp
                    });
                
                if (error) {
                    // Table doesn't exist - that's okay, we have localStorage
                    if (error.code === '42P01' || error.message?.includes('does not exist')) {
                        return; // Silently ignore
                    }
                    throw error;
                }
                
                console.log('Activity saved to Supabase:', activity.type);
                return;
            } catch (error) {
                // Silently fail - localStorage is our backup
            }
        }
        
        // Try Firebase
        if (window.db && window.currentUser && window.currentUser.uid) {
            try {
                await window.db.collection('users')
                    .doc(window.currentUser.uid)
                    .collection('activities')
                    .add({
                        type: activity.type,
                        details: activity.details,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                console.log('Activity saved to Firebase:', activity.type);
            } catch (error) {
                // Silently fail
            }
        }
    }
    
    // Get recent activities (combines local and remote)
    async function getActivities(limit = 100) {
        // Start with local activities
        let activities = getLocalActivities();
        
        // Try to get from Supabase
        let client = window.supabaseClient;
        if (client && window.currentUser) {
            try {
                const { data, error } = await client
                    .from('activity_logs')
                    .select('*')
                    .eq('user_id', window.currentUser.id)
                    .order('created_at', { ascending: false })
                    .limit(limit);
                
                if (!error && data && data.length > 0) {
                    // Merge remote activities with local ones
                    const remoteActivities = data.map(item => ({
                        id: item.id,
                        type: item.activity_type,
                        details: item.details || {},
                        timestamp: item.created_at,
                        source: 'remote'
                    }));
                    
                    // Combine and sort by timestamp
                    activities = [...activities, ...remoteActivities];
                    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    
                    // Remove duplicates
                    const seen = new Set();
                    activities = activities.filter(a => {
                        const key = a.type + a.timestamp;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });
                }
            } catch (error) {
                console.warn('Could not fetch remote activities:', error.message);
            }
        }
        
        // Return limited activities
        return activities.slice(0, limit);
    }
    
    // Clear all local activities
    function clearActivities() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            console.log('Local activities cleared');
            return true;
        } catch (e) {
            console.error('Error clearing activities:', e);
            return false;
        }
    }
    
    // Format activity for display
    function formatActivity(activity) {
        const typeInfo = ACTIVITY_TYPES[activity.type] || { 
            icon: 'fa-circle', 
            color: 'secondary', 
            label: activity.type,
            category: 'system'
        };
        
        const timestamp = activity.timestamp?.toDate ? 
            activity.timestamp.toDate() : 
            new Date(activity.timestamp);
        
        const timeAgo = getTimeAgo(timestamp);
        const formattedDate = timestamp.toLocaleString('ar-SA');
        
        return {
            ...activity,
            typeInfo,
            timeAgo,
            formattedDate
        };
    }
    
    // Get time ago string
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'منذ لحظات';
        if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
        if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
        if (seconds < 604800) return `منذ ${Math.floor(seconds / 86400)} يوم`;
        
        return date.toLocaleDateString('ar-SA');
    }
    
    // Create activities page content
    function createActivitiesPageHTML(activities) {
        const formattedActivities = activities.map(formatActivity);
        
        // Count by category
        const categoryCounts = {};
        formattedActivities.forEach(a => {
            const cat = a.typeInfo.category || 'system';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        
        return `
            <div class="nf-activities-page">
                <div class="nf-activities-header">
                    <h2><i class="fas fa-history"></i> سجل النشاطات</h2>
                    <div class="nf-activities-stats">
                        <span><strong>${activities.length}</strong> نشاط</span>
                    </div>
                </div>
                
                <div class="nf-activities-filters" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
                    <select id="activityCategoryFilter" class="nf-filter-select" onchange="NFActivity.filterByCategory(this.value)" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                        <option value="">كل التصنيفات</option>
                        ${Object.entries(CATEGORIES).map(([key, label]) => 
                            `<option value="${key}">${label} (${categoryCounts[key] || 0})</option>`
                        ).join('')}
                    </select>
                    <select id="activityTypeFilter" class="nf-filter-select" onchange="NFActivity.filterActivities()" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                        <option value="">كل الأنشطة</option>
                        ${Object.entries(ACTIVITY_TYPES).map(([key, val]) => 
                            `<option value="${key}">${val.label}</option>`
                        ).join('')}
                    </select>
                    <button class="btn btn-outline" onclick="NFActivity.refreshActivities()" style="padding: 10px 15px; border-radius: 8px;">
                        <i class="fas fa-sync-alt"></i> تحديث
                    </button>
                    <button class="btn btn-outline" onclick="NFActivity.confirmClear()" style="padding: 10px 15px; border-radius: 8px; color: #dc3545; border-color: #dc3545;">
                        <i class="fas fa-trash"></i> مسح السجل
                    </button>
                </div>
                
                <div class="nf-activities-list" id="activitiesList">
                    ${formattedActivities.length > 0 ? formattedActivities.map((a, index) => `
                        <div class="nf-activity-item" data-type="${a.type}" data-category="${a.typeInfo.category}" style="animation-delay: ${index * 0.05}s;">
                            <div class="nf-activity-icon ${a.typeInfo.color}">
                                <i class="fas ${a.typeInfo.icon}"></i>
                            </div>
                            <div class="nf-activity-content">
                                <div class="nf-activity-title">${a.typeInfo.label}</div>
                                <div class="nf-activity-details">
                                    ${formatDetails(a.details)}
                                </div>
                                <div class="nf-activity-meta">
                                    <span><i class="fas fa-clock"></i> ${a.timeAgo}</span>
                                    <span class="nf-activity-date">${a.formattedDate}</span>
                                    <span class="nf-activity-category" style="background: #f0f0f0; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem;">
                                        ${CATEGORIES[a.typeInfo.category] || 'عام'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="nf-empty-state">
                            <i class="fas fa-clipboard-list"></i>
                            <h3>لا توجد نشاطات</h3>
                            <p>ستظهر هنا جميع الأنشطة التي تقوم بها</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
    
    // Format activity details
    function formatDetails(details) {
        if (!details || Object.keys(details).length === 0) return '';
        
        const parts = [];
        if (details.vehicleName) parts.push(`<strong>${details.vehicleName}</strong>`);
        if (details.contractNo) parts.push(`عقد: ${details.contractNo}`);
        if (details.count) parts.push(`عدد: ${details.count}`);
        if (details.warehouse) parts.push(`مستودع: ${details.warehouse}`);
        if (details.oldStatus) parts.push(`من: ${details.oldStatus}`);
        if (details.newStatus) parts.push(`إلى: ${details.newStatus}`);
        if (details.message) parts.push(details.message);
        if (details.section) parts.push(`قسم: ${details.section}`);
        if (details.query) parts.push(`بحث: "${details.query}"`);
        if (details.evaluatorName) parts.push(`القائم: ${details.evaluatorName}`);
        if (details.error) parts.push(`<span style="color: red;">${details.error}</span>`);
        
        return parts.join(' • ');
    }
    
    // Filter activities by type
    function filterActivities() {
        const typeFilter = document.getElementById('activityTypeFilter')?.value;
        const items = document.querySelectorAll('.nf-activity-item');
        let visibleCount = 0;
        
        items.forEach(item => {
            if (!typeFilter || item.dataset.type === typeFilter) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        updateVisibleCount(visibleCount);
    }
    
    // Filter activities by category
    function filterByCategory(category) {
        const items = document.querySelectorAll('.nf-activity-item');
        let visibleCount = 0;
        
        // Reset type filter
        const typeFilter = document.getElementById('activityTypeFilter');
        if (typeFilter) typeFilter.value = '';
        
        items.forEach(item => {
            if (!category || item.dataset.category === category) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        updateVisibleCount(visibleCount);
    }
    
    // Update visible count in header
    function updateVisibleCount(count) {
        const statsEl = document.querySelector('.nf-activities-stats');
        if (statsEl) {
            statsEl.innerHTML = `<span><strong>${count}</strong> نشاط</span>`;
        }
    }
    
    // Confirm clear activities
    function confirmClear() {
        if (confirm('هل أنت متأكد من مسح سجل النشاطات؟ لا يمكن التراجع عن هذا الإجراء.')) {
            clearActivities();
            refreshActivities();
            if (window.showNotification) {
                showNotification('تم مسح سجل النشاطات بنجاح', 'success');
            }
        }
    }
    
    // Refresh activities
    async function refreshActivities() {
        console.log('Refreshing activities...');
        const container = document.getElementById('activitiesSection');
        if (!container) {
            console.error('Activities container #activitiesSection not found');
            return;
        }
        
        container.innerHTML = '<div class="nf-loading"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
        
        try {
            const activities = await getActivities();
            console.log('Activities fetched:', activities.length);
            container.innerHTML = createActivitiesPageHTML(activities);
        } catch (error) {
            console.error('Failed to refresh activities:', error);
            container.innerHTML = '<div class="nf-error">فشل تحميل النشاطات</div>';
        }
    }
    
    // Refresh warehouses
    async function refreshWarehouses() {
        const container = document.getElementById('warehouseSection');
        if (!container) return;
        
        container.innerHTML = '<div class="nf-loading"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
        
        try {
            const warehouses = await getWarehouses();
            // We need vehicle stats for the warehouse page
            const stats = {}; 
            // Mock stats if needed
            container.innerHTML = createWarehousePageHTML(warehouses, stats);
        } catch (error) {
            console.error('Error refreshing warehouses:', error);
            container.innerHTML = '<div class="nf-error">فشل تحميل المستودعات</div>';
        }
    }
    
    console.log('📋 NFActivity v3.0 initialized - localStorage + Remote sync enabled');
    
    return {
        TYPES: ACTIVITY_TYPES,
        CATEGORIES: CATEGORIES,
        log: logActivity,
        getAll: getActivities,
        clear: clearActivities,
        format: formatActivity,
        createPageHTML: createActivitiesPageHTML,
        filterActivities,
        filterByCategory,
        confirmClear,
        refreshActivities,
        refreshWarehouses
    };
})();

// ===== Warehouse Management System =====
window.NFWarehouse = (function() {
    'use strict';
    
    const DEFAULT_WAREHOUSES = [
        { id: 'main', name: 'المستودع الرئيسي', location: 'الرياض', capacity: 100 },
        { id: 'east', name: 'المستودع الشرقي', location: 'الدمام', capacity: 50 },
        { id: 'west', name: 'المستودع الغربي', location: 'جدة', capacity: 75 }
    ];
    
    // Get warehouses - Support both Firebase and Supabase
    async function getWarehouses() {
        console.log('🏭 Getting warehouses...');
        
        // Try Supabase first
        if (window.supabaseClient && window.currentUser) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('warehouses')
                    .select('*')
                    .eq('user_id', window.currentUser.id)
                    .order('name');
                
                // If table doesn't exist or other error, use defaults
                if (error) {
                    console.warn('Warehouses table error (using defaults):', error.message);
                    return DEFAULT_WAREHOUSES;
                }
                
                if (!data || data.length === 0) {
                    console.log('No warehouses found, using defaults');
                    return DEFAULT_WAREHOUSES;
                }
                
                console.log('Loaded warehouses from Supabase:', data.length);
                return data;
            } catch (error) {
                console.warn('Error fetching warehouses from Supabase (using defaults):', error);
                return DEFAULT_WAREHOUSES;
            }
        }
        
        // Fallback to Firebase
        if (window.db && window.currentUser && window.currentUser.uid) {
            try {
                const snapshot = await window.db.collection('users')
                    .doc(window.currentUser.uid)
                    .collection('warehouses')
                    .get();
                
                if (snapshot.empty) {
                    // Initialize with defaults
                    for (const wh of DEFAULT_WAREHOUSES) {
                        await window.db.collection('users')
                            .doc(window.currentUser.uid)
                            .collection('warehouses')
                            .doc(wh.id)
                            .set(wh);
                    }
                    return DEFAULT_WAREHOUSES;
                }
                
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                console.warn('Error fetching warehouses from Firebase (using defaults):', error);
                return DEFAULT_WAREHOUSES;
            }
        }
        
        // No database available, return defaults + local warehouses
        console.log('No database available, using default warehouses + localStorage');
        return getWarehousesWithLocal(DEFAULT_WAREHOUSES);
    }
    
    // Merge warehouses with localStorage custom warehouses
    function getWarehousesWithLocal(dbWarehouses) {
        try {
            const storageKey = 'nf_custom_warehouses';
            const localWarehouses = JSON.parse(localStorage.getItem(storageKey) || '[]');
            return [...dbWarehouses, ...localWarehouses];
        } catch (e) {
            return dbWarehouses;
        }
    }
    
    // Add warehouse - Support both Firebase and Supabase + localStorage fallback
    async function addWarehouse(warehouse) {
        console.log('Adding warehouse:', warehouse);
        
        // Validate warehouse data
        if (!warehouse || !warehouse.name || !warehouse.location) {
            console.error('Invalid warehouse data:', warehouse);
            return { success: false, error: 'بيانات المستودع غير مكتملة' };
        }
        
        // Try Supabase first
        if (window.supabaseClient && window.currentUser) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('warehouses')
                    .insert({
                        ...warehouse,
                        user_id: window.currentUser.id,
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (error) {
                    // Table doesn't exist - use localStorage fallback
                    if (error.code === '42P01' || error.message?.includes('does not exist')) {
                        console.warn('Warehouses table does not exist, using localStorage');
                        return saveWarehouseToLocal(warehouse);
                    }
                    // Duplicate key error
                    if (error.code === '23505' || error.message?.includes('duplicate')) {
                        return { success: false, error: 'مستودع بهذا الاسم موجود مسبقاً' };
                    }
                    throw error;
                }
                
                NFActivity.log('WAREHOUSE_ADDED', { warehouse: warehouse.name, action: 'إضافة مستودع' });
                console.log('Warehouse added successfully to Supabase:', data.id);
                return { success: true, id: data.id };
            } catch (error) {
                console.error('Error adding warehouse to Supabase:', error);
                // Fallback to localStorage
                return saveWarehouseToLocal(warehouse);
            }
        }
        
        // Try Firebase
        if (window.db && window.currentUser && window.currentUser.uid) {
            try {
                const docRef = await window.db.collection('users')
                    .doc(window.currentUser.uid)
                    .collection('warehouses')
                    .add({
                        ...warehouse,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                
                NFActivity.log('WAREHOUSE_ADDED', { warehouse: warehouse.name, action: 'إضافة مستودع' });
                console.log('Warehouse added successfully to Firebase:', docRef.id);
                return { success: true, id: docRef.id };
            } catch (error) {
                console.error('Error adding warehouse to Firebase:', error);
                return saveWarehouseToLocal(warehouse);
            }
        }
        
        // Fallback to localStorage
        return saveWarehouseToLocal(warehouse);
    }
    
    // Save warehouse to localStorage as fallback
    function saveWarehouseToLocal(warehouse) {
        try {
            const storageKey = 'nf_custom_warehouses';
            const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Check for duplicate
            if (existing.some(w => w.name.toLowerCase() === warehouse.name.toLowerCase())) {
                return { success: false, error: 'مستودع بهذا الاسم موجود مسبقاً' };
            }
            
            const newWarehouse = {
                ...warehouse,
                id: 'local_' + Date.now(),
                createdAt: new Date().toISOString()
            };
            
            existing.push(newWarehouse);
            localStorage.setItem(storageKey, JSON.stringify(existing));
            
            NFActivity.log('WAREHOUSE_ADDED', { warehouse: warehouse.name, action: 'إضافة مستودع (محلي)' });
            console.log('Warehouse saved to localStorage:', newWarehouse.id);
            return { success: true, id: newWarehouse.id };
        } catch (error) {
            console.error('Error saving warehouse to localStorage:', error);
            return { success: false, error: 'فشل في حفظ المستودع: ' + error.message };
        }
    }
    
    // Get vehicle count per warehouse
    async function getWarehouseStats(vehicles) {
        const stats = {};
        
        vehicles.forEach(v => {
            const wh = v.warehouse || 'unassigned';
            stats[wh] = (stats[wh] || 0) + 1;
        });
        
        return stats;
    }
    
    // Transfer vehicle to warehouse - Support both Firebase and Supabase
    async function transferVehicle(vehicleId, warehouseId, warehouseName) {
        // Try Supabase first
        if (window.supabaseClient && window.currentUser) {
            try {
                const { error } = await window.supabaseClient
                    .from('vehicles')
                    .update({
                        warehouse: warehouseId,
                        warehouseName: warehouseName,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', vehicleId)
                    .eq('user_id', window.currentUser.id);
                
                if (error) throw error;
                
                NFActivity.log('WAREHOUSE_TRANSFER', { 
                    vehicleId, 
                    warehouse: warehouseName 
                });
                
                return true;
            } catch (error) {
                console.error('Error transferring vehicle (Supabase):', error);
                return false;
            }
        }
        
        // Fallback to Firebase
        if (!window.currentUser || !window.db) return false;
        
        try {
            await window.db.collection('users')
                .doc(window.currentUser.uid)
                .collection('vehicles')
                .doc(vehicleId)
                .update({
                    warehouse: warehouseId,
                    warehouseName: warehouseName,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            NFActivity.log('WAREHOUSE_TRANSFER', { 
                vehicleId, 
                warehouse: warehouseName 
            });
            
            return true;
        } catch (error) {
            console.error('Error transferring vehicle:', error);
            return false;
        }
    }
    
    // Create warehouse selector HTML
    function createWarehouseSelector(warehouses, selectedId = '') {
        return `
            <select class="form-input" id="vehicleWarehouse">
                <option value="">-- اختر المستودع --</option>
                ${warehouses.map(wh => `
                    <option value="${wh.id}" ${selectedId === wh.id ? 'selected' : ''}>
                        ${wh.name} (${wh.location})
                    </option>
                `).join('')}
            </select>
        `;
    }
    
    // Create warehouse management page
    function createWarehousePageHTML(warehouses, vehicleStats) {
        const totalVehicles = Object.values(vehicleStats).reduce((a, b) => a + b, 0);
        
        return `
            <div class="nf-warehouse-page">
                <div class="nf-warehouse-header">
                    <h2><i class="fas fa-warehouse"></i> إدارة المستودعات</h2>
                    <button class="btn btn-primary" onclick="NFWarehouse.showAddModal()">
                        <i class="fas fa-plus"></i> إضافة مستودع
                    </button>
                </div>
                
                <div class="nf-warehouse-stats">
                    <div class="nf-wh-stat-card">
                        <i class="fas fa-warehouse"></i>
                        <div class="nf-wh-stat-value">${warehouses.length}</div>
                        <div class="nf-wh-stat-label">المستودعات</div>
                    </div>
                    <div class="nf-wh-stat-card">
                        <i class="fas fa-car"></i>
                        <div class="nf-wh-stat-value">${totalVehicles}</div>
                        <div class="nf-wh-stat-label">المركبات</div>
                    </div>
                    <div class="nf-wh-stat-card">
                        <i class="fas fa-question-circle"></i>
                        <div class="nf-wh-stat-value">${vehicleStats.unassigned || 0}</div>
                        <div class="nf-wh-stat-label">غير مخصصة</div>
                    </div>
                </div>
                
                <div class="nf-warehouse-grid">
                    ${warehouses.map(wh => {
                        const count = vehicleStats[wh.id] || 0;
                        const percentage = wh.capacity > 0 ? Math.round((count / wh.capacity) * 100) : 0;
                        const statusClass = percentage >= 90 ? 'full' : percentage >= 70 ? 'warning' : 'ok';
                        
                        return `
                            <div class="nf-warehouse-card">
                                <div class="nf-wh-card-header">
                                    <h3>${wh.name}</h3>
                                    <span class="nf-wh-location">
                                        <i class="fas fa-map-marker-alt"></i> ${wh.location}
                                    </span>
                                </div>
                                <div class="nf-wh-card-body">
                                    <div class="nf-wh-capacity">
                                        <div class="nf-wh-capacity-bar">
                                            <div class="nf-wh-capacity-fill ${statusClass}" style="width: ${percentage}%"></div>
                                        </div>
                                        <div class="nf-wh-capacity-text">
                                            <span>${count} / ${wh.capacity}</span>
                                            <span>${percentage}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="nf-wh-card-footer">
                                    <button class="btn btn-outline btn-sm" onclick="NFWarehouse.viewVehicles('${wh.id}')">
                                        <i class="fas fa-car"></i> عرض المركبات
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // Show add warehouse modal
    function showAddModal() {
        const modalHTML = `
            <div class="modal show" id="warehouseModal" onclick="if(event.target===this)this.remove()">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-warehouse"></i> إضافة مستودع جديد</h3>
                        <button class="btn-close" onclick="document.getElementById('warehouseModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>اسم المستودع *</label>
                            <input type="text" class="form-input" id="whName" required placeholder="مثال: المستودع الشمالي">
                        </div>
                        <div class="form-group">
                            <label>الموقع *</label>
                            <input type="text" class="form-input" id="whLocation" required placeholder="مثال: الرياض">
                        </div>
                        <div class="form-group">
                            <label>السعة (عدد المركبات)</label>
                            <input type="number" class="form-input" id="whCapacity" value="50" min="1">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="document.getElementById('warehouseModal').remove()">إلغاء</button>
                        <button class="btn btn-primary" onclick="NFWarehouse.saveWarehouse()">
                            <i class="fas fa-save"></i> حفظ
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Save warehouse
    async function saveWarehouse() {
        const name = document.getElementById('whName')?.value.trim();
        const location = document.getElementById('whLocation')?.value.trim();
        const capacity = parseInt(document.getElementById('whCapacity')?.value) || 50;
        
        if (!name) {
            window.showNotification?.('يرجى إدخال اسم المستودع', 'warning');
            return;
        }
        
        if (!location) {
            window.showNotification?.('يرجى إدخال موقع المستودع', 'warning');
            return;
        }
        
        // Disable button to prevent double-click
        const saveBtn = document.querySelector('#warehouseModal .btn-primary');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        }
        
        try {
            const result = await addWarehouse({ name, location, capacity });
            
            if (result.success) {
                window.showNotification?.('تم إضافة المستودع بنجاح', 'success');
                document.getElementById('warehouseModal')?.remove();
                // Refresh warehouse page if visible
                if (document.getElementById('warehouseSection')) {
                    await refreshWarehousePage();
                }
            } else {
                window.showNotification?.(result.error || 'حدث خطأ أثناء الإضافة', 'error');
                // Re-enable button
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ';
                }
            }
        } catch (error) {
            console.error('Save warehouse error:', error);
            window.showNotification?.('حدث خطأ غير متوقع: ' + error.message, 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ';
            }
        }
    }
    
    // View vehicles in warehouse
    function viewVehicles(warehouseId) {
        if (window.NFFilters?.instance) {
            window.NFFilters.instance.setFilter('warehouse', warehouseId);
        }
        // Switch to vehicles section
        window.showSection?.('vehicles');
    }
    
    // Refresh warehouse page
    async function refreshWarehousePage() {
        const container = document.getElementById('warehouseSection');
        if (!container) return;
        
        container.innerHTML = '<div class="nf-loading"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
        
        const warehouses = await getWarehouses();
        const stats = await getWarehouseStats(window.vehicles || []);
        container.innerHTML = createWarehousePageHTML(warehouses, stats);
    }
    
    const publicAPI = {
        getAll: getWarehouses,
        add: addWarehouse,
        getStats: getWarehouseStats,
        transfer: transferVehicle,
        createSelector: createWarehouseSelector,
        createPageHTML: createWarehousePageHTML,
        showAddModal,
        saveWarehouse,
        viewVehicles,
        refresh: refreshWarehousePage
    };
    
    console.log('🏭 NFWarehouse initialized with methods:', Object.keys(publicAPI));
    
    return publicAPI;
})();

// ===== Vehicle Operation Status =====
window.NFOperationStatus = (function() {
    'use strict';
    
    const STATUSES = {
        working: { label: 'تعمل', icon: 'fa-check-circle', color: '#10b981', bgColor: '#d1fae5' },
        not_working: { label: 'لا تعمل', icon: 'fa-times-circle', color: '#ef4444', bgColor: '#fee2e2' },
        needs_maintenance: { label: 'تحتاج صيانة', icon: 'fa-wrench', color: '#f59e0b', bgColor: '#fef3c7' }
    };
    
    function getStatusInfo(status) {
        return STATUSES[status] || STATUSES.not_working;
    }
    
    function createStatusBadge(status) {
        const info = getStatusInfo(status);
        return `
            <span class="nf-status-badge" style="background: ${info.bgColor}; color: ${info.color};">
                <i class="fas ${info.icon}"></i>
                ${info.label}
            </span>
        `;
    }
    
    function createStatusSelector(currentStatus = '') {
        return `
            <select class="form-input" id="operationStatus">
                <option value="">-- اختر حالة التشغيل --</option>
                ${Object.entries(STATUSES).map(([key, val]) => `
                    <option value="${key}" ${currentStatus === key ? 'selected' : ''}>
                        ${val.label}
                    </option>
                `).join('')}
            </select>
        `;
    }
    
    // Update vehicle status
    async function updateStatus(vehicleId, newStatus, vehicleName = '') {
        if (!window.currentUser || !window.db) return false;
        
        try {
            // Get current status first
            const doc = await window.db.collection('users')
                .doc(window.currentUser.uid)
                .collection('vehicles')
                .doc(vehicleId)
                .get();
            
            const oldStatus = doc.data()?.operationStatus || '';
            
            await window.db.collection('users')
                .doc(window.currentUser.uid)
                .collection('vehicles')
                .doc(vehicleId)
                .update({
                    operationStatus: newStatus,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            // Log activity
            NFActivity.log('STATUS_CHANGE', {
                vehicleId,
                vehicleName,
                oldStatus: STATUSES[oldStatus]?.label || 'غير محدد',
                newStatus: STATUSES[newStatus]?.label || 'غير محدد'
            });
            
            return true;
        } catch (error) {
            console.error('Error updating status:', error);
            return false;
        }
    }
    
    console.log('🔧 NFOperationStatus initialized');
    
    return {
        STATUSES,
        getInfo: getStatusInfo,
        createBadge: createStatusBadge,
        createSelector: createStatusSelector,
        update: updateStatus
    };
})();
