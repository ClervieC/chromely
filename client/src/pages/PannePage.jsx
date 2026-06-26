import { AlertTriangle } from "lucide-react";
import { FilteredFeutresView } from "../components/FilteredFeutresView.jsx";

export default function PannePage() {
  return (
    <FilteredFeutresView
      title="En panne"
      accentColor="#C1452D"
      filterFn={(f) => f.etat !== "fonctionne"}
      subtitle={() => "Feutres secs ou abîmés à racheter ou à réactiver."}
      emptyIcon={AlertTriangle}
      emptyTitle="Aucun feutre HS"
      emptyText="Tout ton stock fonctionne pour l'instant."
    />
  );
}
