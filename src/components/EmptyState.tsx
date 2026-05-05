import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className="flex flex-col items-center justify-center text-center py-14 px-6"
  >
    <div className="relative mb-5">
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent blur-2xl"
        style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
      />
      <div
        className="neo-card relative w-20 h-20 flex items-center justify-center"
        style={{ borderRadius: "55% 45% 35% 65% / 55% 35% 65% 45%" }}
      >
        <Icon className="w-8 h-8 text-primary" />
      </div>
    </div>
    <h3 className="font-semibold text-base mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </motion.div>
);

export default EmptyState;
