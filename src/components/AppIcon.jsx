import * as LucideIcons from "lucide-react";

function Icon({
  name,
  size = 24,
  color = "currentColor",
  className = "",
  strokeWidth = 2,
  ...props
}) {
  const IconComponent = LucideIcons[name] || LucideIcons.HelpCircle || LucideIcons.CircleHelp;

  if (!IconComponent) {
    return null;
  }


  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
}
export default Icon;
