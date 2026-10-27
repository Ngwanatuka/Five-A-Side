import { Request, Response } from 'express';
/**
 * Standard Email/Password login (Admin, Referee, Cashier)
 */
export declare const login: (req: Request, res: Response) => Promise<void>;
/**
 * Captain PIN login
 * Captians only admin can assign PINs, and captains can log in with their Team + PIN
 */
export declare const captainLogin: (req: Request, res: Response) => Promise<void>;
/**
 * Public listing of team captains (without PINs)
 * Captain name is sourced from the designated captain (or first player) in each team's squad roster.
 */
export declare const getCaptainsList: (_req: Request, res: Response) => Promise<void>;
/**
 * Deadline status (28 Oct 18:30)
 */
export declare const getDeadline: (_req: Request, res: Response) => Promise<void>;
/**
 * Admin: Get all captains including PINs
 */
export declare const getAdminCaptainsList: (_req: Request, res: Response) => Promise<void>;
/**
 * Admin: Update captain name, email, or PIN for a team
 */
export declare const updateCaptainByAdmin: (req: Request, res: Response) => Promise<void>;
/**
 * Admin: Update deadline if requested
 */
export declare const updateDeadlineByAdmin: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map