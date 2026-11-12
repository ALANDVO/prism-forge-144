
// lib/probe.mjs
// Design inspection probes

// Check if element is inside a figcaption
export function isInFigcaption(element) {
  let el = element;
  while (el) {
    if (el.tagName === "FIGCAPTION") return true;
    el = el.parentElement;
  }
  return false;
}

// Check if element is inside a scrolling or clipping container
export function isInScrollingOrClippingContainer(element) {
  let el = element.parentElement;
  const rect = element.getBoundingClientRect();
  
  while (el) {
    const style = getComputedStyle(el);
    const overflow = style.overflow;
    const overflowX = style.overflowX;
    const overflowY = style.overflowY;
    
    const scrolls = 
      (overflow !== "visible" && overflow !== "clip") ||
      (overflowX !== "visible" && overflowX !== "clip") ||
      (overflowY !== "visible" && overflowY !== "clip");
    
    if (scrolls) {
      const elRect = el.getBoundingClientRect();
      const clipped = 
        rect.top < elRect.top ||
        rect.bottom > elRect.bottom ||
        rect.left < elRect.left ||
        rect.right > elRect.right;
      
      if (clipped || el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
        return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

// Check if text looks like a kicker/eyebrow (short, uppercase, above heading)
export function looksLikeKicker(text, fontSize) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 60) return false;
  if (fontSize > 18) return false;
  
  // Check if mostly uppercase (kicker style)
  const letters = trimmed.match(/[A-Za-z]/g);
  if (!letters || letters.length < 2) return false;
  const upperCount = letters.filter(c => c === c.toUpperCase()).length;
  return upperCount / letters.length > 0.7;
}

// Find eyebrow/kicker labels above headings
export function findEyebrows(document) {
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const results = [];
  
  for (const heading of headings) {
    const headingRect = heading.getBoundingClientRect();
    const headingFontSize = parseFloat(getComputedStyle(heading).fontSize);
    
    // Look for text nodes within ~72-140px above the heading
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const candidates = [];
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent) continue;
      
      const text = node.textContent.trim();
      if (!text) continue;
      
      const rect = parent.getBoundingClientRect();
      const style = getComputedStyle(parent);
      const fontSize = parseFloat(style.fontSize);
      
      // Must be above heading
      if (rect.bottom >= headingRect.top) continue;
      
      // Distance check: 72-140px above
      const distance = headingRect.top - rect.bottom;
      if (distance < 72 || distance > 140) continue;
      
      // Font size check
      if (fontSize > 18) continue;
      
      // NEW: Skip if in figcaption
      if (isInFigcaption(parent)) continue;
      
      // NEW: Skip if in scrolling/clipping container
      if (isInScrollingOrClippingContainer(parent)) continue;
      
      // Check if looks like kicker
      if (looksLikeKicker(text, fontSize)) {
        candidates.push({ text, distance, fontSize, element: parent });
      }
    }
    
    if (candidates.length > 0) {
      // Sort by distance (closest first)
      candidates.sort((a, b) => a.distance - b.distance);
      results.push({
        heading: heading.textContent.trim(),
        headingSelector: getSelector(heading),
        eyebrows: candidates.map(c => ({
          text: c.text,
          distance: Math.round(c.distance),
          fontSize: Math.round(c.fontSize),
          selector: getSelector(c.element)
        }))
      });
    }
  }
  
  return results;
}

function getSelector(element) {
  const parts = [];
  let el = element;
  while (el && el !== document.body) {
    let selector = el.tagName.toLowerCase();
    if (el.id) selector += "#" + el.id;
    if (el.className) {
      const classes = el.className.split(/\s+/).filter(c => c);
      if (classes.length) selector += "." + classes.join(".");
    }
    parts.unshift(selector);
    el = el.parentElement;
  }
  return parts.join(" > ").slice(0, 120);
}

