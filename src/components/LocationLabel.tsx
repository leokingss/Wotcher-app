import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface LocationLabelProps {
  location: {
    id: string;
    name: string;
    city: string | null;
    country: string | null;
  } | null | undefined;
  className?: string;
  asLink?: boolean;
}

/**
 * Instagram-style location label shown under @username.
 * Renders "City, Country" (or place name) with a small pin icon.
 */
export function LocationLabel({ location, className = "", asLink = true }: LocationLabelProps) {
  if (!location) return null;
  const text =
    [location.city, location.country].filter(Boolean).join(", ") || location.name;
  const inner = (
    <span className={`inline-flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <MapPin className="h-3 w-3" />
      <span className="truncate">{text}</span>
    </span>
  );
  if (asLink) {
    return <Link to={`/place/${location.id}`}>{inner}</Link>;
  }
  return inner;
}
