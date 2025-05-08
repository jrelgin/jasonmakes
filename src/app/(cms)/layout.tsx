export default function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body id="outstatic">{children}</body>
    </html>
  );
}
