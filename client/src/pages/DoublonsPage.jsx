import { Copy } from "lucide-react";
import { FilteredFeutresView } from "../components/FilteredFeutresView.jsx";
import { MARQUES_NUMERO_UNIVERSEL } from "../data.js";

function isDoublon(f, allFeutres) {
  if (f.quantite > 1) return true;
  const universel = MARQUES_NUMERO_UNIVERSEL.includes(f.marque);
  return allFeutres.some(
    (g) =>
      g.id !== f.id &&
      g.marque === f.marque &&
      g.pack !== f.pack &&
      (universel
        ? g.numero === f.numero
        : g.hex && f.hex && g.hex.toLowerCase() === f.hex.toLowerCase()),
  );
}

export default function DoublonsPage() {
  return (
    <FilteredFeutresView
      title="Doublons"
      filterFn={isDoublon}
      subtitle={(list) => {
        const enPlus = list.reduce((s, f) => s + (f.quantite - 1), 0);
        return enPlus > 0
          ? `${enPlus} exemplaire(s) en plus à donner, échanger ou vendre.`
          : "Feutres présents dans plusieurs packs différents.";
      }}
      emptyIcon={Copy}
      emptyTitle="Aucun doublon"
      emptyText="Chaque feutre de ton stock est unique, pour l'instant !"
    />
  );
}
