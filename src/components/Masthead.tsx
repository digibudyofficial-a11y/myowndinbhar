const BASE64_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDgwJyBoZWlnaHQ9JzE0MCc+PHJlY3QgZmlsbD0nI2Y5NzMxNicgd2lkdGg9JzEwODAnIGhlaWdodD0nMTQwJy8+PHRleHQgeD0nNTQwJyB5PSc5MCcgdGV4dC1hbmNob3I9J21pZGRsZScgZm9udC1mYW1pbHk9J0ludGVyLCBBcmlhbCwgc2Fucy1zZXJpZicgZm9udC13ZWlnaHQ9JzcwMCcgZm9udC1zaXplPSc2MCcgZmlsbD0nI2ZmZmZmZic+RGluYmhhciBOZXdzPC90ZXh0Pjwvc3ZnPg==";

export interface MastheadProps {
  src?: string;
  alt?: string;
}

const Masthead = ({ src, alt = "Dinbhar masthead" }: MastheadProps) => {
  return (
    <div className="h-full w-full overflow-hidden rounded-b-lg bg-brand-orange shadow">
      <img
        className="h-full w-full object-cover"
        src={src ?? BASE64_PLACEHOLDER}
        alt={alt}
        loading="lazy"
      />
    </div>
  );
};

export default Masthead;
// eslint-disable-next-line react-refresh/only-export-components
export { BASE64_PLACEHOLDER as MASTHEAD_PLACEHOLDER };
