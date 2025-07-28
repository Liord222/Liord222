/**
 * Chrome Extension Link Extractor
 * Scans visible content of the current tab and extracts all valid URLs
 */

/**
 * Extracts all unique URLs from the visible content of the current page
 * @returns {Promise<string[]>} Array of unique URLs found on the page
 */
async function extractLinksFromCurrentTab() {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }

    // Inject content script to extract links from the page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractVisibleLinks
    });

    return results[0].result || [];
  } catch (error) {
    console.error('Error extracting links:', error);
    return [];
  }
}

/**
 * Content script function that runs in the context of the web page
 * Extracts all visible URLs from the page content
 * @returns {string[]} Array of unique URLs
 */
function extractVisibleLinks() {
  // Performance-optimized URL regex pattern
  // Matches http, https, ftp protocols and common URL patterns
  const urlRegex = /(?:https?|ftp):\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w/_.])*)?(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?/gi;
  
  // Secondary regex for relative URLs and other patterns
  const relativeUrlRegex = /(?:www\.[-\w.]+\.(?:[a-z]{2,}))(?:\/(?:[\w/_.])*)?(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?/gi;
  
  // Use Set for automatic deduplication
  const uniqueUrls = new Set();
  
  // Get all visible text content efficiently
  const textContent = document.body.innerText || document.body.textContent || '';
  
  // Extract URLs from text content
  const textUrls = textContent.match(urlRegex) || [];
  textUrls.forEach(url => uniqueUrls.add(url.trim()));
  
  // Extract relative URLs and add protocol
  const relativeUrls = textContent.match(relativeUrlRegex) || [];
  relativeUrls.forEach(url => {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) {
      uniqueUrls.add('https://' + cleanUrl);
    }
  });
  
  // Extract URLs from link elements (href attributes)
  const linkElements = document.querySelectorAll('a[href]');
  linkElements.forEach(link => {
    const href = link.href;
    if (href && (href.startsWith('http') || href.startsWith('ftp'))) {
      // Only include if the link is visible
      const rect = link.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && 
                       window.getComputedStyle(link).visibility !== 'hidden' &&
                       window.getComputedStyle(link).display !== 'none';
      
      if (isVisible) {
        uniqueUrls.add(href);
      }
    }
  });
  
  // Extract URLs from image sources
  const imageElements = document.querySelectorAll('img[src]');
  imageElements.forEach(img => {
    const src = img.src;
    if (src && (src.startsWith('http') || src.startsWith('ftp'))) {
      const rect = img.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && 
                       window.getComputedStyle(img).visibility !== 'hidden' &&
                       window.getComputedStyle(img).display !== 'none';
      
      if (isVisible) {
        uniqueUrls.add(src);
      }
    }
  });
  
  // Extract URLs from other media elements
  const mediaElements = document.querySelectorAll('video[src], audio[src], source[src]');
  mediaElements.forEach(media => {
    const src = media.src;
    if (src && (src.startsWith('http') || src.startsWith('ftp'))) {
      uniqueUrls.add(src);
    }
  });
  
  // Convert Set to Array and filter out invalid URLs
  const urlArray = Array.from(uniqueUrls).filter(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
  
  // Sort URLs for consistent output
  return urlArray.sort();
}

/**
 * Alternative function that can be called directly from content script context
 * Use this if you want to inject the script directly into the page
 * @returns {string[]} Array of unique URLs
 */
function extractLinksFromCurrentPage() {
  return extractVisibleLinks();
}

/**
 * Utility function to validate if a string is a valid URL
 * @param {string} string - String to validate
 * @returns {boolean} True if valid URL, false otherwise
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Filter URLs by domain
 * @param {string[]} urls - Array of URLs to filter
 * @param {string} domain - Domain to filter by
 * @returns {string[]} Filtered URLs
 */
function filterUrlsByDomain(urls, domain) {
  return urls.filter(url => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes(domain);
    } catch {
      return false;
    }
  });
}

/**
 * Export functions for module usage
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractLinksFromCurrentTab,
    extractVisibleLinks,
    extractLinksFromCurrentPage,
    isValidUrl,
    filterUrlsByDomain
  };
}