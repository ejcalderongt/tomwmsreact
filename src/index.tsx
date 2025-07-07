import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/utils/auth";

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated()) {
        navigate("/existencias");
      } else {
        navigate("/login");
      }
    }, 3000); // espera 3 segundos para redirigir

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="test-style text-center mt-20">
      Tailwind está funcionando correctamente 🚀
    </div>
  );
}

export default Index;
