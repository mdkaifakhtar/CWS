const ServiceCategory = require('../models/ServiceCategory');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "  customer   LOUNGE " -> "customer LOUNGE"
const normalizeCategoryName = (name) => (typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '');

const slugifyCategory = (name) =>
  normalizeCategoryName(name)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

// Case-insensitive, whitespace-insensitive lookup (matches by slug or exact name ignoring case).
const findCategoryByName = (name) => {
  const clean = normalizeCategoryName(name);
  if (!clean) return null;
  return ServiceCategory.findOne({
    $or: [{ slug: slugifyCategory(clean) }, { name: new RegExp(`^${escapeRegex(clean)}$`, 'i') }],
  });
};

// Returns the existing category if one matches, otherwise creates a real, active one.
const findOrCreateCategory = async (name) => {
  const clean = normalizeCategoryName(name);
  if (!clean) throw new Error('Category name is required');
  const existing = await findCategoryByName(clean);
  if (existing) return { category: existing, created: false };
  try {
    const category = await ServiceCategory.create({ name: clean, slug: slugifyCategory(clean), sortOrder: 100 });
    return { category, created: true };
  } catch (err) {
    // Lost a race against the unique index: return the winner instead of duplicating
    if (err.code === 11000) {
      const winner = await findCategoryByName(clean);
      if (winner) return { category: winner, created: false };
    }
    throw err;
  }
};

module.exports = { normalizeCategoryName, slugifyCategory, findCategoryByName, findOrCreateCategory };
