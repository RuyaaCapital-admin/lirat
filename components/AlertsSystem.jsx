
'use client';

import React, { useEffect, useCallback, useRef, useMemo } from "react";
import { Alert } from "@/api/entities";
import { Asset } from "@/api/entities";
import { User } from "@/api/entities";
import { Notification } from "@/api/entities";
import { searchSymbols } from "@/api/functions";
import { getRealTimePrice } from "@/api/functions";
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp, DollarSign, BellOff, Pencil, CheckCircle2, History } from "lucide-react";
import { useTheme } from "./ui/Theme";
import { toEnDigits, formatEnNumber } from './enDigits';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale'; // Arabic locale for date-fns

// Replace harsh sounds with gentle water-drop sounds (with safe fallback)
const CREATE_SOUND_URLS = [
  "https://actions.google.com/sounds/v1/impacts/water_droplet.ogg",
  "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
];
const TRIGGER_SOUND_URLS = [
  "https://actions.google.com/sounds/v1/water/water_drop.ogg",
  "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
];

export default function AlertsSystem({ onNotificationAdd }) {
    const { language, t } = useTheme();
    const [alerts, setAlerts] = React.useState([]);
    const [assets, setAssets] = React.useState([]);
    const [user, setUser] = React.useState(null);
    const [userLoading, setUserLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [showAllAlerts, setShowAllAlerts] = React.useState(false);
    const [newAlert, setNewAlert] = React.useState({
        asset_id: "",
        targetPrice: "",
        alertType: "crossesAbove"
    });
    const [pairSuggestions, setPairSuggestions] = React.useState([]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [selectedAsset, setSelectedAsset] = React.useState(null);
    const [acknowledgedAlerts, setAcknowledgedAlerts] = React.useState(new Set());


    const [currentPrice, setCurrentPrice] = React.useState(null);
    const [priceUpdateTime, setPriceUpdateTime] = React.useState(null);
    const [priceError, setPriceError] = React.useState(null);

    const debounceRef = React.useRef(null);

    // ✅ FIXED: Single-flight guards and caching
    const didRunOnce = useRef(false);
    const inFlight = useRef(false);

    const createSoundRef = React.useRef(null);
    const triggerSoundRef = React.useRef(null);
    const playedTriggeredRef = React.useRef(new Set());

    React.useEffect(() => {
        // Load gentle sounds with fallback
        const createA = new Audio(CREATE_SOUND_URLS[0]);
        createA.volume = 0.18;
        createA.onerror = () => {
          const alt = new Audio(CREATE_SOUND_URLS[1]);
          alt.volume = 0.18;
          createSoundRef.current = alt;
        };
        createSoundRef.current = createA;

        const triggerA = new Audio(TRIGGER_SOUND_URLS[0]);
        triggerA.volume = 0.22;
        triggerA.onerror = () => {
          const alt = new Audio(TRIGGER_SOUND_URLS[1]);
          alt.volume = 0.22;
          triggerSoundRef.current = alt;
        };
        triggerSoundRef.current = triggerA;
    }, []);

    const sleep = useCallback((ms) => new Promise(r => setTimeout(r, ms)), []);

    const withBackoff = useCallback(async (fn) => {
        let lastErr;
        for (let i = 0; i < 3; i++) {
            try {
                return await fn();
            } catch (e) {
                lastErr = e;
                console.warn(`[ALERTS] Retry ${i + 1}/3 failed:`, e.message);
                if (e?.response?.status === 429 || e?.status === 429) {
                    await sleep(1000 * (i + 1));
                } else if (e?.response?.status >= 500 || e?.status >= 500) {
                    await sleep(500 * (i + 1));
                } else {
                    break;
                }
            }
        }
        throw lastErr;
    }, [sleep]);

    // Helper: stable sort newest first and dedupe by id
    const sortAlerts = React.useCallback((arr) => {
        const list = Array.isArray(arr) ? arr : [];
        const seen = new Set();
        const deduped = [];
        for (const a of list) {
            if (!a || !a.id) continue;
            if (seen.has(a.id)) continue;
            seen.add(a.id);
            deduped.push(a);
        }
        deduped.sort((a, b) => {
            const ad = new Date(a.triggered_at || a.created_date || a.updated_date || 0).getTime();
            const bd = new Date(b.triggered_at || b.created_date || b.updated_date || 0).getTime();
            return bd - ad; // newest first
        });
        return deduped;
    }, []);

    // Replace your assets loading snippet with a safer version
    const safeLoadAssets = React.useCallback(async () => {
        try {
            console.log('[ALERTS] 🔍 Loading assets (active + public only)...');
            const list = await Asset.filter({ isActive: true, public_access: true });
            console.log('[ALERTS] ✅ Assets loaded:', list?.length || 0);
            setAssets(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error('[ALERTS] ❌ Assets loading failed:', err?.message || err);
            setAssets([]);
        }
    }, [setAssets]);

    const loadData = React.useCallback(async () => {
        if (inFlight.current) return;
        inFlight.current = true;

        let me = null;

        try {
            setUserLoading(true);

            try {
                me = await User.me();
                if (me?.id) {
                    setUser(me);
                } else {
                    setUser(null);
                }
            } catch (base44Error) {
                console.warn('[ALERTS] ⚠️ Base44 auth failed:', base44Error.message);
                me = null;
                setUser(null);
            } finally {
                setUserLoading(false);
            }

            await safeLoadAssets();

            if (me?.id) {
                try {
                    console.log('[ALERTS] 🔍 Loading alerts for user:', me.id);
                    const userAlerts = await Alert.filter({ user_id: me.id });

                    // Merge with existing to avoid disappearance after navigation/refresh
                    setAlerts(prev => {
                        const prevArr = Array.isArray(prev) ? prev : [];
                        const fetched = Array.isArray(userAlerts) ? userAlerts : [];
                        return sortAlerts([...prevArr, ...fetched]);
                    });
                } catch (alertsError) {
                    console.error('[ALERTS] ❌ Alerts loading failed:', alertsError?.message || alertsError);
                    // Do NOT clear alerts on error — keep current state
                    if (onNotificationAdd) { // This call should remain here as it's for initial data loading, not specific to `handleCreateAlert`
                        onNotificationAdd({
                            id: Date.now(),
                            type: 'warning',
                            message: (t?.alertsLoadFailed) || 'Failed to load alerts. Please try again later.',
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            } else {
                console.log('[ALERTS] ⚠️ No authenticated user; keeping current alerts state');
                // Do NOT clear alerts here — prevents flicker when auth is still resolving
            }

        } catch (error) {
            console.error('[ALERTS] ❌ Critical error in loadData:', error);
            // Do NOT clear alerts; preserve current list to avoid disappearance
            setUser(null);
            setUserLoading(false);
            if (onNotificationAdd) { // This call should remain here as it's for initial data loading
                onNotificationAdd({
                    id: Date.now(),
                    type: 'error',
                    message: language === 'ar' ? 'خطأ في تحميل البيانات.' : 'Error loading data.',
                    timestamp: new Date().toISOString()
                });
            }
        } finally {
            inFlight.current = false;
        }
    }, [
        safeLoadAssets,
        onNotificationAdd,
        t,
        setUserLoading,
        setUser,
        setAlerts,
        language,
        sortAlerts
    ]);

    useEffect(() => {
        // ✅ FIXED: Run-once guard against Strict Mode double invokes
        if (didRunOnce.current) return;
        didRunOnce.current = true;

        loadData();

        const handleAuthChange = () => {
            console.log('[ALERTS] 🔄 Auth changed, reloading data');
            loadData();
        };

        const handleAlertsUpdated = () => { // NEW event handler
            console.log('[ALERTS] 🔄 Alerts updated event received, reloading data');
            loadData();
        };

        const handleAlertsAcknowledged = () => {
            setAlerts(prev => {
                const triggeredIds = new Set(prev.filter(a => !a.isActive && a.triggered_at).map(a => a.id));
                setAcknowledgedAlerts(current => new Set([...current, ...triggeredIds]));
                return prev;
            });
        };

        window.addEventListener('auth-changed', handleAuthChange);
        window.addEventListener('alerts-updated', handleAlertsUpdated); // NEW event listener
        window.addEventListener('alerts-acknowledged', handleAlertsAcknowledged);
        return () => {
            window.removeEventListener('auth-changed', handleAuthChange);
            window.removeEventListener('alerts-updated', handleAlertsUpdated); // NEW cleanup
            window.removeEventListener('alerts-acknowledged', handleAlertsAcknowledged);
        };
    }, [loadData]);

    const fetchCurrentPrice = useCallback(async (symbol) => { // Changed assetId to symbol
        if (!symbol) {
            setCurrentPrice(null);
            setPriceUpdateTime(null);
            setPriceError(null);
            return;
        }

        try {
            console.log(`💰 Fetching real-time price for: ${symbol}`);
            setPriceError(null);
            setCurrentPrice('Loading...');

            const response = await getRealTimePrice({
                symbol: symbol,
                language: language
            });

            if (response.data && response.data.success && response.data.price) {
                const price = parseFloat(response.data.price);
                if (!isNaN(price) && price > 0) {
                    setCurrentPrice(toEnDigits(price.toFixed(4)));
                    setPriceUpdateTime(new Date().toLocaleTimeString());
                    console.log(`✅ Price fetched: ${symbol} = ${price}`);
                } else {
                    console.warn('❌ Invalid price value:', response.data.price);
                    setPriceError('Invalid price data');
                    setCurrentPrice(null);
                }
            } else {
                console.warn('❌ Price fetch failed:', response.data?.error);
                setPriceError('Price not available');
                setCurrentPrice(null);
            }
        } catch (error) {
            console.error('💥 Price fetch error:', error);
            setPriceError('Failed to fetch price');
            setCurrentPrice(null);
        }
    }, [language, setCurrentPrice, setPriceUpdateTime, setPriceError]);

    const handlePairInput = React.useCallback((value) => {
        setNewAlert(prev => ({ ...prev, asset_id: value }));
        const q = (value || '').trim();
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!q || q.length < 2) {
            setPairSuggestions([]);
            setShowSuggestions(false);
            setSelectedAsset(null);
            setCurrentPrice(null);
            setPriceUpdateTime(null);
            setPriceError(null);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                const { data } = await searchSymbols({ query: q });
                const results = (data && data.results) ? data.results : [];
                setPairSuggestions(results.slice(0, 10));
                setShowSuggestions(true);
            } catch (e) {
                console.warn('[ALERTS] Symbol search failed:', e?.message || e);
                setPairSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
    }, [setNewAlert]);

    const selectPair = React.useCallback((item) => {
        const symbol = item?.symbol || item?.code || '';
        if (!symbol) return;
        setNewAlert(prev => ({ ...prev, asset_id: symbol }));
        setSelectedAsset({ id: symbol, symbol, name: item?.name, exchange: item?.exchange });
        setShowSuggestions(false);
        fetchCurrentPrice(symbol);
    }, [fetchCurrentPrice, setNewAlert, setSelectedAsset, setShowSuggestions]);

    const handleCreateAlert = React.useCallback(async (e) => {
        e.preventDefault();
        const me = await User.me().catch(() => null);
        if (!me?.id || !me?.email) {
            window.dispatchEvent(new CustomEvent('show-login-modal'));
            return;
        }
        if (!selectedAsset?.symbol || !newAlert.targetPrice || isNaN(parseFloat(newAlert.targetPrice))) {
            // Don't use onNotificationAdd - let the bell handle it
            return;
        }

        const symbol = selectedAsset.symbol;

        try {
            console.log('[ALERTS] 📝 Creating alert for user:', me.id);

            const alertData = {
                user_id: me.id,
                user_email: me.email,
                asset_id: symbol,
                symbol: symbol,
                targetPrice: parseFloat(newAlert.targetPrice),
                alertType: newAlert.alertType,
                isActive: true
            };

            const createdAlert = await Alert.create(alertData);
            console.log('[ALERTS] ✅ Alert created successfully:', createdAlert.id);

            // Play create sound
            try { createSoundRef.current?.play?.(); } catch (err) { console.error("Error playing create sound:", err); }

            // Update alerts list
            setAlerts(prev => sortAlerts([...(Array.isArray(prev) ? prev : []), createdAlert]));

            // Create notification in database for bell system
            await Notification.create({
                user_id: me.id,
                user_email: me.email,
                alert_id: createdAlert.id,
                title: t?.alertSet || 'Alert Set',
                message: `Alert created for ${symbol} at ${newAlert.targetPrice}`,
                notification_type: 'price_alert',
                is_read: false
            });

            // Trigger bell notification update
            window.dispatchEvent(new Event('notifications-updated'));
            
            // Trigger alerts list update
            setTimeout(() => {
                window.dispatchEvent(new Event('alerts-updated'));
            }, 1200);

            // Reset form
            setNewAlert({ asset_id: "", targetPrice: "", alertType: "crossesAbove" });
            setSelectedAsset(null);
            setCurrentPrice(null);
            setPriceUpdateTime(null);
            setPriceError(null);
            setShowForm(false);

        } catch (error) {
            console.error('[ALERTS] ❌ Error creating alert:', error);
            
            // Only show error via bell system
            await Notification.create({
                user_id: me.id,
                user_email: me.email,
                title: t?.alertCreateFailed || 'Alert Creation Failed',
                message: t?.alertCreateFailed || 'Failed to create alert. Please try again.',
                notification_type: 'system',
                is_read: false
            });
            window.dispatchEvent(new Event('notifications-updated'));
        }
    }, [newAlert.targetPrice, newAlert.alertType, selectedAsset, t, setAlerts, setNewAlert, setSelectedAsset, setCurrentPrice, setPriceUpdateTime, setPriceError, setShowForm, sortAlerts]);

    const deleteAlert = React.useCallback(async (alertId) => {
        if (!user?.id) return;
        try {
            console.log('[ALERTS] 🗑️ Attempting to delete alert:', alertId);

            await Alert.delete(alertId);

            console.log('[ALERTS] ✅ Alert deleted successfully:', alertId);

            setAlerts(prevAlerts => {
                const currentAlerts = Array.isArray(prevAlerts) ? prevAlerts : [];
                return currentAlerts.filter(alert => alert.id !== alertId);
            });
            // Also remove from acknowledged list if it was there
            setAcknowledgedAlerts(prev => {
                const newSet = new Set(prev);
                newSet.delete(alertId);
                return newSet;
            });


            window.dispatchEvent(new Event('alerts-updated'));

            if (onNotificationAdd) {
                onNotificationAdd({
                    id: Date.now(),
                    type: 'alert_deleted_success',
                    message: t?.alertDeleted || 'Alert deleted successfully.',
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('[ALERTS] ❌ Error deleting alert:', {
                message: error.message,
                status: error.response?.status || error.status,
                response: error.response?.data
            });

            if (error.message?.includes('Object not found') ||
                error.message?.includes('ObjectNotFoundError') ||
                error.response?.status === 404) {

                console.log('[ALERTS] 🔄 Alert not found on backend, removing from UI state');

                setAlerts(prevAlerts => {
                    const currentAlerts = Array.isArray(prevAlerts) ? prevAlerts : [];
                    return currentAlerts.filter(alert => alert.id !== alertId);
                });
                setAcknowledgedAlerts(prev => { // Remove from acknowledged list as well
                    const newSet = new Set(prev);
                    newSet.delete(alertId);
                    return newSet;
                });

                window.dispatchEvent(new Event('alerts-updated'));

                if (onNotificationAdd) {
                    onNotificationAdd({
                        id: Date.now(),
                        type: 'info',
                        message: t?.alertRemovedNotFound || 'Alert removed (not found on server).',
                        timestamp: new Date().toISOString()
                    });
                }

            } else {
                const errorMessage = t?.alertDeleteFailed || 'Failed to delete alert. Please try again.';

                if (onNotificationAdd) {
                    onNotificationAdd({
                        id: Date.now(),
                        type: 'error',
                        message: errorMessage,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    alert(errorMessage);
                }
            }
        }
    }, [user?.id, onNotificationAdd, setAlerts, t, setAcknowledgedAlerts]);

    const toggleAlert = React.useCallback(async (alertId, currentActive) => {
        if (!user?.id || !user?.email) return;
        try {
            console.log('🔄 Toggling alert:', alertId, 'from', currentActive, 'to', !currentActive);

            // ✅ FIX: Include user_email for RLS write policy
            const payload = { 
                isActive: !currentActive, 
                user_id: user.id,
                user_email: user.email // ✅ FIX: Use user.email correctly
            };

            // If reactivating, clear triggered_at
            if (!currentActive) {
                payload.triggered_at = null;
            }


            await Alert.update(alertId, payload);

            console.log('✅ Alert toggled successfully');

            setAlerts(prevAlerts => {
                const currentAlerts = Array.isArray(prevAlerts) ? prevAlerts : [];
                const updated = currentAlerts.map(alert =>
                    alert.id === alertId
                        ? { ...alert, ...payload }
                        : alert
                );
                return sortAlerts(updated);
            });

            // If deactivating or reactivating, remove from acknowledged list
            setAcknowledgedAlerts(prev => {
                const newSet = new Set(prev);
                newSet.delete(alertId);
                return newSet;
            });


            window.dispatchEvent(new Event('alerts-updated'));

            if (onNotificationAdd) {
                onNotificationAdd({
                    id: Date.now(),
                    type: 'alert_toggled_success',
                    message: t?.alertStatusUpdated || 'Alert status updated successfully.',
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error("❌ Error toggling alert:", error);

            if (error.message?.includes('Object not found') ||
                error.message?.includes('ObjectNotFoundError') ||
                error.response?.status === 404) {

                console.log('🔄 Alert not found on backend, removing from UI state');

                setAlerts(prevAlerts => {
                    const currentAlerts = Array.isArray(prevAlerts) ? prevAlerts : [];
                    return currentAlerts.filter(alert => alert.id !== alertId);
                });
                setAcknowledgedAlerts(prev => { // Remove from acknowledged list as well
                    const newSet = new Set(prev);
                    newSet.delete(alertId);
                    return newSet;
                });

                window.dispatchEvent(new Event('alerts-updated'));

                if (onNotificationAdd) {
                    onNotificationAdd({
                        id: Date.now(),
                        type: 'error',
                        message: t?.alertNotFoundRemoved || 'Alert not found and removed from list.',
                        timestamp: new Date().toISOString()
                    });
                }

            } else {
                const errorMessage = t?.alertUpdateFailed || 'Failed to update alert. Please try again.';

                if (onNotificationAdd) {
                    onNotificationAdd({
                        id: Date.now(),
                        type: 'error',
                        message: errorMessage,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    alert(errorMessage);
                }
            }
        }
    }, [user?.id, user?.email, onNotificationAdd, setAlerts, t, sortAlerts, setAcknowledgedAlerts]);

    const getAssetName = React.useCallback((assetId, alert) => {
        // Prefer event title if this is an event alert
        if (alert?.event_id && alert?.metadata?.event_title) {
            return alert.metadata.event_title;
        }
        if (!assetId) return '...';
        // If it's already a symbol (e.g., EURUSD.FOREX / BTC-USD.CC), show it directly
        // This heuristic assumes such symbols contain a dot or are long enough (e.g., 6 chars for "TSLA")
        if (/[.-]/.test(assetId) || assetId.length >= 6) return assetId;
        const arr = Array.isArray(assets) ? assets : [];
        // Fallback to searching in the locally loaded Asset list (if asset_id is a database ID)
        return arr.find(a => a.id === assetId)?.symbol || assetId; // Default to assetId itself if nothing found
    }, [assets]);

    const describeAlert = React.useCallback((alert) => {
        const ar = language === 'ar';
        // Prefer event alerts wording if event_id exists
        if (alert?.event_id) {
            if (alert.alertType === 'onRelease') {
                return ar ? 'عند صدور النتيجة' : 'On Release';
            }
            if (alert.alertType === 'beforeRelease' || alert.alertType === 'before') {
                const mins = alert.leadTimeMinutes ?? 0;
                return ar ? `قبل ${mins} دقيقة` : `${mins} min before`;
            }
             // For official results, always 'On Release'
            if (alert.alertType === 'OfficialResults') {
                return ar ? 'عند صدور النتائج الرسمية' : 'On Official Results';
            }
        }
        if (alert.alertType === 'crossesAbove') {
            return ar ? 'اختراق صعودي' : 'Crosses Above';
        }
        if (alert.alertType === 'crossesBelow') {
            return ar ? 'اختراق هبوطي' : 'Crosses Below';
        }
        return ar ? 'تنبيه' : 'Alert';
    }, [language]);

    // Replace direct array fallback with a memoized version to keep a stable reference
    const safeAlerts = React.useMemo(() => (Array.isArray(alerts) ? alerts : []), [alerts]);
    
    // Separate active and triggered alerts
    const { activeAlerts, triggeredAlerts } = React.useMemo(() => {
        const active = [];
        const triggered = [];
        safeAlerts.forEach(alert => {
            if (alert.isActive) {
                active.push(alert);
            } else if (alert.triggered_at) {
                triggered.push(alert);
            }
        });
        return { activeAlerts: sortAlerts(active), triggeredAlerts: sortAlerts(triggered) };
    }, [safeAlerts, sortAlerts]);

    const displayedActiveAlerts = showAllAlerts ? activeAlerts : activeAlerts.slice(0, 5);

    const [editingAlert, setEditingAlert] = React.useState(null);
    const [editForm, setEditForm] = React.useState({ type: "price", alertType: "crossesAbove", targetPrice: "", leadTimeMinutes: 0 });

    const openEditAlert = React.useCallback((alert) => {
        if (!alert) return;
        const isEvent = !!alert.event_id;
        setEditingAlert(alert);
        setEditForm({
            type: isEvent ? "event" : "price",
            alertType: alert.alertType || (isEvent ? "onRelease" : "crossesAbove"),
            targetPrice: typeof alert.targetPrice === 'number' ? String(alert.targetPrice) : "",
            leadTimeMinutes: typeof alert.leadTimeMinutes === 'number' ? alert.leadTimeMinutes : 0
        });
    }, []);

    const submitEditAlert = React.useCallback(async (e) => {
        e.preventDefault();
        if (!editingAlert || !user?.id || !user?.email) return;

        const isEvent = !!editingAlert.event_id;
        const payload = {
            user_id: user.id,
            user_email: user.email, // Ensure email is passed for RLS
            alertType: editForm.alertType,
        };
        if (isEvent) {
            payload.leadTimeMinutes = Number(editForm.leadTimeMinutes || 0);
        } else {
            if (!editForm.targetPrice || isNaN(parseFloat(editForm.targetPrice))) {
                onNotificationAdd && onNotificationAdd({
                    id: Date.now(),
                    type: 'error',
                    message: t?.missingAlertData || 'Please enter a valid target price.',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            payload.targetPrice = parseFloat(editForm.targetPrice);
        }

        const id = editingAlert.id;
        try {
            await Alert.update(id, payload);

            setAlerts(prev => {
                const arr = Array.isArray(prev) ? prev : [];
                return arr.map(a => a.id === id ? { ...a, ...payload } : a);
            });

            window.dispatchEvent(new Event('alerts-updated'));
            onNotificationAdd && onNotificationAdd({
                id: Date.now(),
                type: 'alert_updated_success',
                message: t?.alertSaved || 'Alert updated successfully!',
                timestamp: new Date().toISOString()
            });

            setEditingAlert(null);
        } catch (err) {
            console.error('Edit alert error:', err);
            onNotificationAdd && onNotificationAdd({
                id: Date.now(),
                type: 'error',
                message: t?.alertUpdateFailed || 'Failed to update alert. Please try again.',
                timestamp: new Date().toISOString()
            });
        }
    }, [editingAlert, editForm, user?.id, user?.email, onNotificationAdd, t, setAlerts]);

    const actionsRenderer = React.useCallback((alert) => {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={() => openEditAlert(alert)}
                    className="neumorphic-button p-3 rounded-xl transition-colors text-primary hover:opacity-90"
                    title={t?.edit || (language === 'ar' ? 'تعديل' : 'Edit')}
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={() => toggleAlert(alert.id, alert.isActive)}
                    className={`neumorphic-button p-3 rounded-xl transition-colors ${
                        alert.isActive
                            ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                            : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                    title={alert.isActive ? (t?.deactivateAlert || (language === 'ar' ? 'إيقاف التنبيه' : 'Deactivate Alert')) : (t?.activateAlert || (language === 'ar' ? 'تفعيل التنبيه' : 'Activate Alert'))}
                >
                    {alert.isActive ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => deleteAlert(alert.id)}
                    className="neumorphic-button p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    title={t?.deleteAlert || (language === 'ar' ? 'حذف التنبيه' : 'Delete Alert')}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        );
    }, [openEditAlert, toggleAlert, deleteAlert, t, language]);

    // Detect newly triggered alerts and play a sound once per alert id
    React.useEffect(() => {
        const triggeredIds = new Set((Array.isArray(alerts) ? alerts : []).filter(a => !a.isActive && a.triggered_at).map(a => a.id));
        for (const id of triggeredIds) {
            if (!playedTriggeredRef.current.has(id)) {
                try { triggerSoundRef.current?.play?.(); } catch (err) { console.error("Error playing trigger sound:", err); }
                playedTriggeredRef.current.add(id);
            }
        }
    }, [alerts]);

    return (
        <div className="px-4 py-8 bg-light-bg dark:bg-dark-bg" id="alerts-system-card">
            {/* Enhanced Smart Alerts pulse animation (center, non-intrusive) */}
            <div className="flex justify-center mb-4">
                <div className="relative">
                    {/* outer soft glow rings */}
                    <div className="absolute inset-0 rounded-full bg-emerald-400/15 animate-ping" />
                    <div className="absolute -inset-1 rounded-full bg-emerald-400/10 blur-xl" />
                    {/* main badge */}
                    <div className="relative px-4 py-1.5 rounded-full border border-emerald-300/60 bg-white/60 dark:bg-white/10 backdrop-blur text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        {t?.smartAlertsBadge || (language === 'ar' ? 'نظام التنبيهات الذكي' : 'Smart Alerts')}
                    </div>
                    {/* subtle inner ripple */}
                    <div className="absolute inset-0 rounded-full border border-emerald-300/40 animate-[ping_2.2s_ease-out_infinite] opacity-60" />
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="neumorphic p-8 rounded-3xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-3xl font-bold mb-2 service-title relative">
                                <span className="absolute inset-0 bg-white/30 dark:bg-white/10 blur-lg rounded-lg -z-10"></span>
                                {t?.alertsTitle || 'Price Alerts'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">{t?.alertsDescription || 'Set up price alerts for your favorite assets'}</p>
                        </div>
                        <button
                            onClick={() => {
                                if(!user) {
                                    window.dispatchEvent(new CustomEvent('show-login-modal'));
                                    return;
                                }
                                setShowForm(!showForm);
                                if (!showForm) {
                                    setNewAlert({ asset_id: "", targetPrice: "", alertType: "crossesAbove" });
                                    setSelectedAsset(null);
                                    setCurrentPrice(null);
                                    setPriceUpdateTime(null);
                                    setPriceError(null);
                                }
                            }}
                            className="neumorphic-button px-6 py-3 flex items-center gap-2 font-semibold rounded-xl transition-all hover:scale-105"
                            style={{ color: 'var(--light-accent)' }}
                        >
                            <Plus className="w-5 h-5" />
                            {t?.addAlert || 'Add Alert'}
                        </button>
                    </div>

                    {userLoading && (
                        <div className="text-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: '#7cb342', borderTopColor: 'transparent' }}></div>
                            <p className="text-secondary">Loading...</p>
                        </div>
                    )}

                    {!userLoading && !user && (
                        <div className="text-center py-12">
                            <Bell className="w-16 h-16 mx-auto mb-4 opacity-50 text-secondary" />
                            <h4 className="text-xl font-semibold text-primary mb-2">Create Account for Alerts</h4>
                            <p className="text-secondary mb-6">Sign up to create and manage personalized price alerts</p>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('show-login-modal'))}
                                className="neumorphic-button px-6 py-3 text-white font-semibold rounded-xl"
                                style={{ backgroundColor: '#7cb342' }}
                            >
                                Get Started
                            </button>
                        </div>
                    )}

                    {!userLoading && user && (
                        <>
                            {showForm && (
                                <div className="neumorphic-pressed p-6 mb-8 rounded-2xl">
                                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t?.addAlert || 'Add Alert'}</h4>
                                    <form onSubmit={handleCreateAlert} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="relative">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t?.currencyPair || 'Currency Pair'}</label>
                                                <input
                                                    type="text"
                                                    value={selectedAsset ? selectedAsset.symbol : newAlert.asset_id}
                                                    onChange={(e) => handlePairInput(e.target.value)}
                                                    onFocus={() => { if (newAlert.asset_id && pairSuggestions.length > 0) setShowSuggestions(true); }}
                                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                    placeholder={t?.searchPairs || 'Search pairs...'}
                                                    className="w-full neumorphic-pressed p-3 rounded-xl outline-none text-gray-800 dark:text-gray-200 bg-transparent"
                                                    required
                                                />
                                                {showSuggestions && Array.isArray(pairSuggestions) && pairSuggestions.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 z-10 neumorphic mt-1 rounded-xl max-h-48 overflow-y-auto">
                                                        {pairSuggestions.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                onClick={() => selectPair(item)}
                                                                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200 first:rounded-t-xl last:rounded-b-xl"
                                                            >
                                                                <div className="font-medium">{item.symbol}</div>
                                                                <div className="text-xs text-gray-500">
                                                                  {item.name} {item.exchange ? `• ${item.exchange}` : ''}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                  {t?.alertType || 'Alert Type'}
                                                </label>
                                                <select
                                                  value={newAlert.alertType}
                                                  onChange={(e) => setNewAlert({ ...newAlert, alertType: e.target.value })}
                                                  className="w-full neumorphic-pressed p-3 rounded-xl outline-none text-gray-800 dark:text-gray-200 bg-transparent"
                                                >
                                                  <option value="crossesAbove">{t?.crosses_above || 'Crosses Above'}</option>
                                                  <option value="crossesBelow">{t?.crosses_below || 'Crosses Below'}</option>
                                                </select>
                                            </div>
                                        </div>

                                        {selectedAsset && (
                                            <div className="neumorphic-inset p-4 rounded-xl">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t?.currentPrice || 'Current Price'}:</span>
                                                    <div className="flex items-center gap-2">
                                                        {currentPrice === 'Loading...' && (
                                                            <div className="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full" style={{ borderColor: '#7cb342', borderTopColor: 'transparent' }}></div>
                                                        )}
                                                        {currentPrice && currentPrice !== 'Loading...' && (
                                                            <span
                                                                className="font-bold text-lg"
                                                                lang="en"
                                                                dir="ltr"
                                                                style={{ fontVariantNumeric: 'tabular-nums', color: '#7cb342' }}
                                                            >
                                                                {currentPrice}
                                                            </span>
                                                        )}
                                                        {!currentPrice && currentPrice !== 'Loading...' && selectedAsset.latestPrice && (
                                                            <span
                                                                className="font-bold text-lg"
                                                                lang="en"
                                                                dir="ltr"
                                                                style={{ fontVariantNumeric: 'tabular-nums', color: '#7cb342' }}
                                                            >
                                                                {toEnDigits(selectedAsset.latestPrice?.toFixed(4) || 'N/A')}
                                                            </span>
                                                        )}
                                                        {priceError && (
                                                            <span className="text-red-500 text-sm">{priceError}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {priceUpdateTime && (
                                                    <div className="flex justify-end">
                                                        <span
                                                            className="text-xs text-gray-500"
                                                            lang="en"
                                                            dir="ltr"
                                                            style={{ fontVariantNumeric: 'tabular-nums' }}
                                                        >
                                                            {t?.lastUpdate || 'Last update'}: {toEnDigits(priceUpdateTime)}
                                                        </span>
                                                    </div>
                                                )}
                                                {!currentPrice && !selectedAsset?.latestPrice && !priceError && currentPrice !== 'Loading...' && (
                                                     <div className="flex justify-end">
                                                        <span className="text-xs text-gray-500">
                                                            {t?.loadingCurrentPrice || 'Loading current price...'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t?.targetPrice || 'Target Price'}</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="number"
                                                    step="0.0001"
                                                    value={newAlert.targetPrice}
                                                    onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                                                    placeholder={
                                                        currentPrice && currentPrice !== 'Loading...' ?
                                                        `${t?.current || 'Current'}: ${currentPrice}` :
                                                        selectedAsset?.latestPrice ?
                                                        `${t?.current || 'Current'}: ${toEnDigits(selectedAsset.latestPrice.toFixed(4))}` :
                                                        "1.0800"
                                                    }
                                                    className="w-full neumorphic-pressed p-3 pl-10 rounded-xl outline-none text-gray-800 dark:text-gray-200 bg-transparent"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                className="neumorphic-button px-6 py-3 font-semibold rounded-xl transition-all hover:scale-105"
                                                style={{ backgroundColor: '#7cb342', color: 'white' }}
                                            >
                                                {t?.save || 'Save'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowForm(false);
                                                    setNewAlert({ asset_id: "", targetPrice: "", alertType: "crossesAbove" });
                                                    setSelectedAsset(null);
                                                    setCurrentPrice(null);
                                                    setPriceUpdateTime(null);
                                                    setPriceError(null);
                                                }}
                                                className="neumorphic-button px-6 py-3 text-gray-600 dark:text-gray-400 font-semibold rounded-xl"
                                            >
                                                {t?.cancel || 'Cancel'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Active Alerts Section */}
                            <div className="space-y-4 mb-8">
                                <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                    {t?.activeAlerts || 'Active Alerts'}
                                    <span
                                        className="ml-2"
                                        lang="en"
                                        dir="ltr"
                                        style={{ fontVariantNumeric: 'tabular-nums' }}
                                    >
                                        ({toEnDigits(activeAlerts.length)})
                                    </span>
                                </h4>
                                {activeAlerts.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>{t?.noActiveAlerts || 'No active alerts. Create one to get started!'}</p>
                                    </div>
                                ) : (
                                    <>
                                        {displayedActiveAlerts.map(alert => (
                                            <div key={alert.id} className="neumorphic-pressed p-4 rounded-2xl flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl ${
                                                        alert.alertType === 'crossesAbove'
                                                            ? 'bg-green-100 dark:bg-green-900/20'
                                                            : alert.alertType === 'crossesBelow'
                                                                ? 'bg-red-100 dark:bg-red-900/20'
                                                                : 'bg-blue-100 dark:bg-blue-900/20'
                                                    }`}>
                                                        {alert.alertType === 'crossesAbove' ? (
                                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                                        ) : alert.alertType === 'crossesBelow' ? (
                                                            <TrendingDown className="w-5 h-5 text-red-600" />
                                                        ) : (
                                                            <Bell className="w-5 h-5 text-blue-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                            {getAssetName(alert.asset_id, alert)}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {describeAlert(alert)}
                                                            {typeof alert.targetPrice === 'number' && (alert.alertType === 'crossesAbove' || alert.alertType === 'crossesBelow') && (
                                                                <span
                                                                    className="ml-1"
                                                                    lang="en"
                                                                    dir="ltr"
                                                                    style={{ fontVariantNumeric: 'tabular-nums' }}
                                                                >
                                                                    {toEnDigits(alert.targetPrice)}
                                                                </span>
                                                            )}
                                                        </p>
                                                        {alert.isActive ? (
                                                            <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg">
                                                                {t?.active || (language === 'ar' ? 'نشط' : 'Active')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-lg">
                                                                {t?.inactive || (language === 'ar' ? 'غير نشط' : 'Inactive')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {actionsRenderer(alert)}
                                            </div>
                                        ))}

                                        {activeAlerts.length > 5 && (
                                            <div className="text-center">
                                                <button
                                                    onClick={() => setShowAllAlerts(!showAllAlerts)}
                                                    className="neumorphic-button px-4 py-2 flex items-center gap-2 mx-auto rounded-xl"
                                                    style={{ color: '#7cb342' }}
                                                >
                                                    {showAllAlerts ? (
                                                        <><ChevronUp className="w-4 h-4" />{t?.showLess || 'Show Less'}</>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4" />
                                                            {t?.showMore || 'Show More'}
                                                            <span
                                                                lang="en"
                                                                dir="ltr"
                                                                style={{ fontVariantNumeric: 'tabular-nums' }}
                                                            >
                                                                ({toEnDigits(activeAlerts.length - 5)})
                                                            </span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            
                            {/* Triggered Alerts Section */}
                            {triggeredAlerts.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                        <History className="w-5 h-5 text-gray-500" />
                                        {t?.triggeredAlerts || 'Triggered Alerts'}
                                    </h4>
                                    {triggeredAlerts.map(alert => (
                                        <div 
                                            key={alert.id} 
                                            className={`neumorphic-pressed p-4 rounded-2xl flex items-center justify-between transition-opacity duration-500 ${acknowledgedAlerts.has(alert.id) ? 'opacity-40' : 'opacity-100'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                                                    <CheckCircle2 className="w-5 h-5 text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200 line-through">
                                                        {getAssetName(alert.asset_id, alert)}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {describeAlert(alert)}
                                                        {typeof alert.targetPrice === 'number' && (
                                                            <span className="ml-1" lang="en" dir="ltr" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                                {toEnDigits(alert.targetPrice)}
                                                            </span>
                                                        )}
                                                    </p>
                                                    {alert.triggered_at && (
                                                        <span className="text-xs text-gray-500" lang="en" dir="ltr" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                            {t?.triggered || 'Triggered'} {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true, locale: language === 'ar' ? ar : undefined })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* No actions for triggered alerts, they are history */}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Edit Alert Modal */}
            {editingAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setEditingAlert(null)} />
                    <div className="relative z-10 neumorphic p-6 rounded-2xl w-[95vw] max-w-md">
                        <h4 className="text-lg font-semibold mb-4 text-primary">
                            {language === 'ar' ? 'تعديل التنبيه' : 'Edit Alert'}
                        </h4>
                        <form onSubmit={submitEditAlert} className="space-y-4">
                            {/* Alert Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-primary">{t?.alertType || 'Alert Type'}</label>
                                <select
                                    value={editForm.alertType}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, alertType: e.target.value }))}
                                    className="w-full neumorphic-pressed p-3 rounded-xl outline-none bg-transparent"
                                >
                                    {editForm.type === 'price' ? (
                                        <>
                                            <option value="crossesAbove">{t?.crosses_above || 'Crosses Above'}</option>
                                            <option value="crossesBelow">{t?.crosses_below || 'Crosses Below'}</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="onRelease">{language === 'ar' ? 'عند الصدور' : 'On Release'}</option>
                                            <option value="beforeRelease">{language === 'ar' ? 'قبل الصدور' : 'Before Release'}</option>
                                            <option value="OfficialResults">{language === 'ar' ? 'النتائج الرسمية' : 'Official Results'}</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* Price Target or Lead Time */}
                            {editForm.type === 'price' ? (
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-primary">{t?.targetPrice || 'Target Price'}</label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={editForm.targetPrice}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, targetPrice: e.target.value }))}
                                        placeholder="0.00"
                                        className="w-full neumorphic-pressed p-3 rounded-xl outline-none bg-transparent"
                                        required
                                    />
                                </div>
                            ) : (
                                // For event alerts, only show lead time if not 'OfficialResults'
                                editForm.alertType !== 'OfficialResults' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-primary">{t?.minutesBefore || 'Minutes Before'}</label>
                                        <input
                                            type="number"
                                            step="1"
                                            value={editForm.leadTimeMinutes}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, leadTimeMinutes: Number(e.target.value || 0) }))}
                                            className="w-full neumorphic-pressed p-3 rounded-xl outline-none bg-transparent"
                                            min={0}
                                        />
                                    </div>
                                )
                            )}

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setEditingAlert(null)}
                                    className="neumorphic-button px-5 py-3 rounded-xl"
                                >
                                    {t?.cancel || (language === 'ar' ? 'إلغاء' : 'Cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="neumorphic-button px-5 py-3 rounded-xl text-white"
                                    style={{ backgroundColor: '#7cb342' }}
                                >
                                    {t?.save || (language === 'ar' ? 'حفظ' : 'Save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
