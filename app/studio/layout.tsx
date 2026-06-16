export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-neutral-950 text-white font-sans">
      {children}
    </div>
  );
}
