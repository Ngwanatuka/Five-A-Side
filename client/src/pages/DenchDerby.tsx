import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { 
    Trophy, 
    Calendar, 
    Clock, 
    Shield, 
    Medal, 
    Flame, 
    Play, 
    RotateCcw, 
    Sparkles, 
    Info, 
    Users, 
    Award, 
    Share2, 
    Sliders,
    Plus,
    UserPlus,
    X,
    Trash2,
    CheckCircle2
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

export type TeamInfo = {
    id: string;
    name: string;
    group: 'A' | 'B';
    color: string;
    secondaryColor: string;
    city: string;
    slogan: string;
    founded: string;
    captain: string;
};

export type TournamentPlayer = {
    id: string;
    teamKey: string;
    name: string;
    jerseyNumber: number;
    position: 'GK' | 'DEF' | 'MID' | 'FWD';
    isCaptain?: boolean;
};

export type GoalEvent = {
    id: string;
    matchId: string;
    teamKey: string;
    scorerPlayerId: string;
    assistPlayerId?: string | null;
    minute: number;
};

export type TournamentMatch = {
    id: string;
    stage: 'group' | 'semi' | 'final' | 'third_place';
    group?: 'A' | 'B';
    matchOrder: number;
    homeTeamKey: string | null;
    awayTeamKey: string | null;
    homePlaceholder: string;
    awayPlaceholder: string;
    time: string;
    pitch: number;
    homeScore: number | null;
    awayScore: number | null;
    status: 'scheduled' | 'live' | 'completed';
    note?: string;
};

export type GroupStanding = {
    teamKey: string;
    name: string;
    color: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
};

export const DEFAULT_TEAMS: Record<string, TeamInfo> = {
    'team-dench': {
        id: 'team-dench',
        name: 'Team Dench',
        group: 'A',
        color: '#12b84c',
        secondaryColor: '#0ea141',
        city: 'Dench Grounds',
        slogan: 'Relentless Pace, Pure Passion',
        founded: '2023',
        captain: 'Marcus "Dench" K.'
    },
    'cpt-superstars': {
        id: 'cpt-superstars',
        name: 'CPT superstars fc',
        group: 'A',
        color: '#3b82f6',
        secondaryColor: '#1d4ed8',
        city: 'Cape Town',
        slogan: 'Mother City Maestros',
        founded: '2022',
        captain: 'Chad "Speedy" P.'
    },
    'bras-ba-kasi': {
        id: 'bras-ba-kasi',
        name: 'Bras ba kasi',
        group: 'A',
        color: '#f59e0b',
        secondaryColor: '#d97706',
        city: 'Kasi Local',
        slogan: 'Flavour, Flair & Brotherhood',
        founded: '2021',
        captain: 'Thabo "Jiki" M.'
    },
    'gauteng-warriors': {
        id: 'gauteng-warriors',
        name: 'Gauteng state warriors',
        group: 'B',
        color: '#8b5cf6',
        secondaryColor: '#6d28d9',
        city: 'Gauteng',
        slogan: 'The Golden Province Titans',
        founded: '2022',
        captain: 'Kagiso "Iron" N.'
    },
    'woza-madzala': {
        id: 'woza-madzala',
        name: 'Woza madzala fc',
        group: 'B',
        color: '#ef4444',
        secondaryColor: '#b91c1c',
        city: 'Ekurhuleni',
        slogan: 'Wisdom, Power & Tactical Fire',
        founded: '2020',
        captain: 'Sipho "Madzala" Z.'
    },
    'areyeng-fc': {
        id: 'areyeng-fc',
        name: 'Areyeng fc',
        group: 'B',
        color: '#06b6d4',
        secondaryColor: '#0891b2',
        city: 'Tshwane',
        slogan: 'Forward Together, Never Back',
        founded: '2024',
        captain: 'Lerato "Skilo" D.'
    }
};

export const TEAMS = DEFAULT_TEAMS;

const INITIAL_PLAYERS: TournamentPlayer[] = [
    // Team Dench
    { id: 'p-dench-1', teamKey: 'team-dench', name: 'Marcus "Dench" K.', jerseyNumber: 9, position: 'FWD', isCaptain: true },
    { id: 'p-dench-2', teamKey: 'team-dench', name: 'Tshepo Moremi', jerseyNumber: 7, position: 'MID' },
    { id: 'p-dench-3', teamKey: 'team-dench', name: 'David Ndlovu', jerseyNumber: 4, position: 'DEF' },
    { id: 'p-dench-4', teamKey: 'team-dench', name: 'Kabelo Mokoena', jerseyNumber: 1, position: 'GK' },
    { id: 'p-dench-5', teamKey: 'team-dench', name: 'Brian Sithole', jerseyNumber: 10, position: 'FWD' },

    // CPT superstars fc
    { id: 'p-cpt-1', teamKey: 'cpt-superstars', name: 'Chad "Speedy" P.', jerseyNumber: 10, position: 'FWD', isCaptain: true },
    { id: 'p-cpt-2', teamKey: 'cpt-superstars', name: 'Jerome Abrahams', jerseyNumber: 8, position: 'MID' },
    { id: 'p-cpt-3', teamKey: 'cpt-superstars', name: 'Luke Hendricks', jerseyNumber: 3, position: 'DEF' },
    { id: 'p-cpt-4', teamKey: 'cpt-superstars', name: 'Moegamat Adams', jerseyNumber: 1, position: 'GK' },
    { id: 'p-cpt-5', teamKey: 'cpt-superstars', name: 'Keanu Daniels', jerseyNumber: 11, position: 'MID' },

    // Bras ba kasi
    { id: 'p-bras-1', teamKey: 'bras-ba-kasi', name: 'Thabo "Jiki" M.', jerseyNumber: 10, position: 'MID', isCaptain: true },
    { id: 'p-bras-2', teamKey: 'bras-ba-kasi', name: 'Bongani "Shoelace" Zulu', jerseyNumber: 9, position: 'FWD' },
    { id: 'p-bras-3', teamKey: 'bras-ba-kasi', name: 'Sbusiso Khumalo', jerseyNumber: 5, position: 'DEF' },
    { id: 'p-bras-4', teamKey: 'bras-ba-kasi', name: 'Vusi "Cat" Radebe', jerseyNumber: 1, position: 'GK' },
    { id: 'p-bras-5', teamKey: 'bras-ba-kasi', name: 'Mandla Nkosi', jerseyNumber: 7, position: 'FWD' },

    // Gauteng state warriors
    { id: 'p-gaut-1', teamKey: 'gauteng-warriors', name: 'Kagiso "Iron" N.', jerseyNumber: 4, position: 'DEF', isCaptain: true },
    { id: 'p-gaut-2', teamKey: 'gauteng-warriors', name: 'Tumi Mashaba', jerseyNumber: 9, position: 'FWD' },
    { id: 'p-gaut-3', teamKey: 'gauteng-warriors', name: 'Nhlanhla Dlamini', jerseyNumber: 8, position: 'MID' },
    { id: 'p-gaut-4', teamKey: 'gauteng-warriors', name: 'Itumeleng Phiri', jerseyNumber: 1, position: 'GK' },
    { id: 'p-gaut-5', teamKey: 'gauteng-warriors', name: 'Sello Motsepe', jerseyNumber: 11, position: 'FWD' },

    // Woza madzala fc
    { id: 'p-woza-1', teamKey: 'woza-madzala', name: 'Sipho "Madzala" Z.', jerseyNumber: 8, position: 'MID', isCaptain: true },
    { id: 'p-woza-2', teamKey: 'woza-madzala', name: 'Patrick "Bullet" Mabena', jerseyNumber: 9, position: 'FWD' },
    { id: 'p-woza-3', teamKey: 'woza-madzala', name: 'Jabulani Sithole', jerseyNumber: 2, position: 'DEF' },
    { id: 'p-woza-4', teamKey: 'woza-madzala', name: 'Senzo Vilakazi', jerseyNumber: 1, position: 'GK' },
    { id: 'p-woza-5', teamKey: 'woza-madzala', name: 'Doctor Mokoena', jerseyNumber: 10, position: 'MID' },

    // Areyeng fc
    { id: 'p-arey-1', teamKey: 'areyeng-fc', name: 'Lerato "Skilo" D.', jerseyNumber: 7, position: 'MID', isCaptain: true },
    { id: 'p-arey-2', teamKey: 'areyeng-fc', name: 'Tebogo Maleka', jerseyNumber: 9, position: 'FWD' },
    { id: 'p-arey-3', teamKey: 'areyeng-fc', name: 'Koketso Mahlangu', jerseyNumber: 6, position: 'DEF' },
    { id: 'p-arey-4', teamKey: 'areyeng-fc', name: 'Ofentse Baloyi', jerseyNumber: 1, position: 'GK' },
    { id: 'p-arey-5', teamKey: 'areyeng-fc', name: 'Katlego Modise', jerseyNumber: 11, position: 'FWD' }
];

const DEFAULT_MATCHES: TournamentMatch[] = [
    // GROUP A MATCHES
    {
        id: 'ga-m1',
        stage: 'group',
        group: 'A',
        matchOrder: 1,
        homeTeamKey: 'team-dench',
        awayTeamKey: 'cpt-superstars',
        homePlaceholder: 'Team Dench',
        awayPlaceholder: 'CPT superstars fc',
        time: '18:30',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group A Opening Clash'
    },
    {
        id: 'ga-m2',
        stage: 'group',
        group: 'A',
        matchOrder: 3,
        homeTeamKey: 'cpt-superstars',
        awayTeamKey: 'bras-ba-kasi',
        homePlaceholder: 'CPT superstars fc',
        awayPlaceholder: 'Bras ba kasi',
        time: '19:05',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group A Round 2'
    },
    {
        id: 'ga-m3',
        stage: 'group',
        group: 'A',
        matchOrder: 5,
        homeTeamKey: 'bras-ba-kasi',
        awayTeamKey: 'team-dench',
        homePlaceholder: 'Bras ba kasi',
        awayPlaceholder: 'Team Dench',
        time: '19:40',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group A Decider'
    },

    // GROUP B MATCHES
    {
        id: 'gb-m1',
        stage: 'group',
        group: 'B',
        matchOrder: 2,
        homeTeamKey: 'gauteng-warriors',
        awayTeamKey: 'woza-madzala',
        homePlaceholder: 'Gauteng state warriors',
        awayPlaceholder: 'Woza madzala fc',
        time: '18:30',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group B High-Stakes Opener'
    },
    {
        id: 'gb-m2',
        stage: 'group',
        group: 'B',
        matchOrder: 4,
        homeTeamKey: 'woza-madzala',
        awayTeamKey: 'areyeng-fc',
        homePlaceholder: 'Woza madzala fc',
        awayPlaceholder: 'Areyeng fc',
        time: '19:05',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group B Round 2'
    },
    {
        id: 'gb-m3',
        stage: 'group',
        group: 'B',
        matchOrder: 6,
        homeTeamKey: 'areyeng-fc',
        awayTeamKey: 'gauteng-warriors',
        homePlaceholder: 'Areyeng fc',
        awayPlaceholder: 'Gauteng state warriors',
        time: '19:40',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Group B Decider'
    },

    // SEMI-FINALS
    {
        id: 'sf-1',
        stage: 'semi',
        matchOrder: 7,
        homeTeamKey: null,
        awayTeamKey: null,
        homePlaceholder: 'Group A ( 1st spot )',
        awayPlaceholder: 'Group B ( 2nd spot )',
        time: '20:20',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Semi-Final 1'
    },
    {
        id: 'sf-2',
        stage: 'semi',
        matchOrder: 8,
        homeTeamKey: null,
        awayTeamKey: null,
        homePlaceholder: 'Group A ( 2nd spot )',
        awayPlaceholder: 'Group B ( 1st spot )',
        time: '20:20',
        pitch: 2,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Semi-Final 2'
    },

    // FINALS
    {
        id: 'fn-3rd',
        stage: 'third_place',
        matchOrder: 9,
        homeTeamKey: null,
        awayTeamKey: null,
        homePlaceholder: 'First match (Competing for 3rd spot)',
        awayPlaceholder: 'Loser SF 2',
        time: '21:05',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'First match (Competing for 3rd spot)'
    },
    {
        id: 'fn-gold',
        stage: 'final',
        matchOrder: 10,
        homeTeamKey: null,
        awayTeamKey: null,
        homePlaceholder: 'Winner SF 1',
        awayPlaceholder: 'Winner SF 2',
        time: '21:40',
        pitch: 1,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        note: 'Second match ( Final Competing for 1st spot 🥇 )'
    }
];

const SIMULATED_SCORES: Record<string, { home: number; away: number }> = {
    'ga-m1': { home: 4, away: 2 },
    'gb-m1': { home: 3, away: 3 },
    'ga-m2': { home: 3, away: 1 },
    'gb-m2': { home: 2, away: 1 },
    'ga-m3': { home: 2, away: 3 },
    'gb-m3': { home: 1, away: 4 },
    'sf-1': { home: 3, away: 2 },
    'sf-2': { home: 2, away: 4 },
    'fn-3rd': { home: 3, away: 1 },
    'fn-gold': { home: 5, away: 4 }
};

const SIMULATED_GOAL_EVENTS: GoalEvent[] = [
    // ga-m1: Dench 4 - 2 CPT
    { id: 'ev-1', matchId: 'ga-m1', teamKey: 'team-dench', scorerPlayerId: 'p-dench-1', assistPlayerId: 'p-dench-2', minute: 4 },
    { id: 'ev-2', matchId: 'ga-m1', teamKey: 'cpt-superstars', scorerPlayerId: 'p-cpt-1', assistPlayerId: null, minute: 9 },
    { id: 'ev-3', matchId: 'ga-m1', teamKey: 'team-dench', scorerPlayerId: 'p-dench-1', assistPlayerId: 'p-dench-5', minute: 14 },
    { id: 'ev-4', matchId: 'ga-m1', teamKey: 'team-dench', scorerPlayerId: 'p-dench-5', assistPlayerId: 'p-dench-1', minute: 19 },
    { id: 'ev-5', matchId: 'ga-m1', teamKey: 'cpt-superstars', scorerPlayerId: 'p-cpt-2', assistPlayerId: 'p-cpt-1', minute: 23 },
    { id: 'ev-6', matchId: 'ga-m1', teamKey: 'team-dench', scorerPlayerId: 'p-dench-2', assistPlayerId: null, minute: 27 },

    // gb-m1: Gauteng 3 - 3 Woza
    { id: 'ev-7', matchId: 'gb-m1', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-2', assistPlayerId: 'p-gaut-3', minute: 6 },
    { id: 'ev-8', matchId: 'gb-m1', teamKey: 'woza-madzala', scorerPlayerId: 'p-woza-2', assistPlayerId: 'p-woza-1', minute: 11 },
    { id: 'ev-9', matchId: 'gb-m1', teamKey: 'woza-madzala', scorerPlayerId: 'p-woza-1', assistPlayerId: null, minute: 16 },
    { id: 'ev-10', matchId: 'gb-m1', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-5', assistPlayerId: 'p-gaut-2', minute: 21 },
    { id: 'ev-11', matchId: 'gb-m1', teamKey: 'woza-madzala', scorerPlayerId: 'p-woza-2', assistPlayerId: 'p-woza-5', minute: 25 },
    { id: 'ev-12', matchId: 'gb-m1', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-2', assistPlayerId: 'p-gaut-1', minute: 29 },

    // ga-m2: CPT 3 - 1 Bras
    { id: 'ev-13', matchId: 'ga-m2', teamKey: 'cpt-superstars', scorerPlayerId: 'p-cpt-1', assistPlayerId: 'p-cpt-5', minute: 8 },
    { id: 'ev-14', matchId: 'ga-m2', teamKey: 'bras-ba-kasi', scorerPlayerId: 'p-bras-2', assistPlayerId: 'p-bras-1', minute: 15 },
    { id: 'ev-15', matchId: 'ga-m2', teamKey: 'cpt-superstars', scorerPlayerId: 'p-cpt-1', assistPlayerId: 'p-cpt-2', minute: 22 },
    { id: 'ev-16', matchId: 'ga-m2', teamKey: 'cpt-superstars', scorerPlayerId: 'p-cpt-5', assistPlayerId: null, minute: 28 },

    // gb-m2: Woza 2 - 1 Areyeng
    { id: 'ev-17', matchId: 'gb-m2', teamKey: 'woza-madzala', scorerPlayerId: 'p-woza-2', assistPlayerId: 'p-woza-1', minute: 10 },
    { id: 'ev-18', matchId: 'gb-m2', teamKey: 'areyeng-fc', scorerPlayerId: 'p-arey-1', assistPlayerId: 'p-arey-2', minute: 17 },
    { id: 'ev-19', matchId: 'gb-m2', teamKey: 'woza-madzala', scorerPlayerId: 'p-woza-5', assistPlayerId: null, minute: 24 },

    // ga-m3: Bras 2 - 3 Dench
    { id: 'ev-20', matchId: 'ga-m3', teamKey: 'bras-ba-kasi', scorerPlayerId: 'p-bras-1', assistPlayerId: 'p-bras-2', minute: 5 },
    { id: 'ev-21', matchId: 'ga-m3', teamKey: 'team-dench', scorerPlayerId: 'p-dench-1', assistPlayerId: 'p-dench-2', minute: 12 },
    { id: 'ev-22', matchId: 'ga-m3', teamKey: 'bras-ba-kasi', scorerPlayerId: 'p-bras-5', assistPlayerId: 'p-bras-1', minute: 18 },
    { id: 'ev-23', matchId: 'ga-m3', teamKey: 'team-dench', scorerPlayerId: 'p-dench-5', assistPlayerId: 'p-dench-1', minute: 24 },
    { id: 'ev-24', matchId: 'ga-m3', teamKey: 'team-dench', scorerPlayerId: 'p-dench-1', assistPlayerId: null, minute: 29 },

    // gb-m3: Areyeng 1 - 4 Gauteng
    { id: 'ev-25', matchId: 'gb-m3', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-2', assistPlayerId: 'p-gaut-3', minute: 4 },
    { id: 'ev-26', matchId: 'gb-m3', teamKey: 'areyeng-fc', scorerPlayerId: 'p-arey-2', assistPlayerId: 'p-arey-1', minute: 11 },
    { id: 'ev-27', matchId: 'gb-m3', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-5', assistPlayerId: 'p-gaut-2', minute: 16 },
    { id: 'ev-28', matchId: 'gb-m3', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-2', assistPlayerId: null, minute: 22 },
    { id: 'ev-29', matchId: 'gb-m3', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-3', assistPlayerId: 'p-gaut-2', minute: 27 },

    // sf-1: Dench 3 - 2 Woza
    { id: 'ev-30', matchId: 'sf-1', teamKey: 'team-dench', scorerPlayerId: 'p-dench-1', assistPlayerId: 'p-dench-5', minute: 7 },
    { id: 'ev-31', matchId: 'sf-1', teamKey: 'woza-madzala', scorerPlayerId: 'p-woza-2', assistPlayerId: 'p-woza-1', minute: 13 },
    { id: 'ev-32', matchId: 'sf-1', teamKey: 'team-dench', scorerPlayerId: 'p-dench-2', assistPlayerId: 'p-dench-1', minute: 19 },
    { id: 'ev-33', matchId: 'sf-1', teamKey: 'woza-madzala', scorerPlayerId: 'p-woza-1', assistPlayerId: null, minute: 25 },
    { id: 'ev-34', matchId: 'sf-1', teamKey: 'team-dench', scorerPlayerId: 'p-dench-1', assistPlayerId: 'p-dench-2', minute: 29 },

    // sf-2: CPT 2 - 4 Gauteng
    { id: 'ev-35', matchId: 'sf-2', teamKey: 'cpt-superstars', scorerPlayerId: 'p-cpt-1', assistPlayerId: 'p-cpt-2', minute: 6 },
    { id: 'ev-36', matchId: 'sf-2', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-2', assistPlayerId: 'p-gaut-3', minute: 12 },
    { id: 'ev-37', matchId: 'sf-2', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-5', assistPlayerId: 'p-gaut-2', minute: 17 },
    { id: 'ev-38', matchId: 'sf-2', teamKey: 'cpt-superstars', scorerPlayerId: 'p-cpt-2', assistPlayerId: 'p-cpt-1', minute: 21 },
    { id: 'ev-39', matchId: 'sf-2', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-2', assistPlayerId: null, minute: 26 },
    { id: 'ev-40', matchId: 'sf-2', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-3', assistPlayerId: 'p-gaut-2', minute: 30 },

    // fn-3rd: Woza 3 - 1 CPT
    { id: 'ev-41', matchId: 'fn-3rd', teamKey: 'woza-madzala', scorerPlayerId: 'p-woza-2', assistPlayerId: 'p-woza-1', minute: 8 },
    { id: 'ev-42', matchId: 'fn-3rd', teamKey: 'cpt-superstars', scorerPlayerId: 'p-cpt-1', assistPlayerId: null, minute: 15 },
    { id: 'ev-43', matchId: 'fn-3rd', teamKey: 'woza-madzala', scorerPlayerId: 'p-woza-1', assistPlayerId: 'p-woza-2', minute: 21 },
    { id: 'ev-44', matchId: 'fn-3rd', teamKey: 'woza-madzala', scorerPlayerId: 'p-woza-2', assistPlayerId: 'p-woza-5', minute: 27 },

    // fn-gold: Dench 5 - 4 Gauteng
    { id: 'ev-45', matchId: 'fn-gold', teamKey: 'team-dench', scorerPlayerId: 'p-dench-1', assistPlayerId: 'p-dench-2', minute: 3 },
    { id: 'ev-46', matchId: 'fn-gold', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-2', assistPlayerId: 'p-gaut-3', minute: 7 },
    { id: 'ev-47', matchId: 'fn-gold', teamKey: 'team-dench', scorerPlayerId: 'p-dench-5', assistPlayerId: 'p-dench-1', minute: 11 },
    { id: 'ev-48', matchId: 'fn-gold', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-5', assistPlayerId: 'p-gaut-2', minute: 15 },
    { id: 'ev-49', matchId: 'fn-gold', teamKey: 'team-dench', scorerPlayerId: 'p-dench-1', assistPlayerId: 'p-dench-2', minute: 19 },
    { id: 'ev-50', matchId: 'fn-gold', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-2', assistPlayerId: null, minute: 23 },
    { id: 'ev-51', matchId: 'fn-gold', teamKey: 'team-dench', scorerPlayerId: 'p-dench-2', assistPlayerId: 'p-dench-1', minute: 26 },
    { id: 'ev-52', matchId: 'fn-gold', teamKey: 'gauteng-warriors', scorerPlayerId: 'p-gaut-3', assistPlayerId: 'p-gaut-2', minute: 28 },
    { id: 'ev-53', matchId: 'fn-gold', teamKey: 'team-dench', scorerPlayerId: 'p-dench-1', assistPlayerId: 'p-dench-5', minute: 30 }
];

const COLOR_PRESETS = [
    { label: 'Emerald Green', hex: '#12b84c' },
    { label: 'Electric Blue', hex: '#3b82f6' },
    { label: 'Amber Gold', hex: '#f59e0b' },
    { label: 'Crimson Red', hex: '#ef4444' },
    { label: 'Violet Purple', hex: '#8b5cf6' },
    { label: 'Neon Cyan', hex: '#06b6d4' },
    { label: 'Vibrant Orange', hex: '#f97316' },
    { label: 'Hot Pink', hex: '#ec4899' },
    { label: 'Lime Yellow', hex: '#84cc16' },
    { label: 'Midnight Slate', hex: '#64748b' }
];

export const DenchDerby = () => {
    // 0. TEAMS STATE (Customizable & Editable)
    const [teams, setTeams] = useState<Record<string, TeamInfo>>(() => {
        try {
            const saved = localStorage.getItem('dench_derby_teams_v4');
            if (saved) return JSON.parse(saved);
        } catch {
            // fallback
        }
        return DEFAULT_TEAMS;
    });

    // 1. MATCHES STATE
    const [matches, setMatches] = useState<TournamentMatch[]>(() => {
        try {
            const saved = localStorage.getItem('dench_derby_matches_v4');
            if (saved) return JSON.parse(saved);
        } catch {
            // fallback
        }
        return DEFAULT_MATCHES;
    });

    // 2. PLAYERS STATE
    const [players, setPlayers] = useState<TournamentPlayer[]>(() => {
        try {
            const saved = localStorage.getItem('dench_derby_players_v4');
            if (saved) return JSON.parse(saved);
        } catch {
            // fallback
        }
        return INITIAL_PLAYERS;
    });

    // 3. GOAL & ASSIST EVENTS STATE
    const [goalEvents, setGoalEvents] = useState<GoalEvent[]>(() => {
        try {
            const saved = localStorage.getItem('dench_derby_events_v4');
            if (saved) return JSON.parse(saved);
        } catch {
            // fallback
        }
        return [];
    });

    // Active Navigation Tab
    const [activeTab, setActiveTab] = useState<'bracket' | 'groups' | 'schedule' | 'leaderboard' | 'teams' | 'rules'>('bracket');

    // Add Player Modal State
    const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
    const [targetTeamKey, setTargetTeamKey] = useState<string>('team-dench');
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerNumber, setNewPlayerNumber] = useState('');
    const [newPlayerPosition, setNewPlayerPosition] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('MID');
    const [newPlayerCaptain, setNewPlayerCaptain] = useState(false);

    // Edit Teams Modal State
    const [isEditTeamsOpen, setIsEditTeamsOpen] = useState(false);
    const [editTeamsMode, setEditTeamsMode] = useState<'quick' | 'detail'>('quick');
    const [selectedEditTeamKey, setSelectedEditTeamKey] = useState<string>('team-dench');

    // Quick rename buffer for all 6 teams
    const [quickTeamNames, setQuickTeamNames] = useState<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        Object.keys(DEFAULT_TEAMS).forEach(k => { map[k] = DEFAULT_TEAMS[k].name; });
        return map;
    });

    // Single team editor buffer
    const [editTeamData, setEditTeamData] = useState<TeamInfo>({
        id: 'team-dench',
        name: 'Team Dench',
        group: 'A',
        color: '#12b84c',
        secondaryColor: '#0ea141',
        city: 'Dench Grounds',
        slogan: 'Relentless Pace, Pure Passion',
        founded: '2023',
        captain: 'Marcus "Dench" K.'
    });

    // Sync quickTeamNames and editTeamData when teams or selectedEditTeamKey change
    useEffect(() => {
        const map: Record<string, string> = {};
        Object.keys(teams).forEach(k => { map[k] = teams[k].name; });
        setQuickTeamNames(map);
    }, [teams]);

    useEffect(() => {
        if (teams[selectedEditTeamKey]) {
            setEditTeamData({ ...teams[selectedEditTeamKey] });
        }
    }, [selectedEditTeamKey, teams]);

    // Match Events & Score Modal State
    const [activeEventMatchId, setActiveEventMatchId] = useState<string | null>(null);
    const [eventTeamKey, setEventTeamKey] = useState<string>('');
    const [eventScorerId, setEventScorerId] = useState<string>('');
    const [eventAssistId, setEventAssistId] = useState<string>('');
    const [eventMinute, setEventMinute] = useState<number>(15);

    // Notification / Share
    const [copied, setCopied] = useState(false);

    // Save to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('dench_derby_teams_v4', JSON.stringify(teams));
            localStorage.setItem('dench_derby_matches_v4', JSON.stringify(matches));
            localStorage.setItem('dench_derby_players_v4', JSON.stringify(players));
            localStorage.setItem('dench_derby_events_v4', JSON.stringify(goalEvents));
        } catch (e) {
            console.error('Failed to save to localStorage', e);
        }
    }, [teams, matches, players, goalEvents]);

    // Countdown Timer calculation to 28 October 2026 18:30:00 SAST
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const targetDate = new Date('2026-10-28T18:30:00+02:00').getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            } else {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                setTimeLeft({ days, hours, minutes, seconds });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    // Standings calculation for Group A and Group B
    const calculateGroupStandings = (group: 'A' | 'B'): GroupStanding[] => {
        const teamKeys = Object.keys(teams).filter(key => teams[key].group === group);
        const map: Record<string, GroupStanding> = {};

        teamKeys.forEach(key => {
            map[key] = {
                teamKey: key,
                name: teams[key].name,
                color: teams[key].color,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0
            };
        });

        const groupMatches = matches.filter(m => m.stage === 'group' && m.group === group);

        groupMatches.forEach(m => {
            if (m.homeScore !== null && m.awayScore !== null && m.homeTeamKey && m.awayTeamKey) {
                const home = map[m.homeTeamKey];
                const away = map[m.awayTeamKey];
                if (!home || !away) return;

                home.played += 1;
                away.played += 1;
                home.goalsFor += m.homeScore;
                home.goalsAgainst += m.awayScore;
                away.goalsFor += m.awayScore;
                away.goalsAgainst += m.homeScore;

                if (m.homeScore > m.awayScore) {
                    home.won += 1;
                    home.points += 3;
                    away.lost += 1;
                } else if (m.homeScore < m.awayScore) {
                    away.won += 1;
                    away.points += 3;
                    home.lost += 1;
                } else {
                    home.drawn += 1;
                    away.drawn += 1;
                    home.points += 1;
                    away.points += 1;
                }

                home.goalDifference = home.goalsFor - home.goalsAgainst;
                away.goalDifference = away.goalsFor - away.goalsAgainst;
            }
        });

        return Object.values(map).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });
    };

    const standingsA = useMemo(() => calculateGroupStandings('A'), [matches, teams]);
    const standingsB = useMemo(() => calculateGroupStandings('B'), [matches, teams]);

    // Automatically derive Semi-Final and Final participants based on standings & matches
    const groupA1st = standingsA[0]?.played > 0 ? standingsA[0] : null;
    const groupA2nd = standingsA[1]?.played > 0 ? standingsA[1] : null;
    const groupB1st = standingsB[0]?.played > 0 ? standingsB[0] : null;
    const groupB2nd = standingsB[1]?.played > 0 ? standingsB[1] : null;

    // SF 1: Group A (1st spot) vs Group B (2nd spot)
    const sf1Match = matches.find(m => m.id === 'sf-1');
    const sf1HomeKey = groupA1st ? groupA1st.teamKey : null;
    const sf1AwayKey = groupB2nd ? groupB2nd.teamKey : null;

    // SF 2: Group A (2nd spot) vs Group B (1st spot)
    const sf2Match = matches.find(m => m.id === 'sf-2');
    const sf2HomeKey = groupA2nd ? groupA2nd.teamKey : null;
    const sf2AwayKey = groupB1st ? groupB1st.teamKey : null;

    // Determine SF winners & losers
    const getMatchOutcome = (match: TournamentMatch | undefined, homeKey: string | null, awayKey: string | null) => {
        if (!match || match.homeScore === null || match.awayScore === null || !homeKey || !awayKey) {
            return { winnerKey: null, loserKey: null };
        }
        if (match.homeScore > match.awayScore) {
            return { winnerKey: homeKey, loserKey: awayKey };
        } else if (match.awayScore > match.homeScore) {
            return { winnerKey: awayKey, loserKey: homeKey };
        }
        return { winnerKey: homeKey, loserKey: awayKey };
    };

    const sf1Outcome = getMatchOutcome(sf1Match, sf1HomeKey, sf1AwayKey);
    const sf2Outcome = getMatchOutcome(sf2Match, sf2HomeKey, sf2AwayKey);

    // 3rd place match: Loser SF 1 vs Loser SF 2
    const thirdMatch = matches.find(m => m.id === 'fn-3rd');
    const thirdHomeKey = sf1Outcome.loserKey;
    const thirdAwayKey = sf2Outcome.loserKey;
    const thirdOutcome = getMatchOutcome(thirdMatch, thirdHomeKey, thirdAwayKey);

    // Final match (1st spot): Winner SF 1 vs Winner SF 2
    const finalMatch = matches.find(m => m.id === 'fn-gold');
    const finalHomeKey = sf1Outcome.winnerKey;
    const finalAwayKey = sf2Outcome.winnerKey;
    const finalOutcome = getMatchOutcome(finalMatch, finalHomeKey, finalAwayKey);

    // Calculate individual player stats (Goals & Assists)
    const playerStatsMap = useMemo(() => {
        const map: Record<string, { goals: number; assists: number; matches: Set<string> }> = {};

        players.forEach(p => {
            map[p.id] = { goals: 0, assists: 0, matches: new Set() };
        });

        goalEvents.forEach(ev => {
            if (map[ev.scorerPlayerId]) {
                map[ev.scorerPlayerId].goals += 1;
                map[ev.scorerPlayerId].matches.add(ev.matchId);
            }
            if (ev.assistPlayerId && map[ev.assistPlayerId]) {
                map[ev.assistPlayerId].assists += 1;
                map[ev.assistPlayerId].matches.add(ev.matchId);
            }
        });

        return map;
    }, [players, goalEvents]);

    // Top Goalscorers (Golden Boot)
    const topScorers = useMemo(() => {
        return players
            .map(p => ({
                player: p,
                team: teams[p.teamKey],
                goals: playerStatsMap[p.id]?.goals || 0,
                assists: playerStatsMap[p.id]?.assists || 0,
                matchesPlayed: playerStatsMap[p.id]?.matches.size || 0
            }))
            .filter(item => item.goals > 0)
            .sort((a, b) => {
                if (b.goals !== a.goals) return b.goals - a.goals;
                if (b.assists !== a.assists) return b.assists - a.assists;
                return b.player.name.localeCompare(a.player.name);
            });
    }, [players, playerStatsMap, teams]);

    // Top Playmakers (Most Assists)
    const topAssists = useMemo(() => {
        return players
            .map(p => ({
                player: p,
                team: teams[p.teamKey],
                assists: playerStatsMap[p.id]?.assists || 0,
                goals: playerStatsMap[p.id]?.goals || 0,
                matchesPlayed: playerStatsMap[p.id]?.matches.size || 0
            }))
            .filter(item => item.assists > 0)
            .sort((a, b) => {
                if (b.assists !== a.assists) return b.assists - a.assists;
                if (b.goals !== a.goals) return b.goals - a.goals;
                return b.player.name.localeCompare(a.player.name);
            });
    }, [players, playerStatsMap, teams]);

    // Handlers for Players
    const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

    const handleAddPlayer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlayerName.trim()) return;

        if (editingPlayerId) {
            setPlayers(prev => prev.map(p => {
                if (p.id === editingPlayerId) {
                    return {
                        ...p,
                        teamKey: targetTeamKey,
                        name: newPlayerName.trim(),
                        jerseyNumber: parseInt(newPlayerNumber, 10) || p.jerseyNumber,
                        position: newPlayerPosition,
                        isCaptain: newPlayerCaptain
                    };
                }
                return p;
            }));
            setEditingPlayerId(null);
        } else {
            const newP: TournamentPlayer = {
                id: `p-${Date.now()}`,
                teamKey: targetTeamKey,
                name: newPlayerName.trim(),
                jerseyNumber: parseInt(newPlayerNumber, 10) || (players.filter(p => p.teamKey === targetTeamKey).length + 1),
                position: newPlayerPosition,
                isCaptain: newPlayerCaptain
            };
            setPlayers(prev => [...prev, newP]);
        }

        setNewPlayerName('');
        setNewPlayerNumber('');
        setNewPlayerPosition('MID');
        setNewPlayerCaptain(false);
        setIsAddPlayerOpen(false);
    };

    const handleOpenAddPlayerModal = (teamKey?: string) => {
        setEditingPlayerId(null);
        if (teamKey) setTargetTeamKey(teamKey);
        setNewPlayerName('');
        setNewPlayerNumber('');
        setNewPlayerPosition('MID');
        setNewPlayerCaptain(false);
        setIsAddPlayerOpen(true);
    };

    const handleOpenEditPlayer = (p: TournamentPlayer) => {
        setEditingPlayerId(p.id);
        setTargetTeamKey(p.teamKey);
        setNewPlayerName(p.name);
        setNewPlayerNumber(p.jerseyNumber.toString());
        setNewPlayerPosition(p.position);
        setNewPlayerCaptain(!!p.isCaptain);
        setIsAddPlayerOpen(true);
    };

    const handleDeletePlayer = (playerId: string) => {
        if (window.confirm('Are you sure you want to remove this player from the squad?')) {
            setPlayers(prev => prev.filter(p => p.id !== playerId));
            setGoalEvents(prev => prev.filter(ev => ev.scorerPlayerId !== playerId && ev.assistPlayerId !== playerId));
        }
    };

    const handleClearAllMockData = () => {
        if (window.confirm('Clear all mock players, scores, and goal events? You can then register your own clubs and squad rosters from scratch!')) {
            setPlayers([]);
            setGoalEvents([]);
            setMatches(DEFAULT_MATCHES.map(m => ({
                ...m,
                homeScore: null,
                awayScore: null,
                status: 'scheduled'
            })));
            localStorage.setItem('dench_derby_players_v4', JSON.stringify([]));
            localStorage.setItem('dench_derby_events_v4', JSON.stringify([]));
        }
    };

    const handleRestoreSamplePlayers = () => {
        setPlayers(INITIAL_PLAYERS);
        localStorage.setItem('dench_derby_players_v4', JSON.stringify(INITIAL_PLAYERS));
    };

    // Handlers for Editing Teams
    const handleSaveQuickTeams = (e: React.FormEvent) => {
        e.preventDefault();
        setTeams(prev => {
            const updated = { ...prev };
            Object.keys(quickTeamNames).forEach(k => {
                if (updated[k] && quickTeamNames[k]?.trim()) {
                    updated[k] = { ...updated[k], name: quickTeamNames[k].trim() };
                }
            });
            return updated;
        });

        // Also update match placeholders if they match
        setMatches(prev => prev.map(m => {
            let hp = m.homePlaceholder;
            let ap = m.awayPlaceholder;
            if (m.homeTeamKey && quickTeamNames[m.homeTeamKey]?.trim()) {
                hp = quickTeamNames[m.homeTeamKey].trim();
            }
            if (m.awayTeamKey && quickTeamNames[m.awayTeamKey]?.trim()) {
                ap = quickTeamNames[m.awayTeamKey].trim();
            }
            return { ...m, homePlaceholder: hp, awayPlaceholder: ap };
        }));

        setIsEditTeamsOpen(false);
    };

    const handleSaveDetailTeam = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTeamData.name.trim()) return;

        setTeams(prev => ({
            ...prev,
            [selectedEditTeamKey]: { ...editTeamData }
        }));

        setMatches(prev => prev.map(m => {
            let hp = m.homePlaceholder;
            let ap = m.awayPlaceholder;
            if (m.homeTeamKey === selectedEditTeamKey) {
                hp = editTeamData.name.trim();
            }
            if (m.awayTeamKey === selectedEditTeamKey) {
                ap = editTeamData.name.trim();
            }
            return { ...m, homePlaceholder: hp, awayPlaceholder: ap };
        }));

        setIsEditTeamsOpen(false);
    };

    const handleResetTeamsToDefault = () => {
        if (window.confirm('Reset all teams back to default? Any custom team names will be reset.')) {
            setTeams(DEFAULT_TEAMS);
            localStorage.removeItem('dench_derby_teams_v4');
        }
    };

    // Open Match Event Logger Modal
    const handleOpenMatchEvents = (matchId: string) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        let homeKey = match.homeTeamKey;

        if (match.id === 'sf-1') {
            homeKey = sf1HomeKey;
        } else if (match.id === 'sf-2') {
            homeKey = sf2HomeKey;
        } else if (match.id === 'fn-3rd') {
            homeKey = thirdHomeKey;
        } else if (match.id === 'fn-gold') {
            homeKey = finalHomeKey;
        }

        const defaultTeam = homeKey || 'team-dench';
        setEventTeamKey(defaultTeam);

        const teamPlayers = players.filter(p => p.teamKey === defaultTeam);
        setEventScorerId(teamPlayers[0]?.id || '');
        setEventAssistId('');
        setEventMinute(15);
        setActiveEventMatchId(matchId);
    };

    // Add Goal Event to a match
    const handleAddGoalEvent = () => {
        if (!activeEventMatchId || !eventTeamKey || !eventScorerId) return;

        const newEvent: GoalEvent = {
            id: `ev-${Date.now()}`,
            matchId: activeEventMatchId,
            teamKey: eventTeamKey,
            scorerPlayerId: eventScorerId,
            assistPlayerId: eventAssistId || null,
            minute: eventMinute
        };

        const updatedEvents = [...goalEvents, newEvent];
        setGoalEvents(updatedEvents);

        // Recompute match score based on goal events for this match
        recalcMatchScoreFromEvents(activeEventMatchId, updatedEvents);

        // Reset assist and increment minute
        setEventAssistId('');
        setEventMinute(prev => Math.min(30, prev + 3));
    };

    // Delete a goal event
    const handleDeleteGoalEvent = (eventId: string) => {
        const updatedEvents = goalEvents.filter(ev => ev.id !== eventId);
        setGoalEvents(updatedEvents);

        if (activeEventMatchId) {
            recalcMatchScoreFromEvents(activeEventMatchId, updatedEvents);
        }
    };

    // Recalculates match score based on events
    const recalcMatchScoreFromEvents = (matchId: string, currentEvents: GoalEvent[]) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        let homeKey = match.homeTeamKey;
        let awayKey = match.awayTeamKey;

        if (match.id === 'sf-1') {
            homeKey = sf1HomeKey;
            awayKey = sf1AwayKey;
        } else if (match.id === 'sf-2') {
            homeKey = sf2HomeKey;
            awayKey = sf2AwayKey;
        } else if (match.id === 'fn-3rd') {
            homeKey = thirdHomeKey;
            awayKey = thirdAwayKey;
        } else if (match.id === 'fn-gold') {
            homeKey = finalHomeKey;
            awayKey = finalAwayKey;
        }

        const matchEvs = currentEvents.filter(e => e.matchId === matchId);
        const homeGoals = homeKey ? matchEvs.filter(e => e.teamKey === homeKey).length : 0;
        const awayGoals = awayKey ? matchEvs.filter(e => e.teamKey === awayKey).length : 0;

        setMatches(prev => prev.map(m => {
            if (m.id === matchId) {
                return {
                    ...m,
                    homeScore: homeGoals,
                    awayScore: awayGoals,
                    status: matchEvs.length > 0 ? 'completed' : m.status
                };
            }
            return m;
        }));
    };

    const handleSimulateTournament = () => {
        setMatches(prev => prev.map(m => {
            const sim = SIMULATED_SCORES[m.id];
            if (sim) {
                return {
                    ...m,
                    homeScore: sim.home,
                    awayScore: sim.away,
                    status: 'completed'
                };
            }
            return m;
        }));
        setGoalEvents(SIMULATED_GOAL_EVENTS);
    };

    const handleResetTournament = () => {
        setMatches(DEFAULT_MATCHES);
        setGoalEvents([]);
        localStorage.removeItem('dench_derby_matches_v4');
        localStorage.removeItem('dench_derby_events_v4');
    };

    const handleShare = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const getTeamDisplayName = (key: string | null, placeholder: string) => {
        if (key && teams[key]) return teams[key].name;
        return placeholder;
    };

    const getTeamBadgeColor = (key: string | null) => {
        if (key && teams[key]) return teams[key].color;
        return '#6b7280';
    };

    // Current match being edited in modal
    const activeModalMatch = matches.find(m => m.id === activeEventMatchId);
    let modalHomeKey = activeModalMatch?.homeTeamKey;
    let modalAwayKey = activeModalMatch?.awayTeamKey;
    if (activeModalMatch?.id === 'sf-1') { modalHomeKey = sf1HomeKey; modalAwayKey = sf1AwayKey; }
    else if (activeModalMatch?.id === 'sf-2') { modalHomeKey = sf2HomeKey; modalAwayKey = sf2AwayKey; }
    else if (activeModalMatch?.id === 'fn-3rd') { modalHomeKey = thirdHomeKey; modalAwayKey = thirdAwayKey; }
    else if (activeModalMatch?.id === 'fn-gold') { modalHomeKey = finalHomeKey; modalAwayKey = finalAwayKey; }

    const activeMatchGoalEvents = goalEvents.filter(e => e.matchId === activeEventMatchId);
    const eventTeamPlayers = players.filter(p => p.teamKey === eventTeamKey);

    return (
        <div className="app-container">
            <Navbar />

            <main className="main-content">

                {/* Banner Notification */}
                <div style={{
                    backgroundColor: 'rgba(18, 184, 76, 0.08)',
                    border: '1px solid rgba(18, 184, 76, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1.25rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            backgroundColor: 'var(--color-primary)',
                            color: '#050505',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '999px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            <Flame size={13} /> Official Tournament
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                            Dench Derby kicks off on <strong>Wednesday, 28th October 2026 at 18:30 SAST</strong>!
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setIsEditTeamsOpen(true)}
                            className="btn btn-sm btn-primary"
                            title="Register and customize your tournament teams"
                        >
                            <Sliders size={14} /> Register & Edit Teams
                        </button>
                        <button
                            onClick={() => handleOpenAddPlayerModal()}
                            className="btn btn-sm btn-secondary"
                            title="Add a player to a tournament squad"
                        >
                            <UserPlus size={14} /> Add Player
                        </button>
                        <button
                            onClick={handleSimulateTournament}
                            className="btn btn-sm btn-secondary"
                            title="Fill in realistic scores & goalscorers to test full leaderboard"
                        >
                            <Sparkles size={14} color="#f59e0b" /> Simulate Results
                        </button>
                        <button
                            onClick={handleResetTournament}
                            className="btn btn-sm btn-outline"
                            title="Reset matches & goal events"
                        >
                            <RotateCcw size={14} /> Reset
                        </button>
                        <button
                            onClick={handleShare}
                            className="btn btn-sm btn-secondary"
                            title="Copy link to this tournament"
                        >
                            <Share2 size={14} /> {copied ? 'Copied!' : 'Share'}
                        </button>
                    </div>
                </div>

                {/* Hero Header */}
                <div className="derby-hero">
                    <div style={{
                        position: 'absolute',
                        top: '-60px',
                        right: '-60px',
                        width: '260px',
                        height: '260px',
                        background: 'radial-gradient(circle, rgba(18, 184, 76, 0.25) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ position: 'relative', zIndex: 1, maxWidth: '850px' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            marginBottom: '0.75rem',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                        }}>
                            <Calendar size={16} /> 28 October 2026 • 18:30 SAST Kickoff • 5-A-Side Championship
                        </div>

                        <h1 className="derby-title">
                            Dench Derby <span className="gradient-text">Tournament</span>
                        </h1>

                        <p className="derby-subtitle">
                            The battle for five-a-side supremacy. 6 elite clubs split into Group A and Group B, 
                            fighting through group fixtures, semi-final clashes, and the grand final for 1st spot 🥇.
                            Register your own clubs, build your squads, and track every goal and assist live!
                        </p>

                        {/* Live Countdown & Info Pill */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '1.25rem'
                        }}>
                            {/* Countdown Cards */}
                            <div className="derby-countdown-box" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                background: 'rgba(5, 5, 5, 0.75)',
                                padding: '0.75rem 1.25rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
                                    <Clock size={18} color="var(--color-primary)" />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Kick-off in:</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', textAlign: 'center' }}>
                                    <div style={{ minWidth: '40px' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{timeLeft.days}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Days</div>
                                    </div>
                                    <span style={{ fontSize: '1.2rem', color: 'var(--color-border)', alignSelf: 'center' }}>:</span>
                                    <div style={{ minWidth: '35px' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{timeLeft.hours}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Hrs</div>
                                    </div>
                                    <span style={{ fontSize: '1.2rem', color: 'var(--color-border)', alignSelf: 'center' }}>:</span>
                                    <div style={{ minWidth: '35px' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{timeLeft.minutes}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Min</div>
                                    </div>
                                    <span style={{ fontSize: '1.2rem', color: 'var(--color-border)', alignSelf: 'center' }}>:</span>
                                    <div style={{ minWidth: '35px' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{timeLeft.seconds}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Sec</div>
                                    </div>
                                </div>
                            </div>

                            {/* Top Scorer Spotlight */}
                            {topScorers.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: 'var(--radius-lg)'
                            }}>
                                    <Award size={22} color="#f59e0b" />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.05em' }}>
                                            Golden Boot Leader
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>
                                            {topScorers[0].player.name} ({topScorers[0].goals} ⚽)
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Champion Spotlight if tournament complete */}
                            {finalOutcome.winnerKey && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(18, 184, 76, 0.1) 100%)',
                                    border: '1px solid rgba(245, 158, 11, 0.4)',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: 'var(--radius-lg)'
                                }}>
                                    <Trophy size={22} color="#f59e0b" />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.05em' }}>
                                            Tournament Champion
                                        </div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                                            {teams[finalOutcome.winnerKey]?.name} 🥇
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tournament Navigation Tabs */}
                <div className="derby-tabs-bar">
                    <button
                        className={`derby-tab-btn ${activeTab === 'bracket' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('bracket')}
                    >
                        <Trophy size={16} /> Tournament Bracket
                    </button>
                    <button
                        className={`derby-tab-btn ${activeTab === 'groups' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('groups')}
                    >
                        <Users size={16} /> Groups & Standings
                    </button>
                    <button
                        className={`derby-tab-btn ${activeTab === 'schedule' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('schedule')}
                    >
                        <Clock size={16} /> Match Schedule & Goals
                    </button>
                    <button
                        className={`derby-tab-btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('leaderboard')}
                    >
                        <Medal size={16} color="#f59e0b" /> Scorers & Assists 🥇
                    </button>
                    <button
                        className={`derby-tab-btn ${activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('teams')}
                    >
                        <Shield size={16} /> Squad Rosters ({players.length})
                    </button>
                    <button
                        className={`derby-tab-btn ${activeTab === 'rules' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('rules')}
                    >
                        <Info size={16} /> Format & Rules
                    </button>
                </div>

                {/* TAB 1: TOURNAMENT BRACKET */}
                {activeTab === 'bracket' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                        {/* Visual Summary Card */}
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Tournament Progression</h2>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        Roadmap from Group Stage to the Grand Final 🥇
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        onClick={handleSimulateTournament}
                                        className="btn btn-sm btn-primary"
                                    >
                                        <Play size={14} /> Quick Test All Matches
                                    </button>
                                </div>
                            </div>

                            {/* Tournament Bracket Tree */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '2rem',
                                alignItems: 'stretch'
                            }}>

                                {/* Column 1: Group Stage Qualifiers */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: 'var(--color-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <Users size={16} /> Stage 1: Group Standings
                                    </div>

                                    {/* Group A Box */}
                                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                                            <strong style={{ color: 'white', fontSize: '1rem' }}>Group A</strong>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Top 2 Advance</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {standingsA.map((t, idx) => (
                                                <div key={t.teamKey} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.5rem 0.75rem',
                                                    backgroundColor: idx < 2 ? 'rgba(18, 184, 76, 0.08)' : 'transparent',
                                                    border: idx < 2 ? '1px solid rgba(18, 184, 76, 0.2)' : '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            color: idx < 2 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                            width: '16px'
                                                        }}>
                                                            {idx + 1}
                                                        </span>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: t.color }} />
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{t.name}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'var(--color-text-muted)' }}>{t.played}P</span>
                                                        <strong style={{ color: 'var(--color-primary)' }}>{t.points} pts</strong>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Group B Box */}
                                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                                            <strong style={{ color: 'white', fontSize: '1rem' }}>Group B</strong>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Top 2 Advance</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {standingsB.map((t, idx) => (
                                                <div key={t.teamKey} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.5rem 0.75rem',
                                                    backgroundColor: idx < 2 ? 'rgba(18, 184, 76, 0.08)' : 'transparent',
                                                    border: idx < 2 ? '1px solid rgba(18, 184, 76, 0.2)' : '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            color: idx < 2 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                                            width: '16px'
                                                        }}>
                                                            {idx + 1}
                                                        </span>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: t.color }} />
                                                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{t.name}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                                                        <span style={{ color: 'var(--color-text-muted)' }}>{t.played}P</span>
                                                        <strong style={{ color: 'var(--color-primary)' }}>{t.points} pts</strong>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: Semi-Finals */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: '#3b82f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <Shield size={16} /> Stage 2: Semi-Finals
                                    </div>

                                    {/* Semi-Final 1 Card */}
                                    <div className="glass-card" style={{
                                        padding: '1.25rem',
                                        border: sf1Match?.status === 'completed' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--color-border)'
                                    }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            <span style={{ fontWeight: 600, color: '#3b82f6' }}>SEMI-FINAL 1 • 15:00</span>
                                            <span>Pitch 1</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {/* Home: Group A 1st */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                backgroundColor: sf1Outcome.winnerKey === sf1HomeKey && sf1HomeKey ? 'rgba(18, 184, 76, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: sf1Outcome.winnerKey === sf1HomeKey && sf1HomeKey ? '1px solid rgba(18, 184, 76, 0.3)' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getTeamBadgeColor(sf1HomeKey) }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                                                            {getTeamDisplayName(sf1HomeKey, 'Group A ( 1st spot )')}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Group A 1st Place</div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                                                    {sf1Match?.homeScore !== null ? sf1Match?.homeScore : '-'}
                                                </span>
                                            </div>

                                            {/* Away: Group B 2nd */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                backgroundColor: sf1Outcome.winnerKey === sf1AwayKey && sf1AwayKey ? 'rgba(18, 184, 76, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: sf1Outcome.winnerKey === sf1AwayKey && sf1AwayKey ? '1px solid rgba(18, 184, 76, 0.3)' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getTeamBadgeColor(sf1AwayKey) }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                                                            {getTeamDisplayName(sf1AwayKey, 'Group B ( 2nd spot )')}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Group B 2nd Place</div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                                                    {sf1Match?.awayScore !== null ? sf1Match?.awayScore : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenMatchEvents(sf1Match!.id)}
                                            className="btn btn-sm btn-outline"
                                            style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8rem' }}
                                        >
                                            <Sliders size={13} /> Log Goals & Assists
                                        </button>
                                    </div>

                                    {/* Semi-Final 2 Card */}
                                    <div className="glass-card" style={{
                                        padding: '1.25rem',
                                        border: sf2Match?.status === 'completed' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--color-border)'
                                    }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            <span style={{ fontWeight: 600, color: '#3b82f6' }}>SEMI-FINAL 2 • 15:50</span>
                                            <span>Pitch 1</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {/* Home: Group A 2nd */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                backgroundColor: sf2Outcome.winnerKey === sf2HomeKey && sf2HomeKey ? 'rgba(18, 184, 76, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: sf2Outcome.winnerKey === sf2HomeKey && sf2HomeKey ? '1px solid rgba(18, 184, 76, 0.3)' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getTeamBadgeColor(sf2HomeKey) }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                                                            {getTeamDisplayName(sf2HomeKey, 'Group A ( 2nd spot )')}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Group A 2nd Place</div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                                                    {sf2Match?.homeScore !== null ? sf2Match?.homeScore : '-'}
                                                </span>
                                            </div>

                                            {/* Away: Group B 1st */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                backgroundColor: sf2Outcome.winnerKey === sf2AwayKey && sf2AwayKey ? 'rgba(18, 184, 76, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: sf2Outcome.winnerKey === sf2AwayKey && sf2AwayKey ? '1px solid rgba(18, 184, 76, 0.3)' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getTeamBadgeColor(sf2AwayKey) }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                                                            {getTeamDisplayName(sf2AwayKey, 'Group B ( 1st spot )')}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Group B 1st Place</div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                                                    {sf2Match?.awayScore !== null ? sf2Match?.awayScore : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenMatchEvents(sf2Match!.id)}
                                            className="btn btn-sm btn-outline"
                                            style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8rem' }}
                                        >
                                            <Sliders size={13} /> Log Goals & Assists
                                        </button>
                                    </div>
                                </div>

                                {/* Column 3: Finals (3rd spot & 1st spot 🥇) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: '#f59e0b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <Trophy size={16} /> Stage 3: Finals
                                    </div>

                                    {/* 3rd Place Match Card */}
                                    <div className="glass-card" style={{
                                        padding: '1.25rem',
                                        border: '1px solid rgba(245, 158, 11, 0.25)'
                                    }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                                            <span style={{ fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Medal size={14} /> 3RD PLACE PLAYOFF
                                            </span>
                                            <span style={{ color: 'var(--color-text-muted)' }}>16:45</span>
                                        </div>

                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                            First match (Competing for 3rd spot)
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                backgroundColor: thirdOutcome.winnerKey === thirdHomeKey && thirdHomeKey ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)'
                                            }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>
                                                    {getTeamDisplayName(thirdHomeKey, 'Loser SF 1')}
                                                </span>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                                                    {thirdMatch?.homeScore !== null ? thirdMatch?.homeScore : '-'}
                                                </span>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem 0.75rem',
                                                backgroundColor: thirdOutcome.winnerKey === thirdAwayKey && thirdAwayKey ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)'
                                            }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>
                                                    {getTeamDisplayName(thirdAwayKey, 'Loser SF 2')}
                                                </span>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                                                    {thirdMatch?.awayScore !== null ? thirdMatch?.awayScore : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenMatchEvents(thirdMatch!.id)}
                                            className="btn btn-sm btn-outline"
                                            style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8rem' }}
                                        >
                                            <Sliders size={13} /> Log Goals & Assists
                                        </button>
                                    </div>

                                    {/* Grand Final Card (Competing for 1st spot 🥇) */}
                                    <div className="glass-card" style={{
                                        padding: '1.25rem',
                                        background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, rgba(10, 10, 10, 0.95) 100%)',
                                        border: '2px solid rgba(245, 158, 11, 0.5)',
                                        boxShadow: '0 0 25px rgba(245, 158, 11, 0.15)'
                                    }}>
                                        <div className="flex-between" style={{ marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                                            <span style={{ fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <Award size={16} /> GRAND FINAL 🥇
                                            </span>
                                            <span style={{ color: 'white', fontWeight: 600 }}>17:30</span>
                                        </div>

                                        <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600, marginBottom: '0.6rem' }}>
                                            Second match ( Final Competing for 1st spot 🥇 )
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.6rem 0.75rem',
                                                backgroundColor: finalOutcome.winnerKey === finalHomeKey && finalHomeKey ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: finalOutcome.winnerKey === finalHomeKey && finalHomeKey ? '1px solid #f59e0b' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getTeamBadgeColor(finalHomeKey) }} />
                                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>
                                                        {getTeamDisplayName(finalHomeKey, 'Winner SF 1')}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                                                    {finalMatch?.homeScore !== null ? finalMatch?.homeScore : '-'}
                                                </span>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.6rem 0.75rem',
                                                backgroundColor: finalOutcome.winnerKey === finalAwayKey && finalAwayKey ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: finalOutcome.winnerKey === finalAwayKey && finalAwayKey ? '1px solid #f59e0b' : '1px solid transparent'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getTeamBadgeColor(finalAwayKey) }} />
                                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>
                                                        {getTeamDisplayName(finalAwayKey, 'Winner SF 2')}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                                                    {finalMatch?.awayScore !== null ? finalMatch?.awayScore : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenMatchEvents(finalMatch!.id)}
                                            className="btn btn-sm btn-primary"
                                            style={{ width: '100%', marginTop: '0.85rem', fontWeight: 700 }}
                                        >
                                            <Sliders size={13} /> Log Grand Final Goals 🥇
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                )}

                {/* TAB 2: GROUPS & STANDINGS */}
                {activeTab === 'groups' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="grid-responsive-2">

                            {/* Group A Standings Table */}
                            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid var(--color-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--color-primary)'
                                            }}></span>
                                            Group A Table
                                        </h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Top 2 qualify for Semi-Finals</p>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        backgroundColor: 'rgba(18, 184, 76, 0.15)',
                                        color: 'var(--color-primary)',
                                        fontWeight: 700,
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 'var(--radius-sm)'
                                    }}>
                                        3 Teams
                                    </span>
                                </div>

                                <div className="table-container" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ paddingLeft: '1.5rem' }}>Pos</th>
                                                <th>Team</th>
                                                <th style={{ textAlign: 'center' }}>P</th>
                                                <th style={{ textAlign: 'center' }}>W</th>
                                                <th style={{ textAlign: 'center' }}>D</th>
                                                <th style={{ textAlign: 'center' }}>L</th>
                                                <th style={{ textAlign: 'center' }}>GF</th>
                                                <th style={{ textAlign: 'center' }}>GA</th>
                                                <th style={{ textAlign: 'center' }}>GD</th>
                                                <th style={{ textAlign: 'center', color: 'white' }}>Pts</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {standingsA.map((row, index) => {
                                                const qualifies = index < 2;
                                                return (
                                                    <tr key={row.teamKey} style={{
                                                        backgroundColor: qualifies ? 'rgba(18, 184, 76, 0.03)' : 'transparent'
                                                    }}>
                                                        <td style={{ paddingLeft: '1.5rem', fontWeight: 700 }}>
                                                            <div style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                backgroundColor: qualifies ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                                                color: qualifies ? '#050505' : 'var(--color-text-muted)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.8rem'
                                                            }}>
                                                                {index + 1}
                                                            </div>
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: 'white' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.color }} />
                                                                <span>{row.name}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.played}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.won}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.drawn}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.lost}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.goalsFor}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.goalsAgainst}</td>
                                                        <td style={{
                                                            textAlign: 'center',
                                                            fontWeight: 600,
                                                            color: row.goalDifference > 0 ? 'var(--color-primary)' : (row.goalDifference < 0 ? '#ef4444' : 'inherit')
                                                        }}>
                                                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                                                            {row.points}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Group B Standings Table */}
                            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid var(--color-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                backgroundColor: '#3b82f6'
                                            }}></span>
                                            Group B Table
                                        </h3>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Top 2 qualify for Semi-Finals</p>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                        color: '#3b82f6',
                                        fontWeight: 700,
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 'var(--radius-sm)'
                                    }}>
                                        3 Teams
                                    </span>
                                </div>

                                <div className="table-container" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ paddingLeft: '1.5rem' }}>Pos</th>
                                                <th>Team</th>
                                                <th style={{ textAlign: 'center' }}>P</th>
                                                <th style={{ textAlign: 'center' }}>W</th>
                                                <th style={{ textAlign: 'center' }}>D</th>
                                                <th style={{ textAlign: 'center' }}>L</th>
                                                <th style={{ textAlign: 'center' }}>GF</th>
                                                <th style={{ textAlign: 'center' }}>GA</th>
                                                <th style={{ textAlign: 'center' }}>GD</th>
                                                <th style={{ textAlign: 'center', color: 'white' }}>Pts</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {standingsB.map((row, index) => {
                                                const qualifies = index < 2;
                                                return (
                                                    <tr key={row.teamKey} style={{
                                                        backgroundColor: qualifies ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                                                    }}>
                                                        <td style={{ paddingLeft: '1.5rem', fontWeight: 700 }}>
                                                            <div style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                backgroundColor: qualifies ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                                                color: qualifies ? 'white' : 'var(--color-text-muted)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.8rem'
                                                            }}>
                                                                {index + 1}
                                                            </div>
                                                        </td>
                                                        <td style={{ fontWeight: 600, color: 'white' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.color }} />
                                                                <span>{row.name}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.played}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.won}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.drawn}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.lost}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.goalsFor}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>{row.goalsAgainst}</td>
                                                        <td style={{
                                                            textAlign: 'center',
                                                            fontWeight: 600,
                                                            color: row.goalDifference > 0 ? 'var(--color-primary)' : (row.goalDifference < 0 ? '#ef4444' : 'inherit')
                                                        }}>
                                                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                                                            {row.points}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* TAB 3: MATCH SCHEDULE & GOAL EVENTS */}
                {activeTab === 'schedule' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Match Schedule & Live Scorers</h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    Click <strong>"Log Goals & Assists"</strong> on any match to record who scored and assisted!
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={handleSimulateTournament} className="btn btn-sm btn-primary">
                                    <Sparkles size={14} /> Simulate Sample Results
                                </button>
                                <button onClick={handleResetTournament} className="btn btn-sm btn-secondary">
                                    <RotateCcw size={14} /> Clear Scores
                                </button>
                            </div>
                        </div>

                        {/* Schedule List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {matches.map((m) => {
                                const isSemi = m.stage === 'semi';
                                const isFinal = m.stage === 'final' || m.stage === 'third_place';

                                let homeDisplay = m.homePlaceholder;
                                let awayDisplay = m.awayPlaceholder;

                                if (m.id === 'sf-1') {
                                    homeDisplay = getTeamDisplayName(sf1HomeKey, 'Group A ( 1st spot )');
                                    awayDisplay = getTeamDisplayName(sf1AwayKey, 'Group B ( 2nd spot )');
                                } else if (m.id === 'sf-2') {
                                    homeDisplay = getTeamDisplayName(sf2HomeKey, 'Group A ( 2nd spot )');
                                    awayDisplay = getTeamDisplayName(sf2AwayKey, 'Group B ( 1st spot )');
                                } else if (m.id === 'fn-3rd') {
                                    homeDisplay = getTeamDisplayName(thirdHomeKey, 'Loser SF 1');
                                    awayDisplay = getTeamDisplayName(thirdAwayKey, 'Loser SF 2');
                                } else if (m.id === 'fn-gold') {
                                    homeDisplay = getTeamDisplayName(finalHomeKey, 'Winner SF 1');
                                    awayDisplay = getTeamDisplayName(finalAwayKey, 'Winner SF 2');
                                } else {
                                    if (m.homeTeamKey) homeDisplay = teams[m.homeTeamKey]?.name || m.homePlaceholder;
                                    if (m.awayTeamKey) awayDisplay = teams[m.awayTeamKey]?.name || m.awayPlaceholder;
                                }

                                const matchGoals = goalEvents.filter(ev => ev.matchId === m.id);

                                return (
                                    <div key={m.id} className="glass-card" style={{
                                        padding: '1.25rem 1.5rem',
                                        border: isFinal ? '1px solid rgba(245, 158, 11, 0.4)' : (isSemi ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--color-border)')
                                    }}>
                                        <div className="derby-match-row">

                                            {/* Match Info & Timing */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '180px' }}>
                                                <div style={{
                                                    backgroundColor: isFinal ? 'rgba(245, 158, 11, 0.15)' : (isSemi ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
                                                    padding: '0.4rem 0.75rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    textAlign: 'center'
                                                }}>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>{m.time}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Pitch {m.pitch}</div>
                                                </div>

                                                <div>
                                                    <div style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        color: isFinal ? '#f59e0b' : (isSemi ? '#3b82f6' : 'var(--color-primary)'),
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {m.note}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                        {m.status === 'completed' ? 'Full Time' : 'Scheduled'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Teams & Scores */}
                                            <div className="derby-score-board">
                                                <div style={{ flex: 1, textAlign: 'right', fontWeight: 600, color: 'white', fontSize: '1rem' }}>
                                                    {homeDisplay}
                                                </div>

                                                <div style={{
                                                    padding: '0.4rem 1rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    backgroundColor: m.homeScore !== null ? 'rgba(18, 184, 76, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                                    border: m.homeScore !== null ? '1px solid rgba(18, 184, 76, 0.3)' : '1px solid var(--color-border)',
                                                    minWidth: '80px',
                                                    textAlign: 'center'
                                                }}>
                                                    {m.homeScore !== null && m.awayScore !== null ? (
                                                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                                                            {m.homeScore} - {m.awayScore}
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                            vs
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{ flex: 1, textAlign: 'left', fontWeight: 600, color: 'white', fontSize: '1rem' }}>
                                                    {awayDisplay}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div>
                                                <button
                                                    onClick={() => handleOpenMatchEvents(m.id)}
                                                    className="btn btn-sm btn-secondary"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                                >
                                                    <Sliders size={13} /> Log Goals & Assists ({matchGoals.length})
                                                </button>
                                            </div>

                                        </div>

                                        {/* Match Goals & Scorers Preview Chips */}
                                        {matchGoals.length > 0 && (
                                            <div style={{
                                                marginTop: '0.75rem',
                                                paddingTop: '0.75rem',
                                                borderTop: '1px solid var(--color-border)',
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '0.5rem',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                                    Match Events:
                                                </span>
                                                {matchGoals.map(ev => {
                                                    const scorer = players.find(p => p.id === ev.scorerPlayerId);
                                                    const assist = players.find(p => p.id === ev.assistPlayerId);
                                                    return (
                                                        <span key={ev.id} style={{
                                                            fontSize: '0.75rem',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                            border: '1px solid var(--color-border)',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '999px',
                                                            color: 'white'
                                                        }}>
                                                            ⚽ <strong>{scorer?.name || 'Goal'}</strong> {ev.minute}'
                                                            {assist && <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>(👟 {assist.name})</span>}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 4: LEADERBOARD & STATS (GOLDEN BOOT & ASSISTS) */}
                {activeTab === 'leaderboard' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Tournament Player Statistics</h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    Keep track of who scores and assists in every match.
                                </p>
                            </div>
                            <button onClick={() => handleOpenAddPlayerModal()} className="btn btn-sm btn-primary">
                                <UserPlus size={14} /> Add Player to Squad
                            </button>
                        </div>

                        {/* Top Scorers & Top Assists 2-Column Grid */}
                        <div className="grid-responsive-2">

                            {/* Golden Boot (Top Scorers) */}
                            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid var(--color-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Award size={20} color="#f59e0b" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.15rem', color: 'white', margin: 0 }}>Golden Boot (Top Scorers)</h3>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Most goals scored</span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>
                                        {topScorers.length} Scorers
                                    </span>
                                </div>

                                <div className="table-container" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ paddingLeft: '1.5rem' }}>#</th>
                                                <th>Player</th>
                                                <th>Club</th>
                                                <th style={{ textAlign: 'center' }}>Assists</th>
                                                <th style={{ textAlign: 'center', color: '#f59e0b', fontSize: '1rem' }}>Goals ⚽</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topScorers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                                                        No goals logged yet. Click "Log Goals & Assists" on any match to record scorers!
                                                    </td>
                                                </tr>
                                            ) : (
                                                topScorers.map((item, index) => (
                                                    <tr key={item.player.id} style={{
                                                        backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.08)' : 'transparent'
                                                    }}>
                                                        <td style={{ paddingLeft: '1.5rem', fontWeight: 700 }}>
                                                            {index === 0 ? (
                                                                <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>🥇</span>
                                                            ) : index === 1 ? (
                                                                <span style={{ color: '#9ca3af', fontSize: '1.1rem' }}>🥈</span>
                                                            ) : index === 2 ? (
                                                                <span style={{ color: '#d97706', fontSize: '1.1rem' }}>🥉</span>
                                                            ) : (
                                                                <span style={{ color: 'var(--color-text-muted)' }}>{index + 1}</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 600, color: 'white' }}>
                                                                {item.player.name}
                                                                {item.player.isCaptain && (
                                                                    <span style={{ fontSize: '0.65rem', marginLeft: '6px', backgroundColor: 'var(--color-primary)', color: '#050505', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>C</span>
                                                                )}
                                                            </div>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                #{item.player.jerseyNumber} • {item.player.position}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.team?.color || '#999' }} />
                                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.team?.name}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                                                            {item.assists}
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.25rem', color: '#f59e0b' }}>
                                                            {item.goals}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Top Playmakers (Most Assists) */}
                            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid var(--color-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Trophy size={20} color="#3b82f6" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.15rem', color: 'white', margin: 0 }}>Playmaker Award (Assists)</h3>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Most assists provided</span>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 700 }}>
                                        {topAssists.length} Playmakers
                                    </span>
                                </div>

                                <div className="table-container" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style={{ paddingLeft: '1.5rem' }}>#</th>
                                                <th>Player</th>
                                                <th>Club</th>
                                                <th style={{ textAlign: 'center' }}>Goals</th>
                                                <th style={{ textAlign: 'center', color: '#3b82f6', fontSize: '1rem' }}>Assists 👟</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topAssists.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                                                        No assists logged yet. Record assist providers when adding goal events!
                                                    </td>
                                                </tr>
                                            ) : (
                                                topAssists.map((item, index) => (
                                                    <tr key={item.player.id} style={{
                                                        backgroundColor: index === 0 ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                                                    }}>
                                                        <td style={{ paddingLeft: '1.5rem', fontWeight: 700 }}>
                                                            {index === 0 ? (
                                                                <span style={{ color: '#3b82f6', fontSize: '1.1rem' }}>🎯</span>
                                                            ) : (
                                                                <span style={{ color: 'var(--color-text-muted)' }}>{index + 1}</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 600, color: 'white' }}>
                                                                {item.player.name}
                                                                {item.player.isCaptain && (
                                                                    <span style={{ fontSize: '0.65rem', marginLeft: '6px', backgroundColor: 'var(--color-primary)', color: '#050505', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>C</span>
                                                                )}
                                                            </div>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                #{item.player.jerseyNumber} • {item.player.position}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.team?.color || '#999' }} />
                                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.team?.name}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                                                            {item.goals}
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.25rem', color: '#3b82f6' }}>
                                                            {item.assists}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* TAB 5: SQUAD ROSTERS & PLAYER MANAGEMENT */}
                {activeTab === 'teams' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Club Squads & Players</h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    Manage players, jersey numbers, and monitor individual tournament statistics.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setIsEditTeamsOpen(true)}
                                    className="btn btn-primary"
                                    title="Register and edit all 6 tournament clubs"
                                >
                                    <Sliders size={15} /> Register / Edit Teams
                                </button>
                                <button
                                    onClick={() => handleOpenAddPlayerModal()}
                                    className="btn btn-secondary"
                                    title="Register a new player to any team"
                                >
                                    <Plus size={15} /> Add New Player
                                </button>
                                <button
                                    onClick={handleClearAllMockData}
                                    className="btn btn-outline"
                                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                                    title="Wipe mock players and scores to start fresh with your real clubs"
                                >
                                    <Trash2 size={14} /> Clear Mock Data
                                </button>
                                <button
                                    onClick={handleRestoreSamplePlayers}
                                    className="btn btn-outline"
                                    title="Restore sample players if needed"
                                >
                                    <RotateCcw size={14} /> Restore Sample Squads
                                </button>
                            </div>
                        </div>

                        {/* Registration Quick Info Banner */}
                        <div style={{
                            backgroundColor: 'rgba(18, 184, 76, 0.06)',
                            border: '1px solid rgba(18, 184, 76, 0.25)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            fontSize: '0.85rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)' }}>
                                <CheckCircle2 size={16} color="var(--color-primary)" />
                                <span>
                                    <strong>Self-Service Registration:</strong> Register your own 6 clubs via <strong>Register / Edit Teams</strong>, then register your players below. Or click <strong>Clear Mock Data</strong> to start with a blank tournament sheet!
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '999px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    Total Registered: <strong style={{ color: 'white' }}>{players.length}</strong> Players
                                </span>
                            </div>
                        </div>

                        {/* 6 Squad Cards */}
                        <div className="grid-responsive-2">
                            {Object.values(teams).map(team => {
                                const teamPlayers = players.filter(p => p.teamKey === team.id);

                                return (
                                    <div key={team.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                                        {/* Team Squad Header */}
                                        <div style={{
                                            padding: '1.25rem 1.5rem',
                                            borderBottom: '1px solid var(--color-border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: `linear-gradient(90deg, ${team.color}15 0%, transparent 100%)`
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '38px',
                                                    height: '38px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    backgroundColor: `${team.color}25`,
                                                    border: `1px solid ${team.color}50`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Shield size={20} color={team.color} />
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '1.15rem', color: 'white', margin: 0 }}>{team.name}</h3>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                        Group {team.group} • {team.city || 'Dench Derby'} • {teamPlayers.length} player{teamPlayers.length === 1 ? '' : 's'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => {
                                                        setSelectedEditTeamKey(team.id);
                                                        setEditTeamsMode('detail');
                                                        setIsEditTeamsOpen(true);
                                                    }}
                                                    className="btn btn-sm btn-outline"
                                                    style={{ fontSize: '0.8rem' }}
                                                    title="Edit this team's name and details"
                                                >
                                                    <Sliders size={13} /> Edit Team
                                                </button>
                                                <button
                                                    onClick={() => handleOpenAddPlayerModal(team.id)}
                                                    className="btn btn-sm btn-secondary"
                                                    style={{ fontSize: '0.8rem' }}
                                                    title="Register a new player into this squad"
                                                >
                                                    <UserPlus size={13} /> + Player
                                                </button>
                                            </div>
                                        </div>

                                        {/* Roster Table */}
                                        <div style={{ padding: '0.75rem 1.25rem' }}>
                                            {teamPlayers.length === 0 ? (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '2rem 1rem',
                                                    color: 'var(--color-text-muted)',
                                                    fontSize: '0.85rem',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.01)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    border: '1px dashed var(--color-border)'
                                                }}>
                                                    <Users size={28} style={{ opacity: 0.35, margin: '0 auto 0.5rem auto', display: 'block' }} />
                                                    <div>No registered players in <strong>{team.name}</strong> yet.</div>
                                                    <div style={{ marginTop: '0.75rem' }}>
                                                        <button
                                                            onClick={() => handleOpenAddPlayerModal(team.id)}
                                                            className="btn btn-sm btn-primary"
                                                            style={{ fontSize: '0.8rem' }}
                                                        >
                                                            <UserPlus size={13} /> Register First Player
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                                    {teamPlayers.map(p => {
                                                        const stat = playerStatsMap[p.id];
                                                        return (
                                                            <div key={p.id} style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '0.55rem 0.75rem',
                                                                borderRadius: 'var(--radius-sm)',
                                                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                                                border: '1px solid var(--color-border)',
                                                                flexWrap: 'wrap',
                                                                gap: '0.5rem'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                    <span style={{
                                                                        width: '26px',
                                                                        height: '26px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: `${team.color}25`,
                                                                        color: team.color,
                                                                        fontWeight: 800,
                                                                        fontSize: '0.75rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        flexShrink: 0
                                                                    }}>
                                                                        {p.jerseyNumber}
                                                                    </span>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                            {p.name}
                                                                            {p.isCaptain && (
                                                                                <span style={{
                                                                                    fontSize: '0.62rem',
                                                                                    backgroundColor: 'var(--color-primary)',
                                                                                    color: '#050505',
                                                                                    fontWeight: 800,
                                                                                    padding: '0.1rem 0.35rem',
                                                                                    borderRadius: '3px'
                                                                                }}>
                                                                                    CAPTAIN
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                            {p.position}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Player Stats & Actions */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <div style={{
                                                                        backgroundColor: stat?.goals ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                                                        border: stat?.goals ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                                                                        padding: '0.2rem 0.5rem',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 700,
                                                                        color: stat?.goals ? '#f59e0b' : 'var(--color-text-muted)'
                                                                    }} title="Goals scored">
                                                                        {stat?.goals || 0} ⚽
                                                                    </div>

                                                                    <div style={{
                                                                        backgroundColor: stat?.assists ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                                                        border: stat?.assists ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                                                                        padding: '0.2rem 0.5rem',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 700,
                                                                        color: stat?.assists ? '#3b82f6' : 'var(--color-text-muted)'
                                                                    }} title="Assists made">
                                                                        {stat?.assists || 0} 👟
                                                                    </div>

                                                                    <button
                                                                        onClick={() => handleOpenEditPlayer(p)}
                                                                        className="btn-icon"
                                                                        style={{
                                                                            padding: '0.25rem 0.45rem',
                                                                            borderRadius: 'var(--radius-sm)',
                                                                            background: 'rgba(255, 255, 255, 0.05)',
                                                                            border: '1px solid var(--color-border)',
                                                                            color: 'var(--color-text-main)',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.75rem',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.25rem'
                                                                        }}
                                                                        title="Edit player details"
                                                                    >
                                                                        <Sliders size={12} /> Edit
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleDeletePlayer(p.id)}
                                                                        className="btn-icon"
                                                                        style={{
                                                                            padding: '0.25rem 0.45rem',
                                                                            borderRadius: 'var(--radius-sm)',
                                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                            color: '#ef4444',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.75rem',
                                                                            display: 'flex',
                                                                            alignItems: 'center'
                                                                        }}
                                                                        title="Remove player from squad"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 6: RULES & FORMAT */}
                {activeTab === 'rules' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2.5rem' }}>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', color: 'white' }}>
                                Dench Derby Tournament Regulations
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={18} /> 1. Group Stage Mechanics
                                    </h4>
                                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        <li>6 clubs partitioned into <strong>Group A</strong> and <strong>Group B</strong> (3 teams per group).</li>
                                        <li>Single round-robin within each group (each team plays 2 matches).</li>
                                        <li>Win = <strong>3 Points</strong>, Draw = <strong>1 Point</strong>, Loss = <strong>0 Points</strong>.</li>
                                        <li>The top 2 clubs from Group A and Group B progress to the Semi-Finals.</li>
                                        <li>3rd placed teams in both groups are eliminated at the group stage.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '1.1rem', color: '#3b82f6', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Shield size={18} /> 2. Knockout Crossover Structure
                                    </h4>
                                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        <li><strong>Semi-Final 1:</strong> Group A (1st spot) vs Group B (2nd spot)</li>
                                        <li><strong>Semi-Final 2:</strong> Group A (2nd spot) vs Group B (1st spot)</li>
                                        <li>Both semi-final winners advance to the Grand Final.</li>
                                        <li>Both semi-final losers advance to the 3rd Place Playoff.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '1.1rem', color: '#f59e0b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Trophy size={18} /> 3. Finals Showcase
                                    </h4>
                                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        <li><strong>First match:</strong> Competing for 3rd spot (Bronze medal).</li>
                                        <li><strong>Second match:</strong> Final Competing for 1st spot 🥇 (Gold Trophy & Crown).</li>
                                        <li>Individual honours: <strong>Golden Boot (Top Scorer)</strong> and <strong>Playmaker Award (Most Assists)</strong>.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '1.1rem', color: '#ec4899', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle2 size={18} /> 4. Match Rules & Fair Play
                                    </h4>
                                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        <li>Standard Five-A-Side rules apply (5 on pitch + up to 4 rolling subs).</li>
                                        <li>2 halves of 15 minutes each with a 5-minute halftime interval.</li>
                                        <li>Goalkeepers cannot leave their designated penalty area.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 1: ADD / EDIT PLAYER TO SQUAD */}
                {isAddPlayerOpen && (
                    <div className="derby-modal-overlay">
                        <div className="derby-modal-content" style={{ maxWidth: '480px' }}>
                            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <UserPlus size={20} color="var(--color-primary)" />
                                    <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'white' }}>
                                        {editingPlayerId ? 'Edit Player' : 'Register Player to Squad'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsAddPlayerOpen(false);
                                        setEditingPlayerId(null);
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddPlayer} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                        Select Team
                                    </label>
                                    <select
                                        value={targetTeamKey}
                                        onChange={(e) => setTargetTeamKey(e.target.value)}
                                        className="derby-input"
                                    >
                                        {Object.values(teams).map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} (Group {t.group})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                        Player Full Name / Nickname
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Sipho 'Star' Zulu"
                                        value={newPlayerName}
                                        onChange={(e) => setNewPlayerName(e.target.value)}
                                        className="derby-input"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                            Jersey #
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="99"
                                            placeholder="e.g. 10"
                                            value={newPlayerNumber}
                                            onChange={(e) => setNewPlayerNumber(e.target.value)}
                                            className="derby-input"
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                            Position
                                        </label>
                                        <select
                                            value={newPlayerPosition}
                                            onChange={(e) => setNewPlayerPosition(e.target.value as any)}
                                            className="derby-input"
                                        >
                                            <option value="FWD">Forward (FWD)</option>
                                            <option value="MID">Midfielder (MID)</option>
                                            <option value="DEF">Defender (DEF)</option>
                                            <option value="GK">Goalkeeper (GK)</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    <input
                                        type="checkbox"
                                        id="newPlayerCap"
                                        checked={newPlayerCaptain}
                                        onChange={(e) => setNewPlayerCaptain(e.target.checked)}
                                        style={{ accentColor: 'var(--color-primary)' }}
                                    />
                                    <label htmlFor="newPlayerCap" style={{ fontSize: '0.85rem', color: 'white', cursor: 'pointer' }}>
                                        Designate as Team Captain
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ flex: 1 }}
                                    >
                                        {editingPlayerId ? 'Save Player Changes' : 'Register Player'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAddPlayerOpen(false);
                                            setEditingPlayerId(null);
                                        }}
                                        className="btn btn-outline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 2: LOG GOALS & ASSISTS */}
                {activeEventMatchId && activeModalMatch && (
                    <div className="derby-modal-overlay">
                        <div className="derby-modal-content" style={{ maxWidth: '640px' }}>
                            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                                        {activeModalMatch.note} • 28 October 2026 • 18:30
                                    </span>
                                    <h3 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>
                                        Log Goals & Assists
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setActiveEventMatchId(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Score Display Header */}
                            <div style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem 1.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                textAlign: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ flex: 1, textAlign: 'right', fontWeight: 700, color: 'white' }}>
                                    {modalHomeKey ? teams[modalHomeKey]?.name : activeModalMatch.homePlaceholder}
                                </div>
                                <div style={{
                                    margin: '0 1.5rem',
                                    fontSize: '1.75rem',
                                    fontWeight: 800,
                                    color: 'var(--color-primary)',
                                    minWidth: '60px'
                                }}>
                                    {activeModalMatch.homeScore ?? 0} - {activeModalMatch.awayScore ?? 0}
                                </div>
                                <div style={{ flex: 1, textAlign: 'left', fontWeight: 700, color: 'white' }}>
                                    {modalAwayKey ? teams[modalAwayKey]?.name : activeModalMatch.awayPlaceholder}
                                </div>
                            </div>

                            {/* Add Goal Event Form */}
                            <div style={{
                                backgroundColor: 'rgba(18, 184, 76, 0.05)',
                                border: '1px solid rgba(18, 184, 76, 0.2)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1.25rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Plus size={16} color="var(--color-primary)" /> Record New Goal & Assist
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    {/* Scoring Team */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            Scoring Team
                                        </label>
                                        <select
                                            value={eventTeamKey}
                                            onChange={(e) => {
                                                const newTeam = e.target.value;
                                                setEventTeamKey(newTeam);
                                                const newPlayers = players.filter(p => p.teamKey === newTeam);
                                                setEventScorerId(newPlayers[0]?.id || '');
                                                setEventAssistId('');
                                            }}
                                            className="derby-input"
                                        >
                                            {modalHomeKey && teams[modalHomeKey] && (
                                                <option value={modalHomeKey}>{teams[modalHomeKey].name}</option>
                                            )}
                                            {modalAwayKey && teams[modalAwayKey] && (
                                                <option value={modalAwayKey}>{teams[modalAwayKey].name}</option>
                                            )}
                                        </select>
                                    </div>

                                    {/* Goal Scorer */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            Goal Scorer ⚽
                                        </label>
                                        <select
                                            value={eventScorerId}
                                            onChange={(e) => setEventScorerId(e.target.value)}
                                            className="derby-input"
                                        >
                                            {eventTeamPlayers.length === 0 ? (
                                                <option value="">No registered players (Add in Squad tab)</option>
                                            ) : (
                                                eventTeamPlayers.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        #{p.jerseyNumber} {p.name} ({p.position})
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    {/* Assist Provider */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            Assist Provided By 👟
                                        </label>
                                        <select
                                            value={eventAssistId}
                                            onChange={(e) => setEventAssistId(e.target.value)}
                                            className="derby-input"
                                        >
                                            <option value="">None (Solo Goal / Penalty)</option>
                                            {eventTeamPlayers.filter(p => p.id !== eventScorerId).map(p => (
                                                <option key={p.id} value={p.id}>
                                                    #{p.jerseyNumber} {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Minute */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            Minute (1 - 35)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="35"
                                            value={eventMinute}
                                            onChange={(e) => setEventMinute(parseInt(e.target.value, 10) || 1)}
                                            className="derby-input"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddGoalEvent}
                                    className="btn btn-sm btn-primary"
                                    style={{ width: '100%', fontWeight: 700 }}
                                    disabled={!eventScorerId}
                                >
                                    Record Goal Event (+1 Goal)
                                </button>
                            </div>

                            {/* Recorded Goals for this match */}
                            <div>
                                <h4 style={{ fontSize: '0.95rem', color: 'white', marginBottom: '0.5rem' }}>
                                    Match Event Timeline ({activeMatchGoalEvents.length} Goals)
                                </h4>

                                {activeMatchGoalEvents.length === 0 ? (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                        No goals recorded yet for this match.
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {activeMatchGoalEvents.map(ev => {
                                            const team = teams[ev.teamKey];
                                            const scorer = players.find(p => p.id === ev.scorerPlayerId);
                                            const assist = players.find(p => p.id === ev.assistPlayerId);

                                            return (
                                                <div key={ev.id} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.5rem 0.75rem',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: 'var(--radius-sm)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.85rem', minWidth: '24px' }}>
                                                            {ev.minute}'
                                                        </span>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: team?.color || '#999' }} />
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                                                                ⚽ {scorer?.name || 'Player'}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                                {team?.name} {assist && `• 👟 Assist by ${assist.name}`}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleDeleteGoalEvent(ev.id)}
                                                        title="Delete this goal"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            padding: '0.25rem'
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                                <button
                                    onClick={() => setActiveEventMatchId(null)}
                                    className="btn btn-sm btn-primary"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 3: REGISTER & EDIT TOURNAMENT TEAMS */}
                {isEditTeamsOpen && (
                    <div className="derby-modal-overlay">
                        <div className="derby-modal-content" style={{ maxWidth: '680px' }}>
                            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Sliders size={22} color="var(--color-primary)" />
                                    <div>
                                        <h3 style={{ fontSize: '1.3rem', margin: 0, color: 'white' }}>
                                            Register Tournament Teams
                                        </h3>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            Register your 6 clubs into Group A & Group B for 28 October 2026 (18:30 Kickoff)
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditTeamsOpen(false)}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            {/* Sub Tabs */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                                <button
                                    onClick={() => setEditTeamsMode('quick')}
                                    className={`btn btn-sm ${editTeamsMode === 'quick' ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    ⚡ Quick Register All 6 Teams
                                </button>
                                <button
                                    onClick={() => setEditTeamsMode('detail')}
                                    className={`btn btn-sm ${editTeamsMode === 'detail' ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    🎨 Full Club Customizer
                                </button>
                            </div>

                            {editTeamsMode === 'quick' ? (
                                <form onSubmit={handleSaveQuickTeams} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{
                                        backgroundColor: 'rgba(18, 184, 76, 0.08)',
                                        border: '1px solid rgba(18, 184, 76, 0.25)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '0.85rem 1rem',
                                        fontSize: '0.85rem',
                                        color: 'var(--color-text-main)'
                                    }}>
                                        Enter your club names below. Changes immediately update all match fixtures, group standings, bracket pathways, and squad lists!
                                    </div>

                                    <div className="quick-teams-grid">
                                        {/* Group A */}
                                        <div style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '1.25rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                                                <Users size={16} /> Group A (3 Clubs)
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                                {Object.values(teams).filter(t => t.group === 'A').map((t, idx) => (
                                                    <div key={t.id}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.color }} />
                                                            Team A{idx + 1} Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={quickTeamNames[t.id] || ''}
                                                            onChange={(e) => setQuickTeamNames(prev => ({ ...prev, [t.id]: e.target.value }))}
                                                            placeholder={`e.g. Club ${idx + 1}`}
                                                            className="derby-input"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Group B */}
                                        <div style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '1.25rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#8b5cf6', fontWeight: 700, fontSize: '0.95rem' }}>
                                                <Users size={16} /> Group B (3 Clubs)
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                                {Object.values(teams).filter(t => t.group === 'B').map((t, idx) => (
                                                    <div key={t.id}>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.color }} />
                                                            Team B{idx + 1} Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={quickTeamNames[t.id] || ''}
                                                            onChange={(e) => setQuickTeamNames(prev => ({ ...prev, [t.id]: e.target.value }))}
                                                            placeholder={`e.g. Club ${idx + 4}`}
                                                            className="derby-input"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={handleClearAllMockData}
                                            className="btn btn-outline"
                                            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                                            title="Clear mock scores & players so tournament is completely fresh"
                                        >
                                            <Trash2 size={14} /> Clear Mock Scores & Squads
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleResetTeamsToDefault}
                                            className="btn btn-outline"
                                            title="Reset back to default mock clubs"
                                        >
                                            Reset to Default
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditTeamsOpen(false)}
                                            className="btn btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            style={{ minWidth: '160px' }}
                                        >
                                            <CheckCircle2 size={16} /> Save & Register Teams
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleSaveDetailTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {/* Club Selector Pill Bar */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                            Select Club to Customize
                                        </label>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {Object.values(teams).map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setSelectedEditTeamKey(t.id)}
                                                    className={`btn btn-sm ${selectedEditTeamKey === t.id ? 'btn-primary' : 'btn-secondary'}`}
                                                    style={{
                                                        borderLeft: `4px solid ${t.color}`,
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    {t.name} (Gr {t.group})
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                Club Name
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={editTeamData.name}
                                                onChange={(e) => setEditTeamData(prev => ({ ...prev, name: e.target.value }))}
                                                className="derby-input"
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                Team Captain Name
                                            </label>
                                            <input
                                                type="text"
                                                value={editTeamData.captain}
                                                onChange={(e) => setEditTeamData(prev => ({ ...prev, captain: e.target.value }))}
                                                placeholder="e.g. Marcus 'Dench' K."
                                                className="derby-input"
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                City / Home Ground
                                            </label>
                                            <input
                                                type="text"
                                                value={editTeamData.city}
                                                onChange={(e) => setEditTeamData(prev => ({ ...prev, city: e.target.value }))}
                                                placeholder="e.g. Cape Town, Johannesburg"
                                                className="derby-input"
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                Team Motto / Slogan
                                            </label>
                                            <input
                                                type="text"
                                                value={editTeamData.slogan}
                                                onChange={(e) => setEditTeamData(prev => ({ ...prev, slogan: e.target.value }))}
                                                placeholder="e.g. Relentless Pace, Pure Passion"
                                                className="derby-input"
                                            />
                                        </div>
                                    </div>

                                    {/* Group & Color */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                Tournament Group
                                            </label>
                                            <select
                                                value={editTeamData.group}
                                                onChange={(e) => setEditTeamData(prev => ({ ...prev, group: e.target.value as 'A' | 'B' }))}
                                                className="derby-input"
                                            >
                                                <option value="A">Group A</option>
                                                <option value="B">Group B</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                                                Club Kit Color Accent
                                            </label>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {COLOR_PRESETS.map(c => (
                                                    <div
                                                        key={c.hex}
                                                        onClick={() => setEditTeamData(prev => ({ ...prev, color: c.hex, secondaryColor: c.hex }))}
                                                        className={`color-swatch ${editTeamData.color === c.hex ? 'active' : ''}`}
                                                        style={{ backgroundColor: c.hex }}
                                                        title={c.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditTeamsOpen(false)}
                                            className="btn btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                        >
                                            <CheckCircle2 size={16} /> Save Club Details
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer Link back to League */}
                <footer style={{
                    marginTop: '4rem',
                    paddingTop: '2rem',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.9rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trophy size={16} color="var(--color-primary)" />
                        <strong style={{ color: 'white' }}>Dench Derby 2026</strong> — Five-A-Side Soccer Platform
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <NavLink to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Home</NavLink>
                        <NavLink to="/standings" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>League Standings</NavLink>
                        <NavLink to="/fixtures" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Fixtures</NavLink>
                        <NavLink to="/teams" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Teams</NavLink>
                    </div>
                    <div>Taking place 28 October 2026</div>
                </footer>

            </main>
        </div>
    );
};
