// Resolves an image URL coming from the API/DB into something the browser
// can actually load, in both local dev and production.
//
// Why this exists: when Cloudinary isn't configured/working, the backend
// falls back to serving files from its own /uploads folder. Images uploaded
// that way are stored with an absolute host baked in (historically
// "http://localhost:5000/..." — see server/src/utils/cloudinaryUpload.js).
// That's fine on a developer's own machine, but it is wrong for anyone else:
// a real user's browser has nothing listening on ITS OWN localhost:5000, so
// the request fails with ERR_CONNECTION_REFUSED. It's also wrong if the
// backend has since moved to a different real domain.
//
// This resolver:
//  1. Leaves real remote URLs (Cloudinary, any other https/http host that
//     isn't a stale localhost reference) untouched.
//  2. Rewrites a relative "/uploads/..." path (what the backend now saves)
//     to the currently configured API origin.
//  3. Self-heals OLD database records that already contain a hardcoded
//     "http://localhost:5000/uploads/..." (or any localhost:PORT) by
//     extracting the "/uploads/..." tail and re-pointing it at the
//     currently configured API origin — so images uploaded before this fix
//     start working again without a DB migration.

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Strip a trailing "/api" (or "/api/") to get the plain backend origin.
const API_ORIGIN = RAW_API_URL.replace(/\/api\/?$/, '');

const LOCALHOST_HOST_RE = /^https?:\/\/localhost(:\d+)?/i;

export const resolveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';

  // Already a relative app path someone constructed correctly.
  if (url.startsWith('/uploads/')) {
    return `${API_ORIGIN}${url}`;
  }

  // Stale/incorrect localhost reference (from before this fix, or from a
  // dev DB copied into another environment) — keep only the path and
  // re-host it on the real, currently configured API origin.
  if (LOCALHOST_HOST_RE.test(url)) {
    const uploadsIndex = url.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      return `${API_ORIGIN}${url.slice(uploadsIndex)}`;
    }
    // No /uploads/ segment — nothing sensible to salvage.
    return '';
  }

  // A real absolute URL (Cloudinary, or any other real host) — leave as is.
  return url;
};

export default resolveImageUrl;
