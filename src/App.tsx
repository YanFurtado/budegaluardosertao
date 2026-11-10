import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import LojaPage from "@/pages/LojaPage";
import SalesAnalysisPage from "@/pages/SalesAnalysisPage";
import GestaoPedidosPage from "@/pages/GestaoPedidosPage";
import HistoricoPedidosPage from "@/pages/HistoricoPedidosPage";
import CaixaPage from "@/pages/CaixaPage";
import FiadoPage from "@/pages/FiadoPage";
import ClientesPage from "@/pages/ClientesPage";
import CatalogoPage from "@/pages/CatalogoPage";
import CuponsPage from "@/pages/CuponsPage";
import DeliveryPage from "@/pages/DeliveryPage";
import AvaliacoesPage from "@/pages/AvaliacoesPage";
import MinhaEmpresaPage from "@/pages/MinhaEmpresaPage";
import MeusLinksPage from "@/pages/MeusLinksPage";
import AdministrativoPage from "@/pages/AdministrativoPage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";

export default function App() {
  return (
    <>
      <Routes>
        {/* Página principal: a loja, para clientes e equipe (o botão "Entrar" leva ao login). */}
        <Route path="/" element={<LojaPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Sistema de gestão: só para quem entrou */}
        <Route element={<AppLayout />}>
          <Route path="/gestao-pedidos" element={<GestaoPedidosPage />} />
          <Route path="/caixa" element={<CaixaPage />} />
          <Route path="/analise-vendas" element={<SalesAnalysisPage />} />
          <Route path="/historico-pedidos" element={<HistoricoPedidosPage />} />
          <Route path="/minha-empresa" element={<MinhaEmpresaPage />} />
          <Route path="/catalogo" element={<CatalogoPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/cupons-descontos" element={<CuponsPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/avaliacoes" element={<AvaliacoesPage />} />
          <Route path="/fiado" element={<FiadoPage />} />
          <Route path="/administrativo" element={<AdministrativoPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          <Route path="/meus-links" element={<MeusLinksPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* top-center: não cobre o cabeçalho dos painéis laterais (detalhes do pedido etc.) */}
      <Toaster position="top-center" closeButton toastOptions={{ className: "font-sans" }} />
    </>
  );
}
