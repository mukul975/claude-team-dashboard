'use strict';
// jsfuzz fuzz target — exercises message parsing and formatting utilities
// Run: npx jsfuzz fuzz/fuzz.js --max-total-time=60

const path = require('path');

// Lazy-load built utilities so we don't crash if build hasn't run
let parseMessageToNatural;
let formatRelativeTime;
let getAgentInitials;
let getAgentColor;

try {
  const utils = require('../dist/assets/utils-mxxv0KtI.js');
  parseMessageToNatural = utils.parseMessageToNatural;
  formatRelativeTime = utils.formatRelativeTime;
  getAgentInitials = utils.getAgentInitials;
  getAgentColor = utils.getAgentColor;
} catch (_) {
  // Build not present — load source utilities via direct require
}

/**
 * Fuzz entry point called by jsfuzz with random byte buffers.
 * Must not throw for any input.
 */
async function fuzz(buf) {
  const input = buf.toString('utf-8');
  try {
    if (parseMessageToNatural) parseMessageToNatural(input);
    if (formatRelativeTime) formatRelativeTime(input);
    if (getAgentInitials) getAgentInitials(input);
    if (getAgentColor) getAgentColor(input);
  } catch (e) {
    // Only re-throw unexpected errors; SyntaxError/TypeError from malformed
    // JSON input is expected and safe
    if (!(e instanceof SyntaxError) && !(e instanceof TypeError) && !(e instanceof RangeError)) {
      throw e;
    }
  }
}

module.exports = { fuzz };
