import { motion } from "framer-motion";
import { ReactNode } from "react";
interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}
export default function PageHeader({
  title,
  description,
  icon,
  actions
}: PageHeaderProps) {
  return <motion.div initial={{
    opacity: 0,
    y: -20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3
  }} className="flex items-center justify-between mb-8 py-[10px] ml-[10px]">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {icon && <div className="p-2 rounded-xl bg-primary/10">
              {icon}
            </div>}
          <h1 className="heading-page">{title}</h1>
        </div>
        {description && <p className="text-description">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </motion.div>;
}