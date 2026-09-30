const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
// Accepts 10-digit local numbers or numbers with a leading country code (+91, 0091, etc.)
const PHONE_REGEX = /^(\+?\d{1,3}[- ]?)?\d{10}$/;

const isValidEmail = (value) => typeof value === 'string' && EMAIL_REGEX.test(value.trim());
const isValidPhone = (value) => typeof value === 'string' && PHONE_REGEX.test(value.trim().replace(/\s+/g, ''));

module.exports = { isValidEmail, isValidPhone };
