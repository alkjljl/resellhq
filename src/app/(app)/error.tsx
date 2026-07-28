"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ApplicationError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <Alert>
        <div>
          <p className="font-semibold">This section could not be loaded.</p>
          <p className="mt-1">Your saved account and workspace data were not changed.</p>
        </div>
      </Alert>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
