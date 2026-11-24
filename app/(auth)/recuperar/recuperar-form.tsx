"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { solicitarRecuperacion, type RecuperacionState } from "../recuperacion-actions";

export function RecuperarForm() {
  const [state, action, pending] = useActionState<RecuperacionState, FormData>(solicitarRecuperacion, {});

  if (state.enviado) {
    return (
      <Card flush className="flex flex-col items-center gap-3 p-5 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <p className="font-medium">Revisa tu correo</p>
        <p className="text-sm text-muted">
          Si hay una cuenta con <span className="font-medium text-foreground">{state.email}</span>, te enviamos un enlace
          para elegir una contraseña nueva. Vence en 30 minutos. Si no lo ves, revisa la carpeta de spam.
        </p>
        <Link href="/login" className="mt-2 text-sm font-medium text-accent">
          Volver a iniciar sesión
        </Link>
      </Card>
    );
  }

  return (
    <Card flush className="p-5">
      <form action={action} className="flex flex-col gap-4">
        <div>
          <p className="font-medium">¿Olvidaste tu contraseña?</p>
          <p className="mt-1 text-sm text-muted">Escribe tu correo y te enviamos un enlace para elegir una nueva</p>
        </div>
        <Field
          label="Correo"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          defaultValue={state.email}
          required
        />
        {state.error && <Alert>{state.error}</Alert>}
        <Button type="submit" variant="primary" disabled={pending} className="w-full">
          {pending ? "Enviando…" : "Enviar enlace"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        ¿La recordaste?{" "}
        <Link href="/login" className="font-medium text-accent">
          Inicia sesión
        </Link>
      </p>
    </Card>
  );
}
