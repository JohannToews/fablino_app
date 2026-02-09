/**
 * FablinoPageHeader – Reusable mascot + speech bubble header for story creation pages.
 * Fablino appears on every page with a contextual message, guiding the child like a conversation.
 * Uses the shared FablinoMascot + SpeechBubble components for consistent sizing.
 */
import FablinoMascot, { FablinoSize } from "./FablinoMascot";
import SpeechBubble from "./SpeechBubble";

interface FablinoPageHeaderProps {
  mascotImage: string;
  message: string;
  mascotSize?: FablinoSize;
}

const FablinoPageHeader = ({
  mascotImage,
  message,
  mascotSize = "md",
}: FablinoPageHeaderProps) => {
  return (
    <div className="flex flex-row items-center gap-2 px-2 py-3 justify-start">
      <FablinoMascot src={mascotImage} size={mascotSize} />
      <div className="flex-1 min-w-0">
        <SpeechBubble>{message}</SpeechBubble>
      </div>
    </div>
  );
};

export default FablinoPageHeader;
