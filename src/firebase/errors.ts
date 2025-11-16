// Defines a custom error type for Firestore permission issues.
// This allows us to create rich, contextual errors that include
// details about the failed request, which is invaluable for debugging Security Rules.

export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    requestResourceData?: any;
};

// A custom error class to provide detailed context for Firestore Security Rule failures.
// The Next.js development overlay will automatically pick up the 'cause' property
// and display it, giving us a clear view of the denied request.
export class FirestorePermissionError extends Error {
    cause: SecurityRuleContext;

    constructor(context: SecurityRuleContext) {
        const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:`;
        super(message);
        this.name = 'FirestorePermissionError';
        this.cause = context;

        // This is necessary to make 'instanceof' work correctly with custom errors in TypeScript.
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
