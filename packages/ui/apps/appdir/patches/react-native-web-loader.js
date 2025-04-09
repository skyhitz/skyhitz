/**
 * This loader transforms react-native-web imports to be compatible with React 19.
 * Enhanced for better React 19 compatibility.
 */
module.exports = function (source) {
  console.log('Processing with react-native-web-loader');
  
  // Check for any direct react-dom imports and redirect them to our shim
  if (source.includes("from 'react-dom'") || source.includes('require("react-dom")') || source.includes("require('react-dom')")) {
    console.log('Patching react-dom imports');
    // Replace direct imports with our shim path
    source = source
      .replace(/from ['"]react-dom['"]/, "from '../../../shims/react-dom.js'")
      .replace(/require\(['"]react-dom['"]\)/, "require('../../../shims/react-dom.js')");
  }
  
  // Check if this is the render/index.js file with hydrate import
  if (source.includes("import { hydrate as domLegacyHydrate }")) {
    console.log('Patching hydrate import');
    source = source.replace(
      "import { hydrate as domLegacyHydrate } from 'react-dom';",
      `// Patched for React 19 compatibility
import * as ReactDOM from '../../../shims/react-dom.js';
import * as ReactDOMClient from 'react-dom/client';

const domLegacyHydrate = function domLegacyHydrate(element, container, callback) {
  console.log('Using patched hydrate');
  try {
    // For React 19 compatibility
    const root = ReactDOMClient.hydrateRoot(container, element);
    if (typeof callback === 'function') callback();
    return root;
  } catch (e) {
    console.error('Error during hydration, falling back to render:', e);
    // Fallback to render if hydrate fails
    const root = ReactDOMClient.createRoot(container);
    root.render(element);
    if (typeof callback === 'function') callback();
    return root;
  }
};`
    );
  }
  
  // Check if this is the unmountComponentAtNode/index.js file
  if (source.includes("import unmountComponentAtNode from 'react-dom';") || 
      source.includes("import { unmountComponentAtNode } from 'react-dom';")) {
    console.log('Patching unmountComponentAtNode import');
    source = source.replace(
      /import .*unmountComponentAtNode.*? from 'react-dom';/,
      `// Patched for React 19 compatibility
import * as ReactDOM from '../../../shims/react-dom.js';
import * as ReactDOMClient from 'react-dom/client';

const unmountComponentAtNode = function unmountComponentAtNode(container) {
  console.log('Using patched unmountComponentAtNode');
  try {
    // Safety check for null/undefined container
    if (!container) return false;
    
    // For React 19 compatibility - check for modern root format
    const rootKey = Object.keys(container).find(key => key.startsWith('__reactContainer$'));
    if (rootKey && container[rootKey]) {
      const root = container[rootKey];
      root.unmount();
      return true;
    }
    
    // Legacy container format
    if (container._reactRootContainer) {
      const root = ReactDOMClient.createRoot(container);
      root.unmount();
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error unmounting component:', e);
    return false;
  }
};`
    );
  }
  
  // Check for direct render imports
  if (source.includes("import { render }") || source.includes("import render from")) {
    console.log('Patching render import');
    source = source.replace(
      /import .*render.*? from 'react-dom';/,
      `// Patched for React 19 compatibility
import * as ReactDOM from '../../../shims/react-dom.js';
import * as ReactDOMClient from 'react-dom/client';

const render = function render(element, container, callback) {
  console.log('Using patched render');
  const root = ReactDOMClient.createRoot(container);
  root.render(element);
  if (typeof callback === 'function') callback();
  return root;
};`
    );
  }
  
  return source;
};
