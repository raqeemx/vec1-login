/**
 * ========================================
 * 📊 Dashboard Stats - إحصائيات لوحة التحكم
 * ========================================
 * 
 * نظام إحصائيات متقدم للوحة التحكم
 * 
 * ⚠️ لا يعدل أي JavaScript موجود - إضافة فقط!
 */

// ===== Namespace to avoid conflicts =====
window.NFStats = (function() {
    'use strict';
    
    // ===== Calculate Stats =====
    function calculateStats(vehicles) {
        const stats = {
            total: vehicles.length,
            totalValue: 0,
            avgValue: 0,
            thisMonth: 0,
            lastMonth: 0,
            ratings: {
                excellent: 0,
                good: 0,
                fair: 0,
                poor: 0
            },
            topVehicles: [],
            byMake: {},
            monthlyTrend: []
        };
        
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        vehicles.forEach(v => {
            // Total value
            const value = parseFloat(v.marketValue) || 0;
            stats.totalValue += value;
            
            // Ratings count
            if (v.overallRating && stats.ratings.hasOwnProperty(v.overallRating)) {
                stats.ratings[v.overallRating]++;
            }
            
            // By make
            if (v.make) {
                stats.byMake[v.make] = (stats.byMake[v.make] || 0) + 1;
            }
            
            // This month count
            if (v.createdAt) {
                const date = v.createdAt.toDate ? v.createdAt.toDate() : new Date(v.createdAt);
                if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
                    stats.thisMonth++;
                }
                // Last month
                const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
                const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
                if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
                    stats.lastMonth++;
                }
            }
        });
        
        // Average value
        stats.avgValue = stats.total > 0 ? stats.totalValue / stats.total : 0;
        
        // Top 5 vehicles by value
        stats.topVehicles = [...vehicles]
            .sort((a, b) => (parseFloat(b.marketValue) || 0) - (parseFloat(a.marketValue) || 0))
            .slice(0, 5);
        
        // Month over month trend
        stats.monthTrend = stats.lastMonth > 0 
            ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1)
            : 0;
        
        return stats;
    }
    
    // ===== Calculate Average Rating =====
    function calculateAvgRating(ratings) {
        const values = { excellent: 4, good: 3, fair: 2, poor: 1 };
        const total = Object.values(ratings).reduce((a, b) => a + b, 0);
        if (total === 0) return 0;
        
        let sum = 0;
        Object.keys(ratings).forEach(key => {
            sum += ratings[key] * values[key];
        });
        
        return (sum / total).toFixed(1);
    }
    
    // ===== Get Rating Text =====
    function getRatingText(rating) {
        const texts = {
            excellent: 'ممتاز',
            good: 'جيد',
            fair: 'مقبول',
            poor: 'ضعيف'
        };
        return texts[rating] || rating;
    }
    
    // ===== Create Enhanced Stats HTML =====
    function createEnhancedStatsHTML(stats) {
        const avgRating = calculateAvgRating(stats.ratings);
        const totalRatings = Object.values(stats.ratings).reduce((a, b) => a + b, 0);
        
        return `
            <div class="nf-stats-enhanced">
                <!-- Total Vehicles Card -->
                <div class="nf-stat-card">
                    <div class="nf-stat-header">
                        <div>
                            <div class="nf-stat-value">${stats.total}</div>
                            <div class="nf-stat-label">إجمالي المركبات</div>
                        </div>
                        <div class="nf-stat-icon">
                            <i class="fas fa-car"></i>
                        </div>
                    </div>
                    <div class="nf-stat-footer">
                        <span class="nf-stat-trend ${stats.monthTrend > 0 ? 'up' : stats.monthTrend < 0 ? 'down' : 'neutral'}">
                            <i class="fas fa-${stats.monthTrend > 0 ? 'arrow-up' : stats.monthTrend < 0 ? 'arrow-down' : 'minus'}"></i>
                            ${Math.abs(stats.monthTrend)}%
                        </span>
                        <span class="nf-stat-link">
                            عن الشهر الماضي
                        </span>
                    </div>
                </div>
                
                <!-- Total Value Card -->
                <div class="nf-stat-card">
                    <div class="nf-stat-header">
                        <div>
                            <div class="nf-stat-value">
                                ${formatNumber(stats.totalValue)}
                                <span class="nf-stat-currency">ر.س</span>
                            </div>
                            <div class="nf-stat-label">القيمة الإجمالية</div>
                        </div>
                        <div class="nf-stat-icon success">
                            <i class="fas fa-coins"></i>
                        </div>
                    </div>
                    <div class="nf-stat-footer">
                        <span class="nf-stat-label">متوسط القيمة: ${formatNumber(stats.avgValue)} ر.س</span>
                    </div>
                </div>
                
                <!-- Average Rating Card -->
                <div class="nf-stat-card">
                    <div class="nf-stat-header">
                        <div>
                            <div class="nf-stat-value">
                                ${avgRating > 0 ? avgRating : '-'}
                                <span class="nf-stat-currency">/4</span>
                            </div>
                            <div class="nf-stat-label">متوسط التقييم</div>
                        </div>
                        <div class="nf-stat-icon warning">
                            <i class="fas fa-star"></i>
                        </div>
                    </div>
                    <div class="nf-rating-bars">
                        ${Object.entries(stats.ratings).map(([key, count]) => {
                            const percentage = totalRatings > 0 ? (count / totalRatings * 100) : 0;
                            return `
                                <div class="nf-rating-bar-item">
                                    <span class="nf-rating-bar-label">${getRatingText(key)}</span>
                                    <div class="nf-rating-bar-track">
                                        <div class="nf-rating-bar-fill ${key}" style="width: ${percentage}%"></div>
                                    </div>
                                    <span class="nf-rating-bar-count">${count}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <!-- This Month Card -->
                <div class="nf-stat-card">
                    <div class="nf-stat-header">
                        <div>
                            <div class="nf-stat-value">${stats.thisMonth}</div>
                            <div class="nf-stat-label">مركبات هذا الشهر</div>
                        </div>
                        <div class="nf-stat-icon info">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                    </div>
                    <div class="nf-stat-progress">
                        <div class="nf-stat-progress-bar">
                            <div class="nf-stat-progress-fill" style="width: ${Math.min((stats.thisMonth / Math.max(stats.total, 1)) * 100, 100)}%"></div>
                        </div>
                        <div class="nf-stat-progress-label">
                            <span>الشهر الماضي: ${stats.lastMonth}</span>
                            <span>${stats.total > 0 ? ((stats.thisMonth / stats.total) * 100).toFixed(0) : 0}% من الإجمالي</span>
                        </div>
                    </div>
                </div>
                
                <!-- Top Vehicles Card -->
                ${stats.topVehicles.length > 0 ? `
                <div class="nf-stat-card nf-top-vehicles-card">
                    <div class="nf-stat-header">
                        <div>
                            <div class="nf-stat-label" style="font-size: 1.1rem; font-weight: 700; color: #1f2937;">
                                <i class="fas fa-trophy" style="color: #f59e0b; margin-left: 8px;"></i>
                                أعلى 5 مركبات قيمة
                            </div>
                        </div>
                    </div>
                    <ul class="nf-top-list">
                        ${stats.topVehicles.map((v, i) => `
                            <li class="nf-top-list-item">
                                <span class="nf-top-list-rank">${i + 1}</span>
                                <div class="nf-top-list-info">
                                    <div class="nf-top-list-name">${v.make || ''} ${v.model || ''} ${v.year || ''}</div>
                                    <div class="nf-top-list-detail">${v.customerName || 'غير محدد'}</div>
                                </div>
                                <span class="nf-top-list-value">${formatNumber(v.marketValue || 0)} ر.س</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    // ===== Format Number =====
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return Math.round(num).toLocaleString('ar-SA');
    }
    
    // ===== Initialize Enhanced Stats =====
    function init(containerId, vehicles) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const stats = calculateStats(vehicles);
        container.innerHTML = createEnhancedStatsHTML(stats);
    }
    
    // ===== Update Stats =====
    function update(containerId, vehicles) {
        init(containerId, vehicles);
    }
    
    console.log('📊 NFStats initialized');
    
    // ===== Public API =====
    return {
        init: init,
        update: update,
        calculateStats: calculateStats
    };
    
})();
