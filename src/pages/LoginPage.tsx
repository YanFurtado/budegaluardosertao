import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { LojaAvatar } from "@/components/shared/LojaAvatar";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const logado = useAppStore((s) => !!s.usuarioLogadoId);
  const entrar = useAppStore((s) => s.entrar);
  const loja = useAppStore((s) => s.loja);
  const emailDemo = useAppStore((s) => s.funcionarios.find((f) => f.ativo && f.cargo === "administrador")?.email ?? "");
  const [email, setEmail] = useState(emailDemo);
  const [senha, setSenha] = useState("123456");
  const [erro, setErro] = useState<string | null>(null);
  const destino = (location.state as { from?: string } | null)?.from ?? "/gestao-pedidos";

  useEffect(() => {
    document.title = `Entrar · ${loja.nome}`;
  }, [loja.nome]);

  if (logado) return <Navigate to={destino} replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }
    if (entrar(email, senha)) navigate(destino, { replace: true });
    else setErro("E-mail não encontrado ou usuário desativado.");
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <LojaAvatar loja={loja} className="size-14 text-[18px]" />
          <span className="text-[20px] font-extrabold tracking-tight">{loja.nome}</span>
        </div>

        <form onSubmit={onSubmit} className="card flex flex-col gap-4 p-6">
          <div>
            <h1 className="text-[18px] font-semibold">Entrar</h1>
            <p className="text-ink-muted">Sistema de gestão da {loja.nome}.</p>
          </div>

          <Field label="E-mail" htmlFor="email">
            <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Senha" htmlFor="senha" error={erro}>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </Field>

          <Button type="submit" className="mt-1 w-full">
            <LogIn /> Entrar
          </Button>

          <p className="rounded-md bg-gray-50 p-3 text-[12px] text-ink-muted">
            <strong className="text-ink">Demonstração:</strong> entre com o e-mail de qualquer pessoa da equipe e qualquer
            senha. Cada cargo vê só as áreas permitidas.
          </p>
        </form>

        <Link
          to="/"
          className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Voltar para a loja
        </Link>
      </div>
    </div>
  );
}
