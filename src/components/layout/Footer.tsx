const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-slate-500">
        <span>Dinbhar Poster Studio</span>
        <span>&copy; {new Date().getFullYear()} Newsdesk Tools</span>
      </div>
    </footer>
  );
};

export default Footer;
