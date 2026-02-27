import BackButton from "@/components/BackButton";

interface PageHeaderProps {
  title: string;
  backTo?: string;
  rightContent?: React.ReactNode;
}

const PageHeader = ({ title, backTo = "/", rightContent }: PageHeaderProps) => {
  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <BackButton to={backTo} />
          <h1 className="text-lg sm:text-2xl md:text-3xl font-baloo text-foreground line-clamp-2 min-w-0" dir="auto">
            {title}
          </h1>
        </div>
        {rightContent && (
          <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
