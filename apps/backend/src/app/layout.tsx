export const metadata = {
  title: 'LinkDN Services',
  description: 'Marketplace de servicios - Colombia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
