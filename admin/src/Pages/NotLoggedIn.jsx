import { useNavigate } from 'react-router-dom';
import { XCircle, LogIn, ArrowRight } from 'lucide-react';

const NotLoggedIn = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-red-50 to-white px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg border border-red-100">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <XCircle size={48} className="text-red-600" />
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-red-600 mb-3 text-center">
          Access Restricted
        </h2>
        
        <div className="h-1 w-16 bg-red-600 mx-auto mb-6"></div>
        
        <p className="text-gray-700 mb-6 text-center">
          You need to be signed in to access this page. Please log in with your credentials to continue.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/signin')}
            className="w-full py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
          >
            <LogIn size={18} />
            Sign In Now
          </button>
         
        </div>
        
     
      </div>
      
      <p className="mt-8 text-sm text-gray-500">
        If you're having trouble logging in, please contact support.
      </p>
    </div>
  );
};

export default NotLoggedIn;