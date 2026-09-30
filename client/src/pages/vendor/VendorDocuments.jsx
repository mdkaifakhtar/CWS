import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ArrowRight } from 'lucide-react';
import { Card, PageHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const VendorDocuments = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Smooth redirect to Business profile & shop photo page
    const timer = setTimeout(() => navigate('/vendor/profile', { replace: true }), 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div>
      <PageHeader
        title="Business Profile & Shop Photos"
        description="Verification document uploads have been simplified. You can manage your shop photo and business address on your Business Profile."
      />
      <Card className="text-center py-10 space-y-4">
        <Store size={40} className="mx-auto text-aqua-400" />
        <h2 className="font-display font-bold text-lg text-white">Redirecting to Shop Profile...</h2>
        <p className="text-xs text-slate-400">
          Document verification is no longer required. Upload your shop cover photo directly from your Business Profile.
        </p>
        <div className="pt-2">
          <Link to="/vendor/profile">
            <Button variant="dark" icon={ArrowRight} iconPosition="right">
              Go to Business Profile
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default VendorDocuments;

