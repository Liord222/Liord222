/**
 * Example usage of the Link Extractor functions
 * This file demonstrates how to use the link extraction functionality
 * in different Chrome Extension contexts
 */

// Example 1: Using from background script or popup
async function backgroundScriptExample() {
  try {
    console.log('Extracting links from current tab...');
    const links = await extractLinksFromCurrentTab();
    
    console.log(`Found ${links.length} unique URLs:`);
    links.forEach((link, index) => {
      console.log(`${index + 1}. ${link}`);
    });
    
    return links;
  } catch (error) {
    console.error('Failed to extract links:', error);
    return [];
  }
}

// Example 2: Using from content script context
function contentScriptExample() {
  // This runs directly in the page context
  const links = extractLinksFromCurrentPage();
  
  console.log(`Extracted ${links.length} links from current page`);
  
  // Send results to background script or popup
  chrome.runtime.sendMessage({
    action: 'linksExtracted',
    links: links,
    count: links.length
  });
  
  return links;
}

// Example 3: Filter links by domain
async function filterByDomainExample() {
  const allLinks = await extractLinksFromCurrentTab();
  
  // Filter for specific domains
  const githubLinks = filterUrlsByDomain(allLinks, 'github.com');
  const googleLinks = filterUrlsByDomain(allLinks, 'google.com');
  
  console.log('GitHub links:', githubLinks);
  console.log('Google links:', googleLinks);
  
  return {
    all: allLinks,
    github: githubLinks,
    google: googleLinks
  };
}

// Example 4: Popup script usage
document.addEventListener('DOMContentLoaded', async function() {
  const extractButton = document.getElementById('extract-links');
  const resultsDiv = document.getElementById('results');
  
  if (extractButton) {
    extractButton.addEventListener('click', async function() {
      try {
        extractButton.textContent = 'Extracting...';
        extractButton.disabled = true;
        
        const links = await extractLinksFromCurrentTab();
        
        if (links.length === 0) {
          resultsDiv.innerHTML = '<p>No links found on this page.</p>';
        } else {
          const linksList = links.map(link => 
            `<li><a href="${link}" target="_blank">${link}</a></li>`
          ).join('');
          
          resultsDiv.innerHTML = `
            <h3>Found ${links.length} links:</h3>
            <ul>${linksList}</ul>
          `;
        }
      } catch (error) {
        resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
      } finally {
        extractButton.textContent = 'Extract Links';
        extractButton.disabled = false;
      }
    });
  }
});

// Example 5: Message listener for communication between scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractLinks') {
    extractLinksFromCurrentTab()
      .then(links => {
        sendResponse({ success: true, links: links });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate async response
    return true;
  }
});

// Example 6: Performance monitoring
async function performanceExample() {
  const startTime = performance.now();
  
  const links = await extractLinksFromCurrentTab();
  
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  console.log(`Link extraction completed in ${executionTime.toFixed(2)}ms`);
  console.log(`Found ${links.length} unique URLs`);
  console.log(`Average time per link: ${(executionTime / links.length).toFixed(2)}ms`);
  
  return {
    links: links,
    executionTime: executionTime,
    linkCount: links.length
  };
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    backgroundScriptExample,
    contentScriptExample,
    filterByDomainExample,
    performanceExample
  };
}