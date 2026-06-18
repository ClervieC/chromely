import { Eye } from "lucide-react";
import { FilteredFeutresView } from "../components/FilteredFeutresView.jsx";

export default function ComparerPage() {
  return (
    <FilteredFeutresView
      title="À comparer"
      filterFn={(f) => !f.compare}
      subtitle={() =>
        "Couleurs pas encore confrontées à tes autres packs — modifie un feutre pour noter le résultat."
      }
      emptyIcon={Eye}
      emptyTitle="Tout est comparé"
      emptyText="Bravo, tu as passé en revue toutes tes couleurs face à tes autres packs."
    />
  );
}
