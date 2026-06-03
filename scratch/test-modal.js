
const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
  const pages = await browser.pages();
  const page = pages.find(p => p.url().includes('index.html'));
  
  if (!page) {
    console.error('Page not found');
    process.exit(1);
  }
  
  // Wait for opportunities to load
  await new Promise(r => setTimeout(r, 2000));
  
  // Call openDetails
  await page.evaluate(() => {
    const oppId = currentConfig.opportunities[0]['Opportunity ID'];
    window.openDetails(oppId);
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  // Check CSS properties of the modal
  const modalInfo = await page.evaluate(() => {
    const modal = document.getElementById('details-modal');
    const style = window.getComputedStyle(modal);
    return {
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      zIndex: style.zIndex,
      top: style.top,
      left: style.left,
      width: style.width,
      height: style.height,
      classList: Array.from(modal.classList)
    };
  });
  
  console.log('Modal properties after openDetails:', JSON.stringify(modalInfo, null, 2));
  
  // Look for any parent that might clip or hide it
  const parentInfo = await page.evaluate(() => {
    let p = document.getElementById('details-modal').parentElement;
    let parents = [];
    while(p) {
      const style = window.getComputedStyle(p);
      parents.push({
        id: p.id || p.tagName,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        zIndex: style.zIndex,
        overflow: style.overflow,
        transform: style.transform
      });
      p = p.parentElement;
    }
    return parents;
  });
  
  console.log('Parents:', JSON.stringify(parentInfo, null, 2));
  process.exit(0);
})();

