import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './routes/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ServiceListing from './pages/ServiceListing';
import ServiceDetail from './pages/ServiceDetail';
import VendorDetail from './pages/VendorDetail';
import BookService from './pages/BookService';
import BookingConfirmation from './pages/BookingConfirmation';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQs from './pages/FAQs';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import VendorRegister from './pages/vendor/VendorRegister';
import NotFound from './pages/NotFound';

import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import MyBookings from './pages/dashboard/MyBookings';
import BookingDetail from './pages/dashboard/BookingDetail';
import Vehicles from './pages/dashboard/Vehicles';
import MyReviews from './pages/dashboard/MyReviews';
import Profile from './pages/dashboard/Profile';

import VendorDashboardLayout from './pages/vendor/VendorDashboardLayout';
import VendorOverview from './pages/vendor/VendorOverview';
import VendorProfile from './pages/vendor/VendorProfile';
import VendorDocuments from './pages/vendor/VendorDocuments';
import VendorServices from './pages/vendor/VendorServices';
import VendorBookings from './pages/vendor/VendorBookings';
import VendorBookingDetail from './pages/vendor/VendorBookingDetail';
import VendorReviews from './pages/vendor/VendorReviews';

import AdminDashboardLayout from './pages/admin/AdminDashboardLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminVendors from './pages/admin/AdminVendors';
import AdminVendorDetail from './pages/admin/AdminVendorDetail';
import AdminDailySummary from './pages/admin/AdminDailySummary';
import AdminVendorPerformance from './pages/admin/AdminVendorPerformance';
import AdminCollections from './pages/admin/AdminCollections';
import AdminSettings from './pages/admin/AdminSettings';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services" element={<ServiceListing />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/vendors/:id" element={<VendorDetail />} />
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          <Route
            path="/book"
            element={
              <ProtectedRoute>
                <BookService />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book/:serviceId"
            element={
              <ProtectedRoute>
                <BookService />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-confirmed/:id"
            element={
              <ProtectedRoute>
                <BookingConfirmation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['user']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="reviews" element={<MyReviews />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route
            path="/vendor"
            element={
              <ProtectedRoute roles={['vendor']}>
                <VendorDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<VendorOverview />} />
            <Route path="profile" element={<VendorProfile />} />
            <Route path="documents" element={<VendorDocuments />} />
            <Route path="services" element={<VendorServices />} />
            <Route path="bookings" element={<VendorBookings />} />
            <Route path="bookings/:id" element={<VendorBookingDetail />} />
            <Route path="reviews" element={<VendorReviews />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="daily" element={<AdminDailySummary />} />
            <Route path="vendors" element={<AdminVendors />} />
            <Route path="vendors/:id" element={<AdminVendorDetail />} />
            <Route path="performance" element={<AdminVendorPerformance />} />
            <Route path="collections" element={<AdminCollections />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
