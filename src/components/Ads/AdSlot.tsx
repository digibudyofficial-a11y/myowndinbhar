import type { AdDocument } from "../../lib/types";

interface AdSlotProps {
  title: string;
  ad?: AdDocument;
}

const AdSlot = ({ title, ad }: AdSlotProps) => {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        {ad?.clickUrl ? (
          <a
            href={ad.clickUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-brand-orange hover:underline"
          >
            View link
          </a>
        ) : null}
      </header>
      {ad ? (
        <img
          src={ad.imageUrl}
          alt={`${title} creative`}
          className="aspect-[3/1] w-full rounded-md object-cover"
        />
      ) : (
        <p className="text-sm text-slate-500">No creative configured for this slot.</p>
      )}
    </section>
  );
};

export default AdSlot;
