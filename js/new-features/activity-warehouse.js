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
        IMPORT_DATA: { icon: 'fa-file-import', color: 'primary', label: 'استيراد بيانات' },
        WAREHOUSE_TRANSFER: { icon: 'fa-warehouse', color: 'warning', label: 'نقل للمستودع' },
        STATUS_CHANGE: { icon: 'fa-cog', color: 'info', label: 'تغيير الحالة' },
        LOGIN: { icon: 'fa-sign-in-alt', color: 'success', label: 'تسجيل دخول' },
        LOGOUT: { icon: 'fa-sign-out-alt', color: 'warning', label: 'تسجيل خروج' }
    };
    
    // Log activity to Firestore
    async function logActivity(type, details = {}) {
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
                
            console.log('Activity logged:', type);
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }
    
    // Get recent activities
    async function getActivities(limit = 50) {
        if (!window.currentUser || !window.db) return [];
        
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
            return [];
        }
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
        const container = document.getElementById('activitiesSection');
        if (!container) return;
        
        container.innerHTML = '<div class="nf-loading"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
        
        const activities = await getActivities();
        container.innerHTML = createActivitiesPageHTML(activities);
    }
    
    console.log('📋 NFActivity initialized');
    
    return {
        TYPES: ACTIVITY_TYPES,
        log: logActivity,
        getAll: getActivities,
        format: formatActivity,
        createPageHTML: createActivitiesPageHTML,
        filterActivities,
        refreshActivities
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
    
    // Get warehouses
    async function getWarehouses() {
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
    
    // Add warehouse
    async function addWarehouse(warehouse) {
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
    
    // Transfer vehicle to warehouse
    async function transferVehicle(vehicleId, warehouseId, warehouseName) {
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
