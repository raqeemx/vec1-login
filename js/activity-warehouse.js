/**
 * ========================================
 * 📋 Activity Log & Warehouse Management
 * ========================================
 * 
 * نظام سجل النشاطات وإدارة المستودعات
 * 
 * ⚠️ لا يعدل أي JavaScript موجود - إضافة فقط!
 * 
 * 🆕 تم تحسين النظام ليسجل جميع الأحداث:
 * - تسجيل الدخول/الخروج
 * - إضافة/تعديل/حذف/عرض المركبات
 * - تصدير/استيراد البيانات
 * - التنقل بين الأقسام
 * - تغييرات الفلاتر والبحث
 * - التقاط GPS
 * - رفع الصور
 * - إدارة المستودعات والمقيّمين
 */

// ===== Activity Log System =====
window.NFActivity = (function() {
    'use strict';
    
    const ACTIVITY_TYPES = {
        // === المصادقة ===
        LOGIN: { icon: 'fa-sign-in-alt', color: 'success', label: 'تسجيل دخول', category: 'auth' },
        LOGOUT: { icon: 'fa-sign-out-alt', color: 'warning', label: 'تسجيل خروج', category: 'auth' },
        SESSION_START: { icon: 'fa-play-circle', color: 'success', label: 'بدء جلسة', category: 'auth' },
        
        // === المركبات ===
        VEHICLE_ADDED: { icon: 'fa-plus-circle', color: 'success', label: 'إضافة مركبة', category: 'vehicles' },
        VEHICLE_UPDATED: { icon: 'fa-edit', color: 'warning', label: 'تعديل مركبة', category: 'vehicles' },
        VEHICLE_DELETED: { icon: 'fa-trash', color: 'danger', label: 'حذف مركبة', category: 'vehicles' },
        VEHICLE_VIEWED: { icon: 'fa-eye', color: 'info', label: 'عرض مركبة', category: 'vehicles' },
        VEHICLE_SEARCH: { icon: 'fa-search', color: 'info', label: 'بحث عن مركبة', category: 'vehicles' },
        
        // === التصدير والاستيراد ===
        EXPORT_EXCEL: { icon: 'fa-file-excel', color: 'success', label: 'تصدير Excel', category: 'export' },
        EXPORT_JSON: { icon: 'fa-file-code', color: 'info', label: 'تصدير JSON', category: 'export' },
        EXPORT_IMAGES: { icon: 'fa-images', color: 'primary', label: 'تصدير روابط الصور', category: 'export' },
        IMPORT_DATA: { icon: 'fa-file-import', color: 'primary', label: 'استيراد بيانات', category: 'import' },
        
        // === المستودعات ===
        WAREHOUSE_TRANSFER: { icon: 'fa-warehouse', color: 'warning', label: 'نقل للمستودع', category: 'warehouse' },
        WAREHOUSE_ADDED: { icon: 'fa-plus', color: 'success', label: 'إضافة مستودع', category: 'warehouse' },
        WAREHOUSE_DELETED: { icon: 'fa-trash', color: 'danger', label: 'حذف مستودع', category: 'warehouse' },
        WAREHOUSE_VIEWED: { icon: 'fa-eye', color: 'info', label: 'عرض المستودعات', category: 'warehouse' },
        
        // === الحالة والتقييم ===
        STATUS_CHANGE: { icon: 'fa-cog', color: 'info', label: 'تغيير الحالة', category: 'status' },
        RATING_CHANGE: { icon: 'fa-star', color: 'warning', label: 'تغيير التقييم', category: 'status' },
        
        // === المقيّمين ===
        EVALUATOR_ADDED: { icon: 'fa-user-plus', color: 'success', label: 'إضافة مقيّم', category: 'evaluators' },
        EVALUATOR_DELETED: { icon: 'fa-user-minus', color: 'danger', label: 'حذف مقيّم', category: 'evaluators' },
        EVALUATOR_ASSIGNED: { icon: 'fa-user-tie', color: 'info', label: 'تعيين مقيّم', category: 'evaluators' },
        
        // === الصور ===
        IMAGE_UPLOADED: { icon: 'fa-cloud-upload-alt', color: 'success', label: 'رفع صورة', category: 'images' },
        IMAGE_DELETED: { icon: 'fa-trash-alt', color: 'danger', label: 'حذف صورة', category: 'images' },
        IMAGE_VIEWED: { icon: 'fa-image', color: 'info', label: 'عرض صورة', category: 'images' },
        ALBUM_VIEWED: { icon: 'fa-images', color: 'info', label: 'عرض الألبوم', category: 'images' },
        
        // === GPS والموقع ===
        GPS_CAPTURED: { icon: 'fa-map-marker-alt', color: 'success', label: 'التقاط GPS', category: 'gps' },
        GPS_CLEARED: { icon: 'fa-map-marker-alt', color: 'warning', label: 'مسح GPS', category: 'gps' },
        MAP_OPENED: { icon: 'fa-map', color: 'info', label: 'فتح الخريطة', category: 'gps' },
        
        // === التنقل ===
        PAGE_VIEW: { icon: 'fa-desktop', color: 'info', label: 'عرض صفحة', category: 'navigation' },
        SECTION_CHANGE: { icon: 'fa-exchange-alt', color: 'info', label: 'تغيير القسم', category: 'navigation' },
        MODAL_OPENED: { icon: 'fa-window-maximize', color: 'info', label: 'فتح نافذة', category: 'navigation' },
        MODAL_CLOSED: { icon: 'fa-window-minimize', color: 'info', label: 'إغلاق نافذة', category: 'navigation' },
        
        // === الفلاتر والبحث ===
        FILTER_APPLIED: { icon: 'fa-filter', color: 'info', label: 'تطبيق فلتر', category: 'filters' },
        FILTER_CLEARED: { icon: 'fa-times', color: 'warning', label: 'مسح الفلاتر', category: 'filters' },
        SORT_APPLIED: { icon: 'fa-sort', color: 'info', label: 'ترتيب البيانات', category: 'filters' },
        
        // === الإعدادات ===
        THEME_CHANGED: { icon: 'fa-moon', color: 'info', label: 'تغيير المظهر', category: 'settings' },
        SETTINGS_UPDATED: { icon: 'fa-cog', color: 'info', label: 'تحديث الإعدادات', category: 'settings' },
        
        // === الأخطاء ===
        ERROR_OCCURRED: { icon: 'fa-exclamation-triangle', color: 'danger', label: 'حدث خطأ', category: 'errors' },
        NETWORK_ERROR: { icon: 'fa-wifi', color: 'danger', label: 'خطأ الاتصال', category: 'errors' },
        
        // === عام ===
        DATA_LOADED: { icon: 'fa-database', color: 'success', label: 'تحميل البيانات', category: 'general' },
        DATA_SYNCED: { icon: 'fa-sync', color: 'success', label: 'مزامنة البيانات', category: 'general' },
        BULK_DELETE: { icon: 'fa-trash', color: 'danger', label: 'حذف جماعي', category: 'general' }
    };
    
    // إعدادات تتبع النشاطات
    const CONFIG = {
        enabled: true,
        logToConsole: true,
        trackNavigation: true,
        trackFilters: true,
        maxLogsToKeep: 500,
        batchSize: 10,
        batchDelay: 5000 // 5 ثوان
    };
    
    // قائمة انتظار للتسجيل الجماعي
    let pendingLogs = [];
    let batchTimeout = null;
    
    // Log activity - Support both Firebase and Supabase
    async function logActivity(type, details = {}, immediate = false) {
        // تحقق من تفعيل التتبع
        if (!CONFIG.enabled) return;
        
        // إضافة معلومات إضافية للنشاط
        const typeInfo = ACTIVITY_TYPES[type] || { icon: 'fa-circle', color: 'secondary', label: type, category: 'general' };
        const enrichedDetails = {
            ...details,
            _timestamp: new Date().toISOString(),
            _userAgent: navigator.userAgent.substring(0, 100),
            _screenSize: `${window.innerWidth}x${window.innerHeight}`,
            _isMobile: window.innerWidth <= 768,
            _url: window.location.href,
            _category: typeInfo.category
        };
        
        // طباعة في Console إذا كان مفعّل
        if (CONFIG.logToConsole) {
            console.log(`📋 [${typeInfo.category}] ${typeInfo.label}:`, enrichedDetails);
        }
        
        // إضافة إلى قائمة الانتظار للتسجيل الجماعي
        if (!immediate && CONFIG.batchSize > 1) {
            pendingLogs.push({ type, details: enrichedDetails });
            
            // إذا وصلنا للحد الأقصى، نرسل فوراً
            if (pendingLogs.length >= CONFIG.batchSize) {
                await flushPendingLogs();
            } else if (!batchTimeout) {
                // جدولة الإرسال بعد فترة
                batchTimeout = setTimeout(() => flushPendingLogs(), CONFIG.batchDelay);
            }
            return;
        }
        
        // التسجيل الفوري
        await saveActivityToDatabase(type, enrichedDetails);
    }
    
    // حفظ النشاط في قاعدة البيانات
    async function saveActivityToDatabase(type, details) {
        // Try Supabase first - use global getSupabaseClientAsync if available
        let client = window.supabaseClient;
        if (!client && typeof window.getSupabaseClientAsync === 'function') {
            try {
                client = await window.getSupabaseClientAsync();
            } catch (e) {
                console.warn('Could not get Supabase client:', e);
            }
        }
        
        if (client && window.currentUser) {
            try {
                const activity = {
                    activity_type: type,
                    details: details,
                    user_id: window.currentUser.id,
                    created_at: new Date().toISOString()
                };
                
                const { error } = await client
                    .from('activity_logs')
                    .insert(activity);
                
                if (error) {
                    // Check if table doesn't exist - silently fail
                    if (error.code === '42P01' || error.message?.includes('does not exist')) {
                        // Store locally instead
                        storeLocalActivity(type, details);
                        return;
                    }
                    throw error;
                }
                    
                return;
            } catch (error) {
                console.warn('Error logging activity to Supabase:', error.message || error);
                storeLocalActivity(type, details);
            }
        }
        
        // Fallback to Firebase
        if (!window.currentUser || !window.db) {
            storeLocalActivity(type, details);
            return;
        }
        
        try {
            const activity = {
                type: type,
                details: details,
                userId: window.currentUser.uid,
                userName: window.currentUser.displayName || window.currentUser.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent.substring(0, 200)
            };
            
            await window.db.collection('users')
                .doc(window.currentUser.uid)
                .collection('activities')
                .add(activity);
        } catch (error) {
            console.error('Error logging activity:', error);
            storeLocalActivity(type, details);
        }
    }
    
    // إرسال النشاطات المعلقة
    async function flushPendingLogs() {
        if (batchTimeout) {
            clearTimeout(batchTimeout);
            batchTimeout = null;
        }
        
        if (pendingLogs.length === 0) return;
        
        const logsToSend = [...pendingLogs];
        pendingLogs = [];
        
        // Try to batch insert
        let client = window.supabaseClient;
        if (!client && typeof window.getSupabaseClientAsync === 'function') {
            try {
                client = await window.getSupabaseClientAsync();
            } catch (e) {
                console.warn('Could not get Supabase client for batch:', e);
            }
        }
        
        if (client && window.currentUser) {
            try {
                const activities = logsToSend.map(log => ({
                    activity_type: log.type,
                    details: log.details,
                    user_id: window.currentUser.id,
                    created_at: log.details._timestamp || new Date().toISOString()
                }));
                
                const { error } = await client
                    .from('activity_logs')
                    .insert(activities);
                
                if (error) {
                    // Store locally if database fails
                    logsToSend.forEach(log => storeLocalActivity(log.type, log.details));
                }
            } catch (error) {
                console.warn('Batch insert failed:', error);
                logsToSend.forEach(log => storeLocalActivity(log.type, log.details));
            }
        } else {
            // Store locally
            logsToSend.forEach(log => storeLocalActivity(log.type, log.details));
        }
    }
    
    // تخزين النشاط محلياً
    function storeLocalActivity(type, details) {
        try {
            const localLogs = JSON.parse(localStorage.getItem('nf_activity_logs') || '[]');
            localLogs.push({
                id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type,
                details,
                timestamp: new Date().toISOString()
            });
            
            // الاحتفاظ بآخر CONFIG.maxLogsToKeep سجل فقط
            if (localLogs.length > CONFIG.maxLogsToKeep) {
                localLogs.splice(0, localLogs.length - CONFIG.maxLogsToKeep);
            }
            
            localStorage.setItem('nf_activity_logs', JSON.stringify(localLogs));
        } catch (e) {
            console.warn('Could not store local activity:', e);
        }
    }
    
    // جلب النشاطات المحلية
    function getLocalActivities() {
        try {
            return JSON.parse(localStorage.getItem('nf_activity_logs') || '[]');
        } catch (e) {
            return [];
        }
    }
    
    // Get recent activities - Support both Firebase, Supabase, and Local Storage
    async function getActivities(limit = 50, filterCategory = null) {
        let activities = [];
        
        // Try Supabase first - use global getSupabaseClientAsync if available
        let client = window.supabaseClient;
        if (!client && typeof window.getSupabaseClientAsync === 'function') {
            try {
                client = await window.getSupabaseClientAsync();
            } catch (e) {
                console.warn('Could not get Supabase client:', e);
            }
        }
        
        if (client && window.currentUser) {
            try {
                const { data, error } = await client
                    .from('activity_logs')
                    .select('*')
                    .eq('user_id', window.currentUser.id)
                    .order('created_at', { ascending: false })
                    .limit(limit);
                
                if (error) {
                    // Check if table doesn't exist
                    if (error.code === '42P01' || error.message?.includes('does not exist')) {
                        console.warn('Activity logs table does not exist - using local storage');
                    } else {
                        throw error;
                    }
                } else {
                    // Transform data to match expected format
                    activities = (data || []).map(item => ({
                        id: item.id,
                        type: item.activity_type,
                        details: item.details || {},
                        timestamp: item.created_at
                    }));
                }
            } catch (error) {
                console.warn('Error fetching activities from Supabase:', error.message || error);
            }
        }
        
        // Fallback to Firebase
        if (activities.length === 0 && window.db && window.currentUser) {
            try {
                const snapshot = await window.db.collection('users')
                    .doc(window.currentUser.uid)
                    .collection('activities')
                    .orderBy('timestamp', 'desc')
                    .limit(limit)
                    .get();
                
                activities = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                console.error('Error fetching activities from Firebase:', error);
            }
        }
        
        // Include local activities
        const localActivities = getLocalActivities();
        if (localActivities.length > 0) {
            activities = [...activities, ...localActivities];
            // Sort by timestamp and remove duplicates
            activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        // Apply category filter if specified
        if (filterCategory && filterCategory !== 'all') {
            activities = activities.filter(a => {
                const typeInfo = ACTIVITY_TYPES[a.type];
                return typeInfo && typeInfo.category === filterCategory;
            });
        }
        
        // If still no activities, return mock data for demo
        if (activities.length === 0) {
            return generateMockActivities();
        }
        
        // Limit results
        return activities.slice(0, limit);
    }
    
    // Generate mock activities for demo purposes
    function generateMockActivities() {
        const now = new Date();
        return [
            {
                id: 'demo-1',
                type: 'LOGIN',
                details: { message: 'تسجيل دخول ناجح' },
                timestamp: new Date(now - 5 * 60000).toISOString()
            },
            {
                id: 'demo-2',
                type: 'VEHICLE_ADDED',
                details: { vehicleName: 'تويوتا كامري 2023', contractNo: 'CNT-001' },
                timestamp: new Date(now - 30 * 60000).toISOString()
            },
            {
                id: 'demo-3',
                type: 'EXPORT_EXCEL',
                details: { count: 5, message: 'تم تصدير 5 مركبات' },
                timestamp: new Date(now - 60 * 60000).toISOString()
            }
        ];
    }
    
    // Format activity for display
    function formatActivity(activity) {
        const typeInfo = ACTIVITY_TYPES[activity.type] || { 
            icon: 'fa-circle', 
            color: 'secondary', 
            label: activity.type 
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
    
    // الفئات المتاحة للفلترة
    const ACTIVITY_CATEGORIES = {
        all: { label: 'جميع الأنشطة', icon: 'fa-list' },
        auth: { label: 'المصادقة', icon: 'fa-sign-in-alt' },
        vehicles: { label: 'المركبات', icon: 'fa-car' },
        export: { label: 'التصدير', icon: 'fa-file-export' },
        import: { label: 'الاستيراد', icon: 'fa-file-import' },
        warehouse: { label: 'المستودعات', icon: 'fa-warehouse' },
        evaluators: { label: 'المقيّمين', icon: 'fa-user-tie' },
        images: { label: 'الصور', icon: 'fa-images' },
        gps: { label: 'الموقع', icon: 'fa-map-marker-alt' },
        navigation: { label: 'التنقل', icon: 'fa-route' },
        filters: { label: 'الفلاتر', icon: 'fa-filter' },
        settings: { label: 'الإعدادات', icon: 'fa-cog' },
        errors: { label: 'الأخطاء', icon: 'fa-exclamation-triangle' },
        general: { label: 'عام', icon: 'fa-circle' }
    };

    // Create activities page content
    function createActivitiesPageHTML(activities) {
        const formattedActivities = activities.map(formatActivity);
        
        // إحصائيات حسب الفئات
        const categoryStats = {};
        activities.forEach(a => {
            const typeInfo = ACTIVITY_TYPES[a.type] || { category: 'general' };
            const cat = typeInfo.category || 'general';
            categoryStats[cat] = (categoryStats[cat] || 0) + 1;
        });
        
        return `
            <div class="nf-activities-page">
                <div class="nf-activities-header">
                    <h2><i class="fas fa-history"></i> سجل النشاطات</h2>
                    <div class="nf-activities-stats">
                        <span><strong>${activities.length}</strong> نشاط</span>
                    </div>
                </div>
                
                <!-- إحصائيات سريعة -->
                <div class="nf-activity-quick-stats">
                    ${Object.entries(categoryStats).slice(0, 6).map(([cat, count]) => {
                        const catInfo = ACTIVITY_CATEGORIES[cat] || ACTIVITY_CATEGORIES.general;
                        return `
                            <div class="nf-quick-stat" onclick="NFActivity.filterByCategory('${cat}')">
                                <i class="fas ${catInfo.icon}"></i>
                                <span class="stat-count">${count}</span>
                                <span class="stat-label">${catInfo.label}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="nf-activities-filters">
                    <select id="activityCategoryFilter" class="nf-filter-select" onchange="NFActivity.filterByCategory(this.value)">
                        ${Object.entries(ACTIVITY_CATEGORIES).map(([key, val]) => 
                            `<option value="${key}"><i class="fas ${val.icon}"></i> ${val.label}</option>`
                        ).join('')}
                    </select>
                    <select id="activityTypeFilter" class="nf-filter-select" onchange="NFActivity.filterActivities()">
                        <option value="">جميع أنواع الأنشطة</option>
                        ${Object.entries(ACTIVITY_TYPES).map(([key, val]) => 
                            `<option value="${key}">${val.label}</option>`
                        ).join('')}
                    </select>
                    <button class="btn btn-outline" onclick="NFActivity.refreshActivities()">
                        <i class="fas fa-sync-alt"></i> تحديث
                    </button>
                    <button class="btn btn-outline btn-danger-outline" onclick="NFActivity.clearLocalLogs()" title="مسح السجلات المحلية">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="nf-activities-list" id="activitiesList">
                    ${formattedActivities.length > 0 ? formattedActivities.map(a => `
                        <div class="nf-activity-item" data-type="${a.type}" data-category="${a.typeInfo.category || 'general'}">
                            <div class="nf-activity-icon ${a.typeInfo.color}">
                                <i class="fas ${a.typeInfo.icon}"></i>
                            </div>
                            <div class="nf-activity-content">
                                <div class="nf-activity-header-row">
                                    <div class="nf-activity-title">${a.typeInfo.label}</div>
                                    <span class="nf-activity-category-badge">${ACTIVITY_CATEGORIES[a.typeInfo.category]?.label || 'عام'}</span>
                                </div>
                                <div class="nf-activity-details">
                                    ${formatDetails(a.details)}
                                </div>
                                <div class="nf-activity-meta">
                                    <span><i class="fas fa-clock"></i> ${a.timeAgo}</span>
                                    <span class="nf-activity-date">${a.formattedDate}</span>
                                    ${a.details?._isMobile ? '<span class="nf-device-badge"><i class="fas fa-mobile-alt"></i> هاتف</span>' : ''}
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
        
        return parts.join(' • ');
    }
    
    // Filter activities in UI
    function filterActivities() {
        const filter = document.getElementById('activityTypeFilter')?.value;
        const items = document.querySelectorAll('.nf-activity-item');
        
        items.forEach(item => {
            if (!filter || item.dataset.type === filter) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Refresh activities
    async function refreshActivities() {
        const container = document.getElementById('activitiesSection');
        if (!container) return;
        
        container.innerHTML = '<div class="nf-loading"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
        
        const activities = await getActivities();
        container.innerHTML = createActivitiesPageHTML(activities);
    }
    
    // فلترة حسب الفئة
    async function filterByCategory(category) {
        const container = document.getElementById('activitiesSection');
        if (!container) return;
        
        container.innerHTML = '<div class="nf-loading"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
        
        const activities = await getActivities(100, category === 'all' ? null : category);
        container.innerHTML = createActivitiesPageHTML(activities);
        
        // تحديد القيمة في القائمة المنسدلة
        const categoryFilter = document.getElementById('activityCategoryFilter');
        if (categoryFilter) categoryFilter.value = category;
    }
    
    // مسح السجلات المحلية
    function clearLocalLogs() {
        if (confirm('هل أنت متأكد من مسح سجل النشاطات المحلي؟')) {
            localStorage.removeItem('nf_activity_logs');
            refreshActivities();
            if (window.showNotification) {
                showNotification('تم مسح السجلات المحلية', 'info');
            }
        }
    }
    
    // إعداد التتبع التلقائي للأحداث
    function setupAutoTracking() {
        // تتبع تغيير الصفحة (SPA navigation)
        if (CONFIG.trackNavigation) {
            // تتبع النقرات على عناصر القائمة
            document.addEventListener('click', function(e) {
                const menuItem = e.target.closest('.menu-item');
                if (menuItem) {
                    const sectionName = menuItem.textContent.trim();
                    logActivity('SECTION_CHANGE', { section: sectionName });
                }
            });
        }
        
        // تتبع أخطاء JavaScript
        window.addEventListener('error', function(e) {
            logActivity('ERROR_OCCURRED', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno
            }, true);
        });
        
        // تتبع انقطاع الاتصال
        window.addEventListener('offline', function() {
            logActivity('NETWORK_ERROR', { status: 'offline' }, true);
        });
        
        window.addEventListener('online', function() {
            logActivity('DATA_SYNCED', { status: 'online' }, true);
        });
        
        // تتبع إغلاق الصفحة
        window.addEventListener('beforeunload', function() {
            flushPendingLogs();
        });
    }
    
    // تشغيل التتبع التلقائي
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupAutoTracking);
        } else {
            setupAutoTracking();
        }
    }
    
    console.log('📋 NFActivity initialized - Enhanced tracking enabled');
    
    return {
        TYPES: ACTIVITY_TYPES,
        CATEGORIES: ACTIVITY_CATEGORIES,
        CONFIG: CONFIG,
        log: logActivity,
        getAll: getActivities,
        getLocal: getLocalActivities,
        format: formatActivity,
        createPageHTML: createActivitiesPageHTML,
        filterActivities,
        filterByCategory,
        refreshActivities,
        clearLocalLogs,
        flushLogs: flushPendingLogs
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
        // Try Supabase first
        if (window.supabaseClient && window.currentUser) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('warehouses')
                    .select('*')
                    .eq('user_id', window.currentUser.id)
                    .order('name');
                
                if (error) throw error;
                
                if (!data || data.length === 0) {
                    // Return defaults but don't auto-create in Supabase
                    return DEFAULT_WAREHOUSES;
                }
                
                return data;
            } catch (error) {
                console.error('Error fetching warehouses from Supabase:', error);
                return DEFAULT_WAREHOUSES;
            }
        }
        
        // Fallback to Firebase
        if (!window.currentUser || !window.db) return DEFAULT_WAREHOUSES;
        
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
            console.error('Error fetching warehouses:', error);
            return DEFAULT_WAREHOUSES;
        }
    }
    
    // Add warehouse - Support both Firebase and Supabase
    async function addWarehouse(warehouse) {
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
                
                if (error) throw error;
                
                NFActivity.log('WAREHOUSE_TRANSFER', { warehouse: warehouse.name, action: 'إضافة مستودع' });
                return data.id;
            } catch (error) {
                console.error('Error adding warehouse to Supabase:', error);
                return null;
            }
        }
        
        // Fallback to Firebase
        if (!window.currentUser || !window.db) return null;
        
        try {
            const docRef = await window.db.collection('users')
                .doc(window.currentUser.uid)
                .collection('warehouses')
                .add({
                    ...warehouse,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            NFActivity.log('WAREHOUSE_TRANSFER', { warehouse: warehouse.name, action: 'إضافة مستودع' });
            return docRef.id;
        } catch (error) {
            console.error('Error adding warehouse:', error);
            return null;
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
        
        if (!name || !location) {
            window.showNotification?.('يرجى ملء جميع الحقول المطلوبة', 'warning');
            return;
        }
        
        const result = await addWarehouse({ name, location, capacity });
        
        if (result) {
            window.showNotification?.('تم إضافة المستودع بنجاح', 'success');
            document.getElementById('warehouseModal')?.remove();
            // Refresh warehouse page if visible
            if (document.getElementById('warehouseSection')) {
                await refreshWarehousePage();
            }
        } else {
            window.showNotification?.('حدث خطأ أثناء الإضافة', 'error');
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
    
    console.log('🏭 NFWarehouse initialized');
    
    return {
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
