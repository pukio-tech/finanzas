"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { iniciarSesion, registrar, type AuthState } from "./actions";

export function AuthForm({ mode }: { mode: "login" | "registro" }) {
  const action = mode === "login" ? iniciarSesion : registrar;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});

  return (
    <Card flush className="p-5">
      <form action={formAction} className="flex flex-col gap-4">
        {mode === "registro" && (
          <Field
            label="Nombre"
            name="nombre"
            autoComplete="name"
            defaultValue={state.fields?.nombre}
            required
          />
        )}
        <Field
          label="Correo"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          defaultValue={state.fields?.email}
          required
        />
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "registro" ? 8 : undefined}
          hint={mode === "registro" ? "Mínimo 8 caracteres" : undefined}
          required
        />

        {state.error && <Alert>{state.error}</Alert>}

        <Button type="submit" variant="primary" disabled={pending} className="mt-1 w-full">
          {pending ? "Un momento…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-medium text-accent">
              Regístrate
            </Link>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-accent">
              Inicia sesión
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}
