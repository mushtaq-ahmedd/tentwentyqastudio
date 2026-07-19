"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogCloseX,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUI } from "@/components/shell/ui-provider";

/** The app's single generic confirmation dialog — mirrors `renderConfirm()` in modals.js. */
export function ConfirmDialog() {
  const { confirm, closeConfirm } = useUI();

  return (
    <AlertDialog open={!!confirm} onOpenChange={(open) => !open && closeConfirm()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
          <AlertDialogCloseX />
        </AlertDialogHeader>
        <div className="px-6 py-5">
          <AlertDialogDescription>{confirm?.message}</AlertDialogDescription>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={confirm?.danger ? "danger" : "primary"}
            onClick={() => {
              confirm?.onConfirm();
              closeConfirm();
            }}
          >
            {confirm?.confirmLabel ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
