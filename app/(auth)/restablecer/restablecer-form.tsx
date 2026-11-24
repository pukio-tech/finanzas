"use client";

import { useActionState } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { restablecerContrasena, type RecuperacionState } from "../recuperacion-actions";

export function RestablecerForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<RecuperacionState, FormData>(
    restablecerContrasena.bind(null, token),
    {},
  );

  return (
    <Card flush className="p-5">
      <form action={action} className="flex flex-col gap-4">
        <div>
          <p className="font-medium">Elige una contraseña nueva</p>
          <p className="mt-1 text-sm text-muted">Al guardarla entras directo a tu cuenta</p>
        </div>
        <Field
          label="Contraseña nueva"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          hint="Mínimo 8 caracteres"
          required
        />
        <Field label="Repite la contraseña" name="confirmar" type="password" autoComplete="new-password" minLength={8} required />
        {state.error && <Alert>{state.error}</Alert>}
        <Button type="submit" variant="primary" disabled={pending} className="w-full">
          {pending ? "Guardando…" : "Guardar y entrar"}
        </Button>
      </form>
    </Card>
  );
}
