import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  onClick?: () => void;
  to?: string;
  className?: string;
}

const BackButton = ({ onClick, to, className = "" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center justify-center
        w-11 h-11 md:w-12 md:h-12
        rounded-full
        bg-white border border-orange-200
        shadow-md hover:shadow-lg hover:bg-orange-50
        transition-all duration-150
        active:scale-95
        ${className}
      `}
      aria-label="Back"
    >
      <ChevronLeft className="h-6 w-6 text-[#2D1810]" />
    </button>
  );
};

export default BackButton;
