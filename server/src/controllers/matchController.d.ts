import { Request, Response } from 'express';
export declare const createMatch: (req: Request, res: Response) => Promise<void>;
export declare const updateMatchScore: (req: Request, res: Response) => Promise<void>;
export declare const addPlayerToRoster: (req: Request, res: Response) => Promise<void>;
export declare const getMatches: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=matchController.d.ts.map