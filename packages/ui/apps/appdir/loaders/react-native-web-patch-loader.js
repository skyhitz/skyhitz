/**
 * A webpack loader that patches react-native-web imports to be compatible with React 18/19
 * by replacing removed API calls with their modern equivalents
 */

module.exports = function(source) {
  // Get the file path from webpack context
  const resourcePath = this.resourcePath;
  
  // Only process react-native-web files
  if (!resourcePath.includes('react-native-web')) {
    return source;
  }
  
  let patchedSource = source;

  // Special case for render/index.js which exports its own hydrate function
  if (resourcePath.includes('render/index.js')) {
    console.log(`Special patching for render/index.js: ${resourcePath}`);
    
    // Just replace the entire file with our fixed implementation
    // This is the most reliable way to fix the module
    return `
// Patched render/index.js for React 19 compatibility
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import { createSheet } from '../StyleSheet/dom';

// Our patched implementation of hydrate for React 19
export function hydrate(element, root) {
  console.log('[Patched] Using hydrateRoot instead of legacy hydrate');
  createSheet(root);
  return ReactDOMClient.hydrateRoot(root, element);
}

// Our patched implementation of render for React 19
export function render(element, root, callback) {
  console.log('[Patched] Using createRoot instead of legacy render');
  createSheet(root);
  const reactRoot = ReactDOMClient.createRoot(root);
  reactRoot.render(element);
  
  if (typeof callback === 'function') {
    callback();
  }
  
  return reactRoot;
}
    `;
  }
  
  // Special case for unmountComponentAtNode/index.js
  if (resourcePath.includes('unmountComponentAtNode/index.js')) {
    console.log(`Special patching for unmountComponentAtNode/index.js: ${resourcePath}`);
    
    // Replace with our implementation
    return `
// Patched unmountComponentAtNode/index.js for React 19 compatibility
import * as ReactDOM from 'react-dom';

// Our patched implementation of unmountComponentAtNode for React 19
function unmountComponentAtNode(container) {
  console.log('[Patched] Using modern approach for unmountComponentAtNode');
  if (!container) return false;
  
  try {
    // Look for React 18+ root identifiers
    const rootKey = Object.keys(container).find(key => 
      key.startsWith('__reactContainer$') || 
      key.startsWith('_reactRootContainer')
    );
    
    if (rootKey) {
      // If we find a root, attempt to unmount it
      if (typeof container[rootKey].unmount === 'function') {
        container[rootKey].unmount();
      }
      delete container[rootKey];
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('[Patched] Error unmounting component:', e);
    return false;
  }
}

export default unmountComponentAtNode;
    `;
  }
  
  // For all other files, we'll patch the react-dom imports
  if (patchedSource.includes("from 'react-dom'") || patchedSource.includes("from \"react-dom\"")) {
    console.log(`Patching react-dom imports in: ${resourcePath.split('/node_modules/').pop()}`);
    
    // Add the React DOM client imports if not already present
    if (!patchedSource.includes("from 'react-dom/client'") && !patchedSource.includes("from \"react-dom/client\"")) {
      patchedSource = `import * as ReactDOMClient from 'react-dom/client';
${patchedSource}`;
    }
    
    // Replace any direct imports of the removed methods
    patchedSource = patchedSource.replace(
      /import\s+\{\s*([^}]*)\}\s+from\s+['|"]react-dom['|"];?/g,
      (match, importedItems) => {
        // Create a new import statement without the removed methods
        const newImports = importedItems
          .split(',')
          .map(item => item.trim())
          .filter(item => {
            return !item.includes('hydrate') && 
                  !item.includes('render') && 
                  !item.includes('unmountComponentAtNode');
          })
          .join(', ');
        
        let result = '';
        
        // Only include the import if there are remaining valid imports
        if (newImports.length > 0) {
          result = `import { ${newImports} } from 'react-dom';
`;
        } else {
          result = `import * as ReactDOM from 'react-dom';
`;
        }
        
        // Add needed variables but don't redeclare them if hydrate/render/unmount are used as exports
        // in the file later on
        if (importedItems.includes('hydrate') && !patchedSource.includes('export function hydrate')) {
          result += `// Patched hydrate implementation for React 19
const hydrate = (element, container, callback) => {
  console.log('[Patched] Using hydrateRoot instead of hydrate');
  const root = ReactDOMClient.hydrateRoot(container, element);
  if (typeof callback === 'function') callback();
  return root;
};
`;
        }
        
        if (importedItems.includes('render') && !patchedSource.includes('export function render')) {
          result += `// Patched render implementation for React 19
const render = (element, container, callback) => {
  console.log('[Patched] Using createRoot instead of render');
  const root = ReactDOMClient.createRoot(container);
  root.render(element);
  if (typeof callback === 'function') callback();
  return root;
};
`;
        }
        
        if (importedItems.includes('unmountComponentAtNode') && 
            !patchedSource.includes('export default unmountComponentAtNode') &&
            !patchedSource.includes('export function unmountComponentAtNode')) {
          result += `// Patched unmountComponentAtNode implementation for React 19
const unmountComponentAtNode = (container) => {
  console.log('[Patched] Using modern approach for unmountComponentAtNode');
  if (!container) return false;
  
  try {
    // Look for React 18+ root identifiers
    const rootKey = Object.keys(container).find(key => 
      key.startsWith('__reactContainer$') || 
      key.startsWith('_reactRootContainer')
    );
    
    if (rootKey) {
      // If we find a root, attempt to unmount it
      if (typeof container[rootKey].unmount === 'function') {
        container[rootKey].unmount();
      }
      delete container[rootKey];
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('[Patched] Error unmounting component:', e);
    return false;
  }
};
`;
        }
        
        return result;
      }
    );
  }
  
  return patchedSource;
};
