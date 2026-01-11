import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mt-48 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Η σελίδα που ψάχνετε δεν βρέθηκε</p>
        <Button className="mb-52 rounded-3xl" onClick={() => navigate('/')}>
          Επιστροφή στην αρχική
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
