import { History, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipeTab } from "@/features/admin/EquipeTab";
import { AtividadesTab } from "@/features/admin/AtividadesTab";

export default function AdministrativoPage() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      <Tabs defaultValue="equipe">
        <TabsList>
          <TabsTrigger value="equipe">
            <Users className="size-4" /> Equipe
          </TabsTrigger>
          <TabsTrigger value="atividades">
            <History className="size-4" /> Registro de atividades
          </TabsTrigger>
        </TabsList>
        <TabsContent value="equipe">
          <EquipeTab />
        </TabsContent>
        <TabsContent value="atividades">
          <AtividadesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
