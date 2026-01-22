/**
 * ========================================
 * 📋 Activity Log & Warehouse Management
 * ========================================
 * 
 * نظام سجل النشاطات وإدارة المستودعات
 * 
 * ⚠️ لا يعدل أي JavaScript موجود - إضافة فقط!
 */

// ===== Activity Log System =====
window.NFActivity = (function() {
    'use strict';
    
    const ACTIVITY_TYPES = {
        VEHICLE_ADDED: { icon: 'fa-plus-circle', color: 'success', label: 'إضافة مركبة' },
        VEHICLE_UPDATED: { icon: 'fa-edit', color: 'warning', label: 'تعديل مركبة' },
        VEHICLE_DELETED: { icon: 'fa-trash', color: 'danger', label: 'حذف مركبة' },
        VEHICLE_VIEWED: { icon: 'fa-eye', color: 'info', label: 'عرض مركبة' },
        EXPORT_EXCEL: { icon: 'fa-file-excel', color: 'success', label: 'تصدير Excel' },
        EXPORT_JSON: { icon: 'fa-file-code', color: 'info', label: 'تصدير JSON' },
        EXPORT_IMAGES: { icon: 'fa-images', color: 'primary', label: 'تصدير روابط الصور' },
        IMPORT_DATA: { icon: 'fa-file-import', color: 'primary', label: 'استيراد بيانات' },
        WAREHOUSE_TRANSFER: { icon: 'fa-warehouse', color: 'warning', label: 'نقل للمستودع' },
        STATUS_CHANGE: { icon: 'fa-cog', color: 'info', label: 'تغيير الحالة' },
        LOGIN: { icon: 'fa-sign-in-alt', color: 'success', label: 'تسجيل دخول' },
        LOGOUT: { icon: 'fa-sign-out-alt', color: 'warning', label: 'تسجيل خروج' }
    };
    
    // Log activity - Support both Firebase and Supabase
    async function logActivity(type, details = {}) {
        console.log('Attempting to log activity:', type, details);
        
        // Ensure we have a type
        if (!type) {
            console.error('Activity type is required');
            return;
        }

        // Try Supabase first
        let client = window.supabaseClient;
        
        // Check for authenticated user
        const user = window.currentUser || (client && client.auth && typeof client.auth.user === 'function' ? client.auth.user() : null);
        
        if (client && user) {
            try {
                const activity = {
                    activity_type: type,
                    details: details,
                    user_id: user.id,
                    created_at: new Date().toISOString()
                };
                
                const { error } = await client
                    .from('activity_logs')
                    .insert(activity);
                
                if (error) {
                    console.error('Supabase logging error:', error);
                    if (error.code === '42P01' || error.message?.includes('does not exist')) {
                        console.warn('Activity logs table does not exist');
                        return;
                    }
                    throw error;
                }
                    
                console.log('Activity logged successfully (Supabase):', type);
                return;
            } catch (error) {
                console.warn('Error logging activity to Supabase:', error.message || error);
            }
        }
        
        // Fallback to Firebase
        if (!window.currentUser || !window.db) return;
        
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
                
            console.log('Activity logged (Firebase):', type);
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }
    
    // Get recent activities - Support both Firebase and Supabase
    async function getActivities(limit = 50) {
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
                        console.warn('Activity logs table does not exist');
                        return generateMockActivities();
                    }
                    throw error;
                }
                
                // Transform data to match expected format
                const activities = (data || []).map(item => ({
                    id: item.id,
                    type: item.activity_type,
                    details: item.details || {},
                    timestamp: item.created_at
                }));
                
                // If no activities, return mock data for demo
                if (activities.length === 0) {
                    return generateMockActivities();
                }
                
                return activities;
            } catch (error) {
                console.warn('Error fetching activities from Supabase:', error.message || error);
                return generateMockActivities();
            }
        }
        
        // Fallback to Firebase
        if (window.db && window.currentUser) {
            try {
                const snapshot = await window.db.collection('users')
                    .doc(window.currentUser.uid)
                    .collection('activities')
                    .orderBy('timestamp', 'desc')
                    .limit(limit)
                    .get();
                
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                console.error('Error fetching activities:', error);
            }
        }
        
        // Return mock data if no database available
        return generateMockActivities();
    }
    
    // Generate mock activities for demo purposes
    function generateMockActivities() {
        const now = new Date();
        return [
            {
                id: 'demo-1',
                type: 'LOGIN',
                details: { message: 'تسجيل دخول ناجح للمستخدم' },
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
                type: 'VEHICLE_UPDATED',
                details: { vehicleName: 'نيسان باترول 2022', action: 'تعديل بيانات المحرك' },
                timestamp: new Date(now - 45 * 60000).toISOString()
            },
            {
                id: 'demo-4',
                type: 'EXPORT_EXCEL',
                details: { count: 5, message: 'تم تصدير 5 مركبات بنجاح' },
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
    
    // Create activities page content
    function createActivitiesPageHTML(activities) {
        const formattedActivities = activities.map(formatActivity);
        
        return `
            <div class="nf-activities-page">
                <div class="nf-activities-header">
                    <h2><i class="fas fa-history"></i> سجل النشاطات</h2>
                    <div class="nf-activities-stats">
                        <span><strong>${activities.length}</strong> نشاط</span>
                    </div>
                </div>
                
                <div class="nf-activities-filters">
                    <select id="activityTypeFilter" class="nf-filter-select" onchange="NFActivity.filterActivities()">
                        <option value="">جميع الأنشطة</option>
                        ${Object.entries(ACTIVITY_TYPES).map(([key, val]) => 
                            `<option value="${key}">${val.label}</option>`
                        ).join('')}
                    </select>
                    <button class="btn btn-outline" onclick="NFActivity.refreshActivities()">
                        <i class="fas fa-sync-alt"></i> تحديث
                    </button>
                </div>
                
                <div class="nf-activities-list" id="activitiesList">
                    ${formattedActivities.length > 0 ? formattedActivities.map(a => `
                        <div class="nf-activity-item" data-type="${a.type}">
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
        console.log('Refreshing activities...');
        const container = document.getElementById('activitiesSection');
        if (!container) {
            console.error('Activities container #activitiesSection not found');
            return;
        }
        
        container.innerHTML = '<div class="nf-loading"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
        
        try {
            const activities = await getActivities();
            console.log('Activities fetched:', activities);
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
    
    console.log('📋 NFActivity initialized');
    
    return {
        TYPES: ACTIVITY_TYPES,
        log: logActivity,
        getAll: getActivities,
        format: formatActivity,
        createPageHTML: createActivitiesPageHTML,
        filterActivities,
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
        
        // No database available, return defaults
        console.log('No database available, using default warehouses');
        return DEFAULT_WAREHOUSES;
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
