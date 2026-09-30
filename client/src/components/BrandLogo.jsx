import { Link } from 'react-router-dom';

/**
 * Single reusable brand/logo component used everywhere the app shows branding
 * (navbar, footer, login, register, dashboards). Always the same asset, so the
 * brand never looks different across pages.
 *
 * sizeClass controls height only — width is automatic (aspect ratio preserved,
 * never stretched) via object-contain + w-auto.
 */
const SIZE_CLASSES = {
  sm: 'h-11 sm:h-12',
  md: 'h-14 sm:h-16', // default — navbar/footer
  lg: 'h-16 sm:h-20', // login/register/auth pages
};

const BrandLogo = ({ size = 'md', linkTo = '/', className = '' }) => {
  const img = (
    <img
      src="/images/logo.png"
      alt="Car Wash Splash Point OKKAH"
      className={`${SIZE_CLASSES[size] || SIZE_CLASSES.md} w-auto object-contain max-w-full ${className}`}
    />
  );

  if (!linkTo) return img;

  return (
    <Link to={linkTo} className="flex items-center flex-shrink-0" aria-label="Car Wash Splash Point OKKAH">
      {img}
    </Link>
  );
};

export default BrandLogo;
