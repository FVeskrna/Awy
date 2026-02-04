import React, { useState } from 'react';
import { User, Lock, Mail, Save, LogOut, Check, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../services/authContext';
import { authService } from '../services/authService';

export const AccountSettings: React.FC = () => {
    const { user, signOutUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    // Profile State
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

    // Security State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            await authService.updateProfile({ displayName });
            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 3000);
            // Reload effectively to refresh context for now, or we could update context manually
            // Use window.location.reload() for full refresh to be safe with session sync
            setTimeout(() => window.location.reload(), 500);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords don't match");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            return;
        }

        setIsSavingPassword(true);
        setPasswordError('');
        try {
            await authService.updateProfile({ password: newPassword });
            setPasswordSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (e: any) {
            setPasswordError(e.message);
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 animate-in fade-in zoom-in duration-300">
            <div className="workspace-card w-full max-w-4xl bg-white rounded-3xl border border-workspace-border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]">

                {/* Sidebar */}
                <div className="w-full md:w-64 bg-workspace-sidebar border-r border-workspace-border p-6 flex flex-col gap-2">
                    <div className="mb-8 pl-2">
                        <h2 className="text-xl font-black uppercase tracking-tight text-workspace-text">Settings</h2>
                        <p className="text-[10px] font-bold text-workspace-secondary uppercase tracking-widest mt-1">
                            Account Management
                        </p>
                    </div>

                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'profile' ? 'bg-workspace-selection text-workspace-accent' : 'text-workspace-secondary hover:text-workspace-text hover:bg-workspace-selection/50'}`}
                    >
                        <User size={16} /> Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'security' ? 'bg-workspace-selection text-workspace-accent' : 'text-workspace-secondary hover:text-workspace-text hover:bg-workspace-selection/50'}`}
                    >
                        <Lock size={16} /> Security
                    </button>

                    <div className="mt-auto">
                        <button
                            onClick={signOutUser}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-workspace-canvas">
                    {activeTab === 'profile' && (
                        <div className="max-w-lg mx-auto animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-workspace-accent to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-500/20">
                                    {user?.displayName?.charAt(0).toUpperCase() || <User />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-workspace-text">{user?.displayName || 'User'}</h3>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100 mt-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Session
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest pl-1">Display Name</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-workspace-secondary" />
                                        <input
                                            value={displayName}
                                            onChange={e => setDisplayName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-workspace-border rounded-xl text-sm font-bold text-workspace-text focus:border-workspace-accent focus:ring-4 focus:ring-workspace-accent/10 outline-none transition-all"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 opacity-60">
                                    <label className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest pl-1">Email Address</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-workspace-secondary" />
                                        <input
                                            value={user?.email || ''}
                                            readOnly
                                            className="w-full pl-10 pr-4 py-3 bg-workspace-sidebar border border-transparent rounded-xl text-sm font-bold text-workspace-text cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-[10px] text-workspace-secondary pl-1">Email cannot be changed directly.</p>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSavingProfile}
                                        className="w-full py-4 bg-workspace-text text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSavingProfile ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            profileSuccess ? <Check size={16} /> : <Save size={16} />
                                        )}
                                        {profileSuccess ? 'Saved Successfully' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="max-w-lg mx-auto animate-in slide-in-from-right-4 duration-300">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-workspace-text mb-2">Security Settings</h3>
                                <p className="text-sm text-workspace-secondary">Update your password to keep your account secure.</p>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                {passwordError && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-3 border border-red-100">
                                        <AlertCircle size={16} /> {passwordError}
                                    </div>
                                )}
                                {passwordSuccess && (
                                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-3 border border-emerald-100">
                                        <Check size={16} /> Password updated successfully
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest pl-1">New Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-workspace-secondary" />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-workspace-border rounded-xl text-sm font-bold text-workspace-text focus:border-workspace-accent focus:ring-4 focus:ring-workspace-accent/10 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-workspace-secondary uppercase tracking-widest pl-1">Confirm Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-workspace-secondary" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-workspace-border rounded-xl text-sm font-bold text-workspace-text focus:border-workspace-accent focus:ring-4 focus:ring-workspace-accent/10 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSavingPassword || !newPassword}
                                        className="w-full py-4 bg-workspace-accent text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-workspace-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {isSavingPassword ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Lock size={16} />
                                        )}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
