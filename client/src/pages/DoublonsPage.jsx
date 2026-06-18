import { Copy } from "lucide-react";
import { FilteredFeutresView } from "../components/FilteredFeutresView.jsx";

export default function DoublonsPage() {
  return (
    <FilteredFeutresView
      title="Doublons"
      filterFn={(f) => f.quantite > 1}
      subtitle={(list) =>
        `${list.reduce((s, f) => s + (f.quantite - 1), 0)} exemplaire(s) en plus à donner, échanger ou vendre.`
      }
      emptyIcon={Copy}
      emptyTitle="Aucun doublon"
      emptyText="Chaque feutre de ton stock est unique, pour l'instant !"
    />
  );
}
