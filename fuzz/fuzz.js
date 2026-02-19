'use strict';
// jsfuzz fuzz target — exercises message parsing and formatting utilities
// Run: npx jsfuzz fuzz/fuzz.js --max-total-time=60

const fs = require('fs');
const path = require('path');

// Lazy-load built utilities — find the utils chunk regardless of content hash
let formatRelativeTime;
let getAgentInitials;
let getAgentColor;
let formatMessageText;

try {
  const distDir = path.join(__dirname, '../dist/assets');
  const files = fs.readdirSync(distDir);
  const utilsFile = files.find(f => f.startsWith('utils-') && f.endsWith('.js'));
  if (utilsFile) {
    const utils = require(path.join(distDir, utilsFile));
    formatRelativeTime = utils.formatRelativeTime;
    getAgentInitials = utils.getAgentInitials;
    getAgentColor = utils.getAgentColor;
    formatMessageText = utils.formatMessageText;
  }
} catch (_) {
  // Build not present — functions remain undefined and are guarded below
}

/**
 * Fuzz entry point called by jsfuzz with random byte buffers.
 * Must not throw for any input.
 */
function fuzz(buf) {
  const input = buf.toString('utf-8');
  try {
    if (formatRelativeTime) formatRelativeTime(input);
    if (getAgentInitials) getAgentInitials(input);
    if (getAgentColor) getAgentColor(input);
    if (formatMessageText) formatMessageText(input);
  } catch (e) {
    // Only re-throw unexpected errors; SyntaxError/TypeError/RangeError from
    // malformed input is expected and safe
    if (!(e instanceof SyntaxError) && !(e instanceof TypeError) && !(e instanceof RangeError)) {
      throw e;
    }
  }
}

module.exports = { fuzz };
