import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/utils/auth';

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/existencias');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return null;
}

export default Index;