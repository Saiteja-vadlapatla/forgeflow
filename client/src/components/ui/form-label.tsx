import { Label } from "@/components/ui/label";

interface FormLabelProps {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
}

export function FormLabel({ htmlFor, children, required = false, optional = false, className = "" }: FormLabelProps) {
  return (
    <Label htmlFor={htmlFor} className={`flex items-center gap-1.5 ${className}`}>
      <span>{children}</span>
      {required && <span className="text-red-500 text-sm">*</span>}
      {optional && <span className="text-gray-400 text-xs font-normal">(Optional)</span>}
    </Label>
  );
}
