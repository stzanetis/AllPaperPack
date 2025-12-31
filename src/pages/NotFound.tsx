import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center mt-[-150px]">
        <h1 className="text-6xl text-black/80 font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Η σελίδα που ψάχνετε δεν μπόρεσε να βρεθεί..</p>
        <a href="/" className="text-primary hover:text-blue-700 underline font-bold">
          Επιστροφή στην αρχική σελίδα
        </a>
      </div>
    </div>
  );
};

export default NotFound;
