// Figma plugin sandbox — text scan & replace
// Workflow: Export texts.json -> translate via Claude -> Import translations.json

figma.showUI(__html__, { width: 380, height: 540 });

const HANGUL_RE = /[ᄀ-ᇿ㄰-㆏가-힯]/;
const NUMERIC_ONLY_RE = /^[\d\s.,%$€¥₩+\-:/()×x*]+$/;

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'export') {
      await handleExport();
    } else if (msg.type === 'import') {
      await handleImport(msg.data);
    } else if (msg.type === 'cancel') {
      figma.closePlugin();
    }
  } catch (err) {
    figma.ui.postMessage({ type: 'error', message: String(err && err.stack || err) });
  }
};

async function handleExport() {
  postProgress('Loading all pages...');
  if (figma.loadAllPagesAsync) {
    await figma.loadAllPagesAsync();
  }

  const texts = [];
  const skipped = [];
  let scanned = 0;

  const pages = figma.root.children;
  for (let p = 0; p < pages.length; p++) {
    const page = pages[p];
    postProgress(`Scanning page ${p + 1}/${pages.length}: ${page.name}`);

    const nodes = page.findAllWithCriteria
      ? page.findAllWithCriteria({ types: ['TEXT'] })
      : page.findAll((n) => n.type === 'TEXT');

    for (const node of nodes) {
      scanned++;
      const text = node.characters;

      if (!text || !text.trim()) {
        skipped.push({ id: node.id, reason: 'empty', text });
        continue;
      }
      if (NUMERIC_ONLY_RE.test(text)) {
        skipped.push({ id: node.id, reason: 'numeric-only', text: truncate(text, 60) });
        continue;
      }
      if (!HANGUL_RE.test(text)) {
        skipped.push({ id: node.id, reason: 'no-korean', text: truncate(text, 60) });
        continue;
      }

      const fontInfo = readFontInfo(node);
      const frame = nearestFrameName(node);

      texts.push({
        id: node.id,
        text,
        page: page.name,
        frame,
        fontFamily: fontInfo.family,
        fontStyle: fontInfo.style,
        hasMixedStyles: fontInfo.mixed,
        textAutoResize: node.textAutoResize,
      });
    }
  }

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    fileName: figma.root.name,
    stats: {
      totalScanned: scanned,
      exported: texts.length,
      skipped: skipped.length,
      skippedReasons: countBy(skipped, 'reason'),
    },
    skippedSample: skipped.slice(0, 30),
    texts,
  };

  figma.ui.postMessage({
    type: 'export-done',
    payload,
    suggestedFilename: `texts-${slugify(figma.root.name)}-${timestamp()}.json`,
  });
}

const AUTO_SHRINK_TO_FIT = true;
const MIN_FONT_SIZE = 10;
const SHRINK_HEADROOM = 0.97;

const PRETENDARD_WEIGHTS = ['Thin', 'ExtraLight', 'Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black'];
const STYLE_TO_PRETENDARD = {
  'Thin': 'Thin',
  'ExtraLight': 'ExtraLight', 'UltraLight': 'ExtraLight',
  'Light': 'Light',
  'Regular': 'Regular', 'Normal': 'Regular', 'Book': 'Regular',
  'Medium': 'Medium',
  'SemiBold': 'SemiBold', 'Semibold': 'SemiBold', 'DemiBold': 'SemiBold', 'Demibold': 'SemiBold',
  'Bold': 'Bold',
  'ExtraBold': 'ExtraBold', 'UltraBold': 'ExtraBold',
  'Black': 'Black', 'Heavy': 'Black',
};

async function handleImport(translationsJson) {
  if (!translationsJson || typeof translationsJson !== 'object') {
    figma.ui.postMessage({ type: 'error', message: 'Invalid translations file.' });
    return;
  }
  const translations = translationsJson.translations || {};
  const ids = Object.keys(translations);
  if (ids.length === 0) {
    figma.ui.postMessage({ type: 'error', message: 'No translations found in the file.' });
    return;
  }

  postProgress(`Resolving ${ids.length} nodes...`);
  const targets = [];
  const notFound = [];
  for (const id of ids) {
    const node = await figma.getNodeByIdAsync(id);
    if (!node || node.type !== 'TEXT') {
      notFound.push(id);
      continue;
    }
    targets.push(node);
  }

  postProgress('Loading Pretendard fallback weights...');
  const loadedPretendard = new Map();
  for (const style of PRETENDARD_WEIGHTS) {
    try {
      await figma.loadFontAsync({ family: 'Pretendard', style });
      loadedPretendard.set(style, { family: 'Pretendard', style });
    } catch (_) {}
  }
  let interRegular = null;
  try {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    interRegular = { family: 'Inter', style: 'Regular' };
  } catch (_) {}
  if (loadedPretendard.size === 0 && !interRegular) {
    figma.ui.postMessage({
      type: 'error',
      message: 'No fallback font available. Install Pretendard (https://github.com/orioncactus/pretendard) or Inter, then retry.',
    });
    return;
  }

  postProgress('Probing original fonts...');
  const fontKeys = new Set();
  for (const node of targets) {
    const len = node.characters.length;
    if (len === 0) continue;
    const fn = node.getRangeFontName(0, len);
    if (fn === figma.mixed) {
      const f0 = node.getRangeFontName(0, 1);
      if (f0 !== figma.mixed) fontKeys.add(JSON.stringify(f0));
    } else {
      fontKeys.add(JSON.stringify(fn));
    }
  }

  const resolution = new Map();
  const missingFontSubs = [];
  const missingFontUnresolved = [];
  for (const k of fontKeys) {
    const fn = JSON.parse(k);
    const cacheKey = fn.family + '::' + fn.style;
    try {
      await figma.loadFontAsync(fn);
      resolution.set(cacheKey, { font: fn, isFallback: false });
    } catch (_) {
      const mapped = STYLE_TO_PRETENDARD[fn.style] || 'Regular';
      const fb = loadedPretendard.get(mapped) || loadedPretendard.get('Regular') || interRegular;
      if (fb) {
        resolution.set(cacheKey, { font: fb, isFallback: true });
        missingFontSubs.push({ from: fn.family + ' ' + fn.style, to: fb.family + ' ' + fb.style });
      } else {
        missingFontUnresolved.push(fn.family + ' ' + fn.style);
      }
    }
  }

  const report = {
    total: ids.length,
    success: 0,
    notFound,
    missingFontSubs,
    missingFontUnresolved,
    overflowWarnings: [],
    mixedStyleWarnings: [],
    replaceErrors: [],
  };

  let i = 0;
  for (const node of targets) {
    i++;
    if (i % 25 === 0) postProgress('Replacing ' + i + '/' + targets.length + '...');

    const newText = translations[node.id];
    if (typeof newText !== 'string') continue;

    const oldLen = node.characters.length;
    let mixed = false;
    let firstFont = null;

    if (oldLen > 0) {
      const fn = node.getRangeFontName(0, oldLen);
      if (fn === figma.mixed) {
        mixed = true;
        const f0 = node.getRangeFontName(0, 1);
        if (f0 !== figma.mixed) firstFont = f0;
        report.mixedStyleWarnings.push({
          id: node.id,
          name: node.name,
          page: nearestPageName(node),
        });
      } else {
        firstFont = fn;
      }
    }

    let resolved = null;
    if (firstFont) {
      resolved = resolution.get(firstFont.family + '::' + firstFont.style);
    }
    if (!resolved) {
      // empty node or unresolved font — try Pretendard Regular as last resort
      const last = loadedPretendard.get('Regular') || interRegular;
      if (last) resolved = { font: last, isFallback: true };
    }

    if (!resolved) {
      report.replaceErrors.push({ id: node.id, name: node.name, error: 'No usable font' });
      continue;
    }

    let lastError = null;
    let strategy = null;

    // Strategy 1: original font already loaded
    if (!resolved.isFallback) {
      try {
        node.characters = newText;
        if (mixed) node.setRangeFontName(0, newText.length, resolved.font);
        strategy = 'original';
      } catch (e) {
        lastError = e;
      }
    }

    // Strategy 2: swap to fallback via fontName=
    if (!strategy) {
      try {
        node.fontName = resolved.font;
        node.characters = newText;
        strategy = 'fontName-swap';
      } catch (e) {
        lastError = e;
      }
    }

    // Strategy 3: setRangeFontName over the existing range, then set characters
    if (!strategy && oldLen > 0) {
      try {
        node.setRangeFontName(0, oldLen, resolved.font);
        node.characters = newText;
        strategy = 'setRange-swap';
      } catch (e) {
        lastError = e;
      }
    }

    if (!strategy) {
      report.replaceErrors.push({
        id: node.id,
        name: node.name,
        font: firstFont ? (firstFont.family + ' ' + firstFont.style) : '(unknown)',
        error: String(lastError && (lastError.message || lastError)),
      });
      continue;
    }

    if (AUTO_SHRINK_TO_FIT && oldLen > 0) {
      const shrinkInfo = fitFontIfOverflow(node);
      if (shrinkInfo) {
        report.shrunk = report.shrunk || [];
        report.shrunk.push({
          id: node.id,
          name: node.name,
          from: shrinkInfo.from,
          to: shrinkInfo.to,
        });
      }
    } else if (node.textAutoResize === 'NONE' && oldLen > 0 && newText.length > oldLen * 1.4) {
      report.overflowWarnings.push({
        id: node.id,
        name: node.name,
        page: nearestPageName(node),
        oldLen,
        newLen: newText.length,
      });
    }
    report.success++;
  }

  figma.ui.postMessage({ type: 'import-done', report });
}

function getRepresentativeFontSize(node) {
  const len = Math.max(1, node.characters.length);
  const fs = node.getRangeFontSize(0, len);
  if (fs === figma.mixed) {
    const f0 = node.getRangeFontSize(0, 1);
    return f0 === figma.mixed ? 14 : f0;
  }
  return fs;
}

function isFrameLike(n) {
  if (!n) return false;
  const t = n.type;
  return t === 'FRAME' || t === 'COMPONENT' || t === 'INSTANCE' || t === 'COMPONENT_SET' || t === 'SECTION';
}

function getAncestorWidthInfo(node) {
  // Walk up; find the smallest fixed-width budget. Also collect FIXED-width autolayout
  // frames between the text and the budget source (we'll shrink those to the budget so
  // the text's wrap actually becomes visible, instead of being obscured by an oversized parent).
  let budget = null;
  let budgetSource = null;
  const fixedAutolayoutChain = []; // intermediate FIXED-width autolayout frames, near→far order
  let parent = node.parent;
  while (isFrameLike(parent) && typeof parent.width === 'number') {
    const layoutMode = parent.layoutMode || 'NONE';
    const padL = parent.paddingLeft || 0;
    const padR = parent.paddingRight || 0;

    let widthIsFixed = false;
    if (layoutMode === 'HORIZONTAL') widthIsFixed = parent.primaryAxisSizingMode === 'FIXED';
    else if (layoutMode === 'VERTICAL') widthIsFixed = parent.counterAxisSizingMode === 'FIXED';
    else widthIsFixed = true; // non-autolayout frames have fixed width

    if (widthIsFixed) {
      const parentBudget = parent.width - padL - padR;
      if (parentBudget > 0 && (budget === null || parentBudget < budget)) {
        budget = parentBudget;
        budgetSource = parent;
      }
      if (layoutMode === 'HORIZONTAL' || layoutMode === 'VERTICAL') {
        fixedAutolayoutChain.push(parent);
      }
    }
    parent = parent.parent;
  }
  // Trim fixedAutolayoutChain to only frames between node and budgetSource (exclusive of source)
  const intermediateFixed = [];
  for (const f of fixedAutolayoutChain) {
    if (f === budgetSource) break;
    intermediateFixed.push(f);
  }
  return { budget, budgetSource, intermediateFixed };
}

function fitHugTextToParent(node) {
  const naturalW = node.width;
  const { budget, intermediateFixed } = getAncestorWidthInfo(node);
  if (budget == null || budget <= 0) return null;
  if (naturalW <= budget) return null;

  const originalSize = getRepresentativeFontSize(node);
  const idealSize = originalSize * (budget / naturalW) * SHRINK_HEADROOM;
  let newSize = Math.max(MIN_FONT_SIZE, idealSize);
  newSize = Math.floor(newSize * 2) / 2;

  const widthRatioAtNewSize = (naturalW * (newSize / originalSize)) / budget;
  const stillTooWide = widthRatioAtNewSize > 1.001;
  let expandedToWrap = false;

  if (stillTooWide) {
    try {
      node.textAutoResize = 'HEIGHT';
      node.resize(budget, node.height);
      expandedToWrap = true;
    } catch (_) {}
  }

  // Shrink any oversized FIXED-width autolayout ancestors so the budget-source actually
  // contains the wrapped/shrunk text instead of being occluded by an inner over-wide frame.
  for (const frame of intermediateFixed) {
    if (frame.width > budget) {
      try { frame.resize(budget, frame.height); } catch (_) {}
    }
  }

  if (newSize < originalSize) {
    try {
      node.setRangeFontSize(0, node.characters.length, newSize);
      return { from: originalSize, to: newSize, expandedToWrap };
    } catch (_) {
      return null;
    }
  }
  return expandedToWrap ? { from: originalSize, to: originalSize, expandedToWrap: true } : null;
}

function fitFontIfOverflow(node) {
  const mode = node.textAutoResize;
  if (mode === 'WIDTH_AND_HEIGHT') return fitHugTextToParent(node);

  const fixedW = node.width;
  const fixedH = node.height;
  const originalSize = getRepresentativeFontSize(node);

  // Measure natural (single-line) size by temporarily allowing the node to expand
  let naturalW, naturalH;
  try {
    node.textAutoResize = 'WIDTH_AND_HEIGHT';
    naturalW = node.width;
    naturalH = node.height;
  } finally {
    node.textAutoResize = mode;
    try { node.resize(fixedW, mode === 'NONE' ? fixedH : node.height); } catch (_) {}
  }

  let shrink = 1;
  if (naturalW > fixedW) shrink = Math.min(shrink, fixedW / naturalW);
  if (mode === 'NONE' && naturalH > fixedH) shrink = Math.min(shrink, fixedH / naturalH);
  if (shrink >= 1) return null;

  shrink *= SHRINK_HEADROOM;
  const idealSize = originalSize * shrink;
  let newSize = Math.max(MIN_FONT_SIZE, idealSize);
  newSize = Math.floor(newSize * 2) / 2; // round to half-pt

  // Detect: even at MIN_FONT_SIZE, text would still be wider than the box.
  // In that case allow the node to grow vertically so the full text wraps and stays visible.
  const widthRatioAtNewSize = (naturalW * (newSize / originalSize)) / fixedW;
  const stillTooWide = widthRatioAtNewSize > 1.001;
  let expandedToWrap = false;

  if (stillTooWide) {
    try {
      node.textAutoResize = 'HEIGHT';
      expandedToWrap = true;
    } catch (_) {}
  }

  if (newSize < originalSize) {
    try {
      node.setRangeFontSize(0, node.characters.length, newSize);
      return { from: originalSize, to: newSize, expandedToWrap };
    } catch (_) {
      return null;
    }
  }
  return expandedToWrap ? { from: originalSize, to: originalSize, expandedToWrap: true } : null;
}

function readFontInfo(node) {
  const len = node.characters.length;
  if (len === 0) return { family: '', style: '', mixed: false };
  const fn = node.getRangeFontName(0, len);
  if (fn === figma.mixed) {
    const first = node.getRangeFontName(0, 1);
    if (first === figma.mixed) return { family: '', style: '', mixed: true };
    return { family: first.family, style: first.style, mixed: true };
  }
  return { family: fn.family, style: fn.style, mixed: false };
}

function nearestFrameName(node) {
  let n = node.parent;
  while (n && n.type !== 'PAGE' && n.type !== 'DOCUMENT') {
    if (n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'COMPONENT_SET' || n.type === 'SECTION') {
      return n.name;
    }
    n = n.parent;
  }
  return '';
}

function nearestPageName(node) {
  let n = node;
  while (n && n.type !== 'PAGE') n = n.parent;
  return n ? n.name : '';
}

function postProgress(message) {
  figma.ui.postMessage({ type: 'progress', message });
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function countBy(arr, key) {
  const out = {};
  for (const item of arr) {
    const k = item[key];
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function slugify(s) {
  return (s || 'untitled')
    .toLowerCase()
    .replace(/[^\w가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'untitled';
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
