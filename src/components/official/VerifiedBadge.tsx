import { BadgeCheck } from "lucide-react";

interface Props { size?: number; className?: string }

const VerifiedBadge = ({ size = 16, className = "" }: Props) => (
  <span
    title="Verified official account"
    aria-label="Verified"
    className={`inline-flex items-center justify-center text-primary ${className}`}
  >
    <BadgeCheck style={{ width: size, height: size }} fill="currentColor" className="text-primary [&>path]:fill-primary [&>path:nth-child(2)]:fill-background" />
  </span>
);

export default VerifiedBadge;
