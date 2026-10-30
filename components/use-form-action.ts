"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { FormState } from "@/lib/validacion";

// Envía el formulario con onSubmit en vez de action para que React no lo vacíe
// cuando el servidor devuelve un error (así se conservan selects y botones elegidos).
// Si la acción responde { ok: true }, el formulario sí se limpia.
export function useFormAction(action: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  return { state, pending, formRef, onSubmit };
}
