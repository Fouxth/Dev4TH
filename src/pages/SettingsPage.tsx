import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { User, Bell, Shield, Save, Loader2, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import type { User as UserType } from '@/types';
import { type NotificationPrefs } from '@/hooks/useNotifications';

interface SystemSetting {
    id?: string;
    name: string;
    tagline: string;
    addr: string;
    phone: string;
    email: string;
    website: string;
    bank: string;
    accNum: string;
    accName: string;
    validity: number;
    dueDays: number;
    terms: string;
    lineId?: string;
    lineQrUrl?: string;
    serviceArea?: string;
    responseSla?: string;
    updatedAt?: string;
}

interface SettingsPageProps {
    currentUser: UserType;
    lang: 'th' | 'en';
    onLangChange: (l: 'th' | 'en') => void;
    onUserUpdate: (data: Partial<UserType>) => Promise<void>;
    notifPrefs: NotificationPrefs;
    onNotifPrefsChange: (prefs: NotificationPrefs) => void;
}

export function SettingsPage({ currentUser, lang, onLangChange: _onLangChange, onUserUpdate, notifPrefs, onNotifPrefsChange }: SettingsPageProps) {
    const { logout } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('profile');

    const TABS = [
        { id: 'profile', label: t.settings.tabs.profile, icon: User },
        { id: 'notifications', label: t.settings.tabs.notifications, icon: Bell },
        { id: 'security', label: t.settings.tabs.security, icon: Shield },
        ...((currentUser.role === 'admin' || currentUser.role === 'manager') ? [
            { id: 'quotation', label: t.settings.tabs.quotation, icon: FileText }
        ] : []),
    ];

    // Profile form state
    const [name, setName] = useState(currentUser.name);
    const [email, setEmail] = useState(currentUser.email);
    const [department] = useState(currentUser.department || '');
    const [status, setStatus] = useState(currentUser.status);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await onUserUpdate({ name, email, department, status });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            setPwMessage({ type: 'error', text: t.settings.security.tooShort });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwMessage({ type: 'error', text: t.settings.security.mismatch });
            return;
        }
        setPwSaving(true);
        setPwMessage(null);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/profile/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setPwMessage({ type: 'success', text: t.settings.security.success });
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            } else {
                setPwMessage({ type: 'error', text: data.error || t.settings.security.error });
            }
        } catch {
            setPwMessage({ type: 'error', text: t.settings.security.connectionError });
        } finally {
            setPwSaving(false);
        }
    };

    // Quotation/document settings state
    const [docSettings, setDocSettings] = useState<SystemSetting | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsError, setSettingsError] = useState('');
    const [settingsSaved, setSettingsSaved] = useState(false);

    useEffect(() => {
        if (activeTab === 'quotation' && !docSettings) {
            const fetchDocSettings = async () => {
                setLoadingSettings(true);
                setSettingsError('');
                try {
                    const token = localStorage.getItem('auth_token');
                    const res = await fetch('/api/system-settings', {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'โหลดการตั้งค่าเอกสารไม่สำเร็จ');
                    setDocSettings(data);
                } catch (err: any) {
                    setSettingsError(err.message);
                } finally {
                    setLoadingSettings(false);
                }
            };
            fetchDocSettings();
        }
    }, [activeTab, docSettings]);

    const handleSaveDocSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!docSettings) return;
        setSavingSettings(true);
        setSettingsError('');
        setSettingsSaved(false);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/system-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(docSettings),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'ไม่สามารถบันทึกการตั้งค่าได้');
            setDocSettings(data);
            setSettingsSaved(true);
            setTimeout(() => setSettingsSaved(false), 2500);
        } catch (err: any) {
            setSettingsError(err.message);
        } finally {
            setSavingSettings(false);
        }
    };

    const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35] transition-colors";
    const labelCls = "block text-sm font-medium text-gray-300 mb-1.5";

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="space-y-6">
                        {/* Avatar */}
                        <div className="flex items-center gap-4 p-4 bg-white/3 rounded-xl border border-white/5">
                            <img
                                src={currentUser.avatar}
                                alt={currentUser.name}
                                className="w-16 h-16 rounded-xl object-cover bg-white/10"
                                onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=ff6b35&color=fff&size=128`; }}
                            />
                            <div>
                                <div className="text-white font-semibold">{currentUser.name}</div>
                                <div className="text-gray-400 text-sm capitalize">{currentUser.role}</div>
                                <div className="text-xs text-gray-500 mt-1">{currentUser.email}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>{t.settings.profile.name}</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>{t.settings.profile.email}</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>{t.settings.profile.department}</label>
                                <input type="text" value={department} readOnly className={`${inputCls} opacity-50 cursor-not-allowed`} />
                            </div>
                            <div>
                                <label className={labelCls}>{t.settings.profile.status}</label>
                                <select value={status} onChange={e => setStatus(e.target.value as UserType['status'])} className={inputCls}>
                                    <option value="online">🟢 Online</option>
                                    <option value="busy">🔴 Busy</option>
                                    <option value="away">🟡 Away</option>
                                    <option value="offline">⚫ Offline</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="flex items-center gap-2 bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-white font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.settings.profile.saving}</> :
                                saved ? <><CheckCircle2 className="w-4 h-4" /> {t.settings.profile.saved}</> :
                                    <><Save className="w-4 h-4" /> {t.settings.profile.save}</>}
                        </button>
                    </div>
                );


            case 'notifications':
                return (
                    <div className="space-y-4">
                        <p className="text-gray-400 text-sm">{t.settings.notificationSettings.settingsSubtitle}</p>
                        {([
                            { key: 'taskAssigned' as keyof NotificationPrefs, label: t.settings.notificationSettings.taskAssigned, desc: t.settings.notificationSettings.taskAssignedDesc },
                            { key: 'taskDue'      as keyof NotificationPrefs, label: t.settings.notificationSettings.taskDue,      desc: t.settings.notificationSettings.taskDueDesc },
                            { key: 'mention'      as keyof NotificationPrefs, label: t.settings.notificationSettings.mention,      desc: t.settings.notificationSettings.mentionDesc },
                            { key: 'projectUpdate'as keyof NotificationPrefs, label: t.settings.notificationSettings.projectUpdate,desc: t.settings.notificationSettings.projectUpdateDesc },
                            { key: 'weeklyReport' as keyof NotificationPrefs, label: t.settings.notificationSettings.weeklyReport, desc: t.settings.notificationSettings.weeklyReportDesc },
                        ] as const).map(n => (
                            <div key={n.key} className="flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-xl">
                                <div>
                                    <div className="text-sm font-medium text-white">{n.label}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{n.desc}</div>
                                </div>
                                <button
                                    onClick={() => {
                                        const updated = { ...notifPrefs, [n.key]: !notifPrefs[n.key] };
                                        onNotifPrefsChange(updated);
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        notifPrefs[n.key] ? 'bg-[#ff6b35]' : 'bg-white/10'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                        notifPrefs[n.key] ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>
                        ))}
                        <p className="text-xs text-gray-500 pt-2">
                            {lang === 'th' ? '✓ การตั้งค่าจะถูกบันทึกทันทีและมีผลในทันที' : '✓ Settings are saved instantly and take effect immediately'}
                        </p>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-white font-medium mb-1">{t.settings.security.changePassword}</h3>
                            <p className="text-gray-400 text-sm mb-4">{t.settings.security.changePasswordDesc}</p>
                            <div className="space-y-3">
                                <div>
                                    <label className={labelCls}>{t.settings.security.currentPassword}</label>
                                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className={labelCls}>{t.settings.security.newPassword}</label>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls} placeholder={t.settings.security.minChars} />
                                </div>
                                <div>
                                    <label className={labelCls}>{t.settings.security.confirmPassword}</label>
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputCls} placeholder={t.settings.security.confirmPlaceholder} />
                                </div>
                                {pwMessage && (
                                    <div className={`text-sm p-3 rounded-lg ${pwMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        {pwMessage.text}
                                    </div>
                                )}
                                <button
                                    onClick={handleChangePassword}
                                    disabled={pwSaving || !currentPassword || !newPassword}
                                    className="flex items-center gap-2 bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-white font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {pwSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.settings.security.changing}</> : <><Shield className="w-4 h-4" /> {t.settings.security.change}</>}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-white/5 pt-6">
                            <div className="p-4 bg-white/3 border border-white/5 rounded-xl mb-4">
                                <div className="text-sm font-medium text-white mb-3">{t.settings.security.activeSessions}</div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                    <div className="text-sm text-gray-300">{t.settings.security.currentBrowser}</div>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-medium px-6 py-3 rounded-xl transition-all"
                            >
                                {t.settings.security.logoutAll}
                            </button>
                        </div>
                    </div>
                );

            case 'quotation':
                const isTh = lang === 'th';
                if (loadingSettings) {
                    return (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35] mb-2" />
                            <span>{isTh ? 'กำลังโหลดการตั้งค่าเอกสาร...' : 'Loading document settings...'}</span>
                        </div>
                    );
                }
                if (settingsError) {
                    return (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-semibold">{isTh ? 'เกิดข้อผิดพลาดในการโหลดข้อมูล' : 'Error loading settings'}</div>
                                <div className="text-sm opacity-90 mt-1">{settingsError}</div>
                                <button
                                    type="button"
                                    onClick={() => setDocSettings(null)}
                                    className="mt-3 text-xs bg-red-500/20 border border-red-500/30 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors"
                                >
                                    {isTh ? 'ลองใหม่อีกครั้ง' : 'Try Again'}
                                </button>
                            </div>
                        </div>
                    );
                }
                if (!docSettings) return null;

                return (
                    <form onSubmit={handleSaveDocSettings} className="space-y-6">
                        <div>
                            <h3 className="text-white font-medium mb-1">
                                {isTh ? 'ตั้งค่าข้อมูลเอกสารการเงิน' : 'Financial Document Settings'}
                            </h3>
                            <p className="text-gray-400 text-xs mb-4">
                                {isTh ? 'ตั้งค่าโปรไฟล์บริษัท ข้อมูลที่อยู่ติดต่อ และช่องทางรับชำระเงินสำหรับใบเสนอราคาและใบแจ้งหนี้'
                                      : 'Configure company profile, contact address, and payment options for quotations and invoices.'}
                            </p>
                        </div>

                        {/* Section 1: Company Profile */}
                        <div className="space-y-4">
                            <h4 className="text-white text-sm font-semibold border-l-2 border-[#ff6b35] pl-2 py-0.5">
                                {isTh ? 'ข้อมูลทั่วไปของบริษัท' : 'Company Information'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className={labelCls}>{isTh ? 'ชื่อบริษัท / ชื่อผู้ออกเอกสาร' : 'Company Name / Issuer'}</label>
                                    <input
                                        type="text"
                                        value={docSettings.name}
                                        onChange={e => setDocSettings({ ...docSettings, name: e.target.value })}
                                        className={inputCls}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>{isTh ? 'สโลแกนบริษัท / คำโปรย' : 'Company Tagline'}</label>
                                    <input
                                        type="text"
                                        value={docSettings.tagline}
                                        onChange={e => setDocSettings({ ...docSettings, tagline: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>{isTh ? 'ที่อยู่บริษัท' : 'Company Address'}</label>
                                    <textarea
                                        rows={3}
                                        value={docSettings.addr}
                                        onChange={e => setDocSettings({ ...docSettings, addr: e.target.value })}
                                        className={`${inputCls} resize-none`}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>{isTh ? 'เบอร์โทรศัพท์ติดต่อ' : 'Contact Phone'}</label>
                                    <input
                                        type="text"
                                        value={docSettings.phone}
                                        onChange={e => setDocSettings({ ...docSettings, phone: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>{isTh ? 'อีเมลติดต่อ' : 'Contact Email'}</label>
                                    <input
                                        type="email"
                                        value={docSettings.email}
                                        onChange={e => setDocSettings({ ...docSettings, email: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>{isTh ? 'เว็บไซต์บริษัท' : 'Company Website'}</label>
                                    <input
                                        type="text"
                                        value={docSettings.website}
                                        onChange={e => setDocSettings({ ...docSettings, website: e.target.value })}
                                        className={inputCls}
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>{isTh ? 'LINE OA ID' : 'LINE OA ID'}</label>
                                    <input
                                        type="text"
                                        value={docSettings.lineId || ''}
                                        onChange={e => setDocSettings({ ...docSettings, lineId: e.target.value })}
                                        className={inputCls}
                                        placeholder="@482zdyfi"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>{isTh ? 'ลิงก์รูปภาพ LINE QR Code' : 'LINE QR Code URL'}</label>
                                    <input
                                        type="text"
                                        value={docSettings.lineQrUrl || ''}
                                        onChange={e => setDocSettings({ ...docSettings, lineQrUrl: e.target.value })}
                                        className={inputCls}
                                        placeholder="https://example.com/qr.png"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>{isTh ? 'พื้นที่ให้บริการ (Service Area)' : 'Service Area'}</label>
                                    <input
                                        type="text"
                                        value={docSettings.serviceArea || ''}
                                        onChange={e => setDocSettings({ ...docSettings, serviceArea: e.target.value })}
                                        className={inputCls}
                                        placeholder="Remote — ทั่วประเทศไทย"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>{isTh ? 'เวลาตอบกลับ (Response SLA)' : 'Response SLA'}</label>
                                    <input
                                        type="text"
                                        value={docSettings.responseSla || ''}
                                        onChange={e => setDocSettings({ ...docSettings, responseSla: e.target.value })}
                                        className={inputCls}
                                        placeholder="ภายใน 24 ชม."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Payment and Configuration */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h4 className="text-white text-sm font-semibold border-l-2 border-[#ff6b35] pl-2 py-0.5">
                                {isTh ? 'ข้อมูลธุรกรรมและการชำระเงิน' : 'Payment & Document Configurations'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelCls}>{isTh ? 'ธนาคารรับชำระเงิน' : 'Receiving Bank Name'}</label>
                                    <input
                                        type="text"
                                        value={docSettings.bank}
                                        onChange={e => setDocSettings({ ...docSettings, bank: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>{isTh ? 'เลขที่บัญชีธนาคาร' : 'Bank Account Number'}</label>
                                    <input
                                        type="text"
                                        value={docSettings.accNum}
                                        onChange={e => setDocSettings({ ...docSettings, accNum: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>{isTh ? 'ชื่อบัญชีธนาคาร' : 'Bank Account Name'}</label>
                                    <input
                                        type="text"
                                        value={docSettings.accName}
                                        onChange={e => setDocSettings({ ...docSettings, accName: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>{isTh ? 'ยืนยันราคาภายใน (วัน)' : 'Validity Period (Days)'}</label>
                                    <input
                                        type="number"
                                        value={docSettings.validity}
                                        onChange={e => setDocSettings({ ...docSettings, validity: parseInt(e.target.value) || 30 })}
                                        className={inputCls}
                                        min={1}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>{isTh ? 'ระยะเวลาดิวชำระเงิน (วัน)' : 'Payment Terms (Days)'}</label>
                                    <input
                                        type="number"
                                        value={docSettings.dueDays}
                                        onChange={e => setDocSettings({ ...docSettings, dueDays: parseInt(e.target.value) || 30 })}
                                        className={inputCls}
                                        min={0}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Terms & Conditions */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h4 className="text-white text-sm font-semibold border-l-2 border-[#ff6b35] pl-2 py-0.5">
                                {isTh ? 'ข้อตกลงและเงื่อนไขเริ่มต้น' : 'Default Terms & Conditions'}
                            </h4>
                            <div>
                                <textarea
                                    rows={4}
                                    value={docSettings.terms}
                                    onChange={e => setDocSettings({ ...docSettings, terms: e.target.value })}
                                    className={`${inputCls} resize-none`}
                                />
                            </div>
                        </div>

                        {settingsError && (
                            <div className="text-sm p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                                {settingsError}
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/5 flex justify-end">
                            <button
                                type="submit"
                                disabled={savingSettings}
                                className="flex items-center gap-2 bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-white font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                {savingSettings ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {isTh ? 'กำลังบันทึก...' : 'Saving...'}
                                    </>
                                ) : settingsSaved ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        {isTh ? 'บันทึกสำเร็จ!' : 'Saved!'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {isTh ? 'บันทึกการตั้งค่า' : 'Save Settings'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">⚙️ {t.settings.title}</h2>
                <p className="text-gray-400 text-sm">{t.settings.subtitle}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar tabs */}
                <div className="md:w-48 md:shrink-0 w-full flex md:flex-col flex-row flex-wrap gap-1">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-[rgba(255,107,53,0.15)] text-[#ff6b35]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-white/5 w-full">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                        >
                            <Shield className="w-4 h-4" />
                            {t.settings.logout}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-[#111] border border-white/5 rounded-xl p-6 min-h-[400px]">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
