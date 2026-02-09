/**
 * FablinoPageHeader – Reusable mascot + speech bubble header for story creation pages.
 * Fablino appears on every page with a contextual message, guiding the child like a conversation.
 */
interface FablinoPageHeaderProps {
  mascotImage: string;
  message: string;
  mascotSize?: number;
}

const FablinoPageHeader = ({
  mascotImage,
  message,
  mascotSize = 150,
}: FablinoPageHeaderProps) => {
  return (
    <div className="flex items-center gap-1 px-2 py-3" style={{ marginLeft: -8 }}>
      {/* Fablino mascot */}
      <img
        src={mascotImage}
        alt="Fablino"
        className="flex-shrink-0 object-contain drop-shadow-md"
        style={{
          width: mascotSize,
          height: "auto",
          animation: "gentleBounce 2.2s ease-in-out infinite",
        }}
      />

      {/* Speech bubble */}
      <div className="relative flex-1 min-w-0">
        <div
          className="rounded-[18px] px-4 py-2.5 bg-white"
          style={{ boxShadow: "0 3px 16px rgba(0,0,0,0.08)" }}
        >
          <span
            className="font-nunito text-[15px] font-semibold leading-snug"
            style={{ color: "#2D1810" }}
          >
            {message}
          </span>
        </div>
        {/* Triangle pointing LEFT toward Fablino */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -left-2"
          style={{
            width: 0,
            height: 0,
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: "10px solid white",
          }}
        />
      </div>

      {/* Keyframes (only injected once via CSS) */}
      <style>{`
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default FablinoPageHeader;
