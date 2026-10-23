import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { captainLogin as apiCaptainLogin, getDeadlineStatus } from '../services/api';

export type UserRole = 'SPECTATOR' | 'CAPTAIN' | 'REFEREE' | 'ADMIN';

export interface RoleContextType {
    role: UserRole;
    captainTeamKey: string | null;
    captainTeamName: string | null;
    captainName: string | null;
    userEmail: string | null;
    token: string | null;
    isRoleModalOpen: boolean;
    deadline: string;
    isPastDeadline: boolean;
    deadlineRemaining: string;
    openRoleModal: () => void;
    closeRoleModal: () => void;
    loginAsSpectator: () => void;
    loginAsCaptain: (teamKey: string, pin: string) => Promise<void>;
    setAuthSession: (token: string, role: UserRole, extra?: { email?: string; teamKey?: string; teamName?: string; captainName?: string }) => void;
    logout: () => void;
    canEditTeam: (teamKeyOrId?: string | number) => boolean;
    canAccessRefereeConsole: () => boolean;
    canAccessAdmin: () => boolean;
}

const DEFAULT_DEADLINE = '2026-10-28T18:30:00+02:00';

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initial role state from localStorage or default to SPECTATOR
    const [role, setRole] = useState<UserRole>(() => {
        const storedRole = localStorage.getItem('user_role') as UserRole | null;
        if (storedRole && ['SPECTATOR', 'CAPTAIN', 'REFEREE', 'ADMIN'].includes(storedRole)) {
            return storedRole;
        }
        return 'SPECTATOR';
    });

    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('user_email'));
    const [captainTeamKey, setCaptainTeamKey] = useState<string | null>(() => localStorage.getItem('captain_team_key'));
    const [captainTeamName, setCaptainTeamName] = useState<string | null>(() => localStorage.getItem('captain_team_name'));
    const [captainName, setCaptainName] = useState<string | null>(() => localStorage.getItem('captain_name'));

    // Modal state: show on first visit if no role was ever chosen in localStorage
    const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(() => {
        const hasChosenBefore = localStorage.getItem('role_chosen_once');
        return !hasChosenBefore;
    });

    // Deadline tracking
    const [deadline, setDeadline] = useState<string>(DEFAULT_DEADLINE);
    const [isPastDeadline, setIsPastDeadline] = useState<boolean>(false);
    const [deadlineRemaining, setDeadlineRemaining] = useState<string>('');

    // Fetch deadline from server
    useEffect(() => {
        getDeadlineStatus()
            .then(data => {
                if (data?.deadline) setDeadline(data.deadline);
            })
            .catch(() => {});
    }, []);

    // Live countdown timer for the 28 Oct 18:30 deadline
    useEffect(() => {
        const updateCountdown = () => {
            const targetTime = new Date(deadline).getTime();
            const now = Date.now();
            const diff = targetTime - now;

            if (diff <= 0) {
                setIsPastDeadline(true);
                setDeadlineRemaining('Locked (Deadline passed)');
            } else {
                setIsPastDeadline(false);
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                if (days > 0) {
                    setDeadlineRemaining(`${days}d ${hours}h ${minutes}m`);
                } else if (hours > 0) {
                    setDeadlineRemaining(`${hours}h ${minutes}m ${seconds}s`);
                } else {
                    setDeadlineRemaining(`${minutes}m ${seconds}s`);
                }
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    const openRoleModal = () => setIsRoleModalOpen(true);
    const closeRoleModal = () => setIsRoleModalOpen(false);

    // 1. Participant / Spectator login (No credentials required!)
    const loginAsSpectator = () => {
        setRole('SPECTATOR');
        localStorage.setItem('user_role', 'SPECTATOR');
        localStorage.setItem('role_chosen_once', 'true');
        // Clear captain credentials
        setCaptainTeamKey(null);
        setCaptainTeamName(null);
        setCaptainName(null);
        localStorage.removeItem('captain_team_key');
        localStorage.removeItem('captain_team_name');
        localStorage.removeItem('captain_name');
        closeRoleModal();
    };

    // 2. Captain PIN login
    const loginAsCaptain = async (teamKey: string, pin: string) => {
        const result = await apiCaptainLogin(teamKey, pin);
        const { token, user } = result;

        setToken(token);
        setRole('CAPTAIN');
        setCaptainTeamKey(user.teamKey);
        setCaptainTeamName(user.teamName);
        setCaptainName(user.captainName);

        localStorage.setItem('token', token);
        localStorage.setItem('user_role', 'CAPTAIN');
        localStorage.setItem('role', 'CAPTAIN');
        localStorage.setItem('captain_team_key', user.teamKey);
        localStorage.setItem('captain_team_name', user.teamName);
        localStorage.setItem('captain_name', user.captainName);
        localStorage.setItem('role_chosen_once', 'true');

        closeRoleModal();
    };

    // 3. Generic Auth Session (Admin, Referee, Cashier)
    const setAuthSession = useCallback((
        newToken: string,
        newRole: UserRole,
        extra?: { email?: string; teamKey?: string; teamName?: string; captainName?: string }
    ) => {
        setToken(newToken);
        setRole(newRole);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user_role', newRole);
        localStorage.setItem('role', newRole);
        localStorage.setItem('role_chosen_once', 'true');

        if (extra?.email) {
            setUserEmail(extra.email);
            localStorage.setItem('user_email', extra.email);
        }
        if (extra?.teamKey) {
            setCaptainTeamKey(extra.teamKey);
            localStorage.setItem('captain_team_key', extra.teamKey);
        }
        if (extra?.teamName) {
            setCaptainTeamName(extra.teamName);
            localStorage.setItem('captain_team_name', extra.teamName);
        }
        if (extra?.captainName) {
            setCaptainName(extra.captainName);
            localStorage.setItem('captain_name', extra.captainName);
        }

        closeRoleModal();
    }, []);

    // 4. Logout / Switch to Spectator
    const logout = () => {
        setToken(null);
        setRole('SPECTATOR');
        setUserEmail(null);
        setCaptainTeamKey(null);
        setCaptainTeamName(null);
        setCaptainName(null);

        localStorage.removeItem('token');
        localStorage.setItem('user_role', 'SPECTATOR');
        localStorage.removeItem('role');
        localStorage.removeItem('user_email');
        localStorage.removeItem('captain_team_key');
        localStorage.removeItem('captain_team_name');
        localStorage.removeItem('captain_name');
    };

    // Permission check for editing squads/teams
    const canEditTeam = (teamKeyOrId?: string | number): boolean => {
        // Admin can edit everything anytime, even after deadline
        if (role === 'ADMIN') return true;

        // Spectator or Referee cannot edit squads
        if (role === 'SPECTATOR' || role === 'REFEREE') return false;

        // Captain check: only their team, and only before deadline (28 Oct 18:30)
        if (role === 'CAPTAIN') {
            if (isPastDeadline) return false;
            if (!teamKeyOrId) return true; // generic check

            const target = String(teamKeyOrId).toLowerCase().trim();
            const currentCaptainKey = (captainTeamKey || '').toLowerCase().trim();
            const currentCaptainName = (captainTeamName || '').toLowerCase().trim();

            return target === currentCaptainKey || target === currentCaptainName || currentCaptainKey.includes(target);
        }

        return false;
    };

    const canAccessRefereeConsole = () => role === 'REFEREE' || role === 'ADMIN';
    const canAccessAdmin = () => role === 'ADMIN';

    return (
        <RoleContext.Provider
            value={{
                role,
                captainTeamKey,
                captainTeamName,
                captainName,
                userEmail,
                token,
                isRoleModalOpen,
                deadline,
                isPastDeadline,
                deadlineRemaining,
                openRoleModal,
                closeRoleModal,
                loginAsSpectator,
                loginAsCaptain,
                setAuthSession,
                logout,
                canEditTeam,
                canAccessRefereeConsole,
                canAccessAdmin,
            }}
        >
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
};
