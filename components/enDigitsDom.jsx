// Optimized DOM observer for converting digits in text nodes
import { toEnDigits } from './enDigits.js';

let observer = null;
let isProcessing = false;
const processedNodes = new WeakSet();

// Throttle function to prevent excessive processing
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

const shouldSkip = (node) => {
  if (!(node instanceof Element)) return false;
  const tag = node.tagName;
  return (
    tag === 'SCRIPT' || 
    tag === 'STYLE' || 
    tag === 'CODE' ||
    node.hasAttribute('contenteditable') ||
    node.hasAttribute('data-keep-digits') ||
    node.matches('input, textarea, [contenteditable], [data-keep-digits]')
  );
};

const convertTextNodes = (root) => {
  if (!root || isProcessing || processedNodes.has(root)) return;
  
  isProcessing = true;
  processedNodes.add(root);

  try {
    const walker = document.createTreeWalker(
      root, 
      NodeFilter.SHOW_TEXT, 
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent || shouldSkip(parent) || processedNodes.has(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          // Only process nodes that contain Arabic or Persian digits
          return /[٠-٩۰-۹]/.test(node.nodeValue || '') 
            ? NodeFilter.FILTER_ACCEPT 
            : NodeFilter.FILTER_SKIP;
        }
      }
    );

    const toChange = [];
    let node;
    let count = 0;
    
    while ((node = walker.nextNode()) && count < 50) { // Limit processing
      if (!processedNodes.has(node)) {
        toChange.push(node);
        processedNodes.add(node);
        count++;
      }
    }

    // Convert collected text nodes
    for (const textNode of toChange) {
      if (textNode.nodeValue && textNode.parentElement) {
        try {
          textNode.nodeValue = toEnDigits(textNode.nodeValue);
        } catch (e) {
          console.warn('Error converting text node:', e);
        }
      }
    }
  } catch (error) {
    console.warn('Error in convertTextNodes:', error);
  } finally {
    isProcessing = false;
  }
};

// Throttled conversion function
const throttledConvert = throttle(convertTextNodes, 500);

export const startEnDigitsObserver = () => {
  if (typeof window === 'undefined' || observer) return;

  // Initial conversion with delay
  setTimeout(() => {
    if (document.body) {
      convertTextNodes(document.body);
    }
  }, 1000);

  // Simplified mutation observer
  observer = new MutationObserver((mutations) => {
    if (isProcessing) return;
    
    const nodesToProcess = new Set();
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && !processedNodes.has(node)) {
            nodesToProcess.add(node);
          }
        }
      }
    }

    if (nodesToProcess.size > 0) {
      nodesToProcess.forEach(node => throttledConvert(node));
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('✅ Optimized English digits observer started');
};

export const stopEnDigitsObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
    isProcessing = false;
    console.log('🛑 English digits observer stopped');
  }
};