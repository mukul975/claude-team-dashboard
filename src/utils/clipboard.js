export async function copyToClipboard(text) {
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to copy:', err);
    return false;
  }
}

