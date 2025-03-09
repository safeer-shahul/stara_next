// app/admin/login/layout.tsx
export default function AdminLoginLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {children}
      </div>
    );
  }
  
 