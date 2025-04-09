/**
 * This is a patched version of react-dom/client for react-native-web
 * Explicitly exports the client methods needed by react-native-web
 */
import * as ReactDOMClient from 'react-dom/client';

// Export all client exports
export * from 'react-dom/client';

// Make sure the specific exports needed by react-native-web are available
export const createRoot = ReactDOMClient.createRoot;
export const hydrateRoot = ReactDOMClient.hydrateRoot;

// Default export for CommonJS compatibility
export default ReactDOMClient;
