/**
 * Shared Express Request type extension
 * Single source of truth for the user property on Express requests
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role?: string;
                firstName?: string;
                lastName?: string;
            };
        }
    }
}

export { };
