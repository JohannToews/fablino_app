import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  backTo?: string;
  rightContent?: React.ReactNode;
}

const PageHeader = ({ title, backTo = "/", rightContent }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backTo)}
            className="rounded-full hover:bg-primary/20 h-12 w-12"
          >
            <ArrowLeft className="h-8 w-8" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-baloo text-foreground">
            {title}
          </h1>
        </div>
        {rightContent && (
          <div className="flex items-center gap-4">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
