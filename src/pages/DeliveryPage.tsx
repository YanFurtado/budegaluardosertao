import { Bike, MapPinned, SlidersHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmRotaCard } from "@/features/delivery/EmRotaCard";
import { EntregadoresTab } from "@/features/delivery/EntregadoresTab";
import { RegrasForm } from "@/features/delivery/RegrasForm";
import { ZonasTab } from "@/features/delivery/ZonasTab";

export default function DeliveryPage() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 pb-24">
      <EmRotaCard />

      <section className="card p-4 sm:p-5">
        <Tabs defaultValue="areas">
          <TabsList>
            <TabsTrigger value="areas">
              <MapPinned className="size-4" /> Áreas de entrega
            </TabsTrigger>
            <TabsTrigger value="entregadores">
              <Bike className="size-4" /> Entregadores
            </TabsTrigger>
            <TabsTrigger value="regras">
              <SlidersHorizontal className="size-4" /> Regras
            </TabsTrigger>
          </TabsList>
          <TabsContent value="areas">
            <ZonasTab />
          </TabsContent>
          <TabsContent value="entregadores">
            <EntregadoresTab />
          </TabsContent>
          <TabsContent value="regras">
            <RegrasForm />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
