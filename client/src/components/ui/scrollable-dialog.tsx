"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ScrollableDialog = DialogPrimitive.Root;

const ScrollableDialogTrigger = DialogPrimitive.Trigger;

const ScrollableDialogPortal = DialogPrimitive.Portal;

const ScrollableDialogClose = DialogPrimitive.Close;

const ScrollableDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
ScrollableDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ScrollableDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <ScrollableDialogPortal>
    <ScrollableDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        // Responsive scroll behavior
        "max-h-[95vh] max-w-[95vw]",
        // Ensure content is scrollable when overflow occurs
        "flex flex-col",
        className
      )}
      {...props}
    >
      {/* Scrollable content area */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Header stays fixed at top */}
        <div className="shrink-0 p-6 pb-0">
          {/* Close button positioned in header */}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>

        {/* Main content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="min-h-0">
            {children}
            {/* Add default description for accessibility if none provided */}
            <DefaultDialogDescription />
          </div>
        </div>

        {/* Footer stays fixed at bottom */}
        <div className="shrink-0 p-6 pt-0" id="dialog-footer-area">
          {/* Footer content will be rendered here via portal */}
        </div>
      </div>
    </DialogPrimitive.Content>
  </ScrollableDialogPortal>
));
ScrollableDialogContent.displayName = DialogPrimitive.Content.displayName;

const ScrollableDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left mb-4",
      className
    )}
    {...props}
  />
);
ScrollableDialogHeader.displayName = "ScrollableDialogHeader";

const ScrollableDialogFooter = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const [footerElement, setFooterElement] = React.useState<HTMLElement | null>(
    null
  );

  React.useEffect(() => {
    // Find the footer area element
    const footerArea = document.getElementById("dialog-footer-area");
    setFooterElement(footerArea);
  }, []);

  // If footer area is not available, render nothing
  if (!footerElement) {
    return null;
  }

  // Use React portal to render footer content in the fixed footer area
  return createPortal(
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 border-t pt-4",
        className
      )}
      {...props}
    >
      {children}
    </div>,
    footerElement
  );
};
ScrollableDialogFooter.displayName = "ScrollableDialogFooter";

const ScrollableDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
ScrollableDialogTitle.displayName = DialogPrimitive.Title.displayName;

const ScrollableDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ScrollableDialogDescription.displayName =
  DialogPrimitive.Description.displayName;

// Default hidden description for accessibility
const DefaultDialogDescription = () => (
  <ScrollableDialogDescription className="sr-only">
    Dialog content
  </ScrollableDialogDescription>
);

export {
  ScrollableDialog,
  ScrollableDialogPortal,
  ScrollableDialogOverlay,
  ScrollableDialogClose,
  ScrollableDialogTrigger,
  ScrollableDialogContent,
  ScrollableDialogHeader,
  ScrollableDialogFooter,
  ScrollableDialogTitle,
  ScrollableDialogDescription,
};
