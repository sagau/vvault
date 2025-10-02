export default function DashboardLayout({ role, companyId, children }) {
    return (
      <div className="flex h-screen bg-gray-900 text-white">
        {/* Placeholder for Sidebar - add Sidebar.tsx later */}
        <div className="w-64 bg-gray-800 p-4">Sidebar for {role}</div>
        <div className="flex-1 flex flex-col">
          {/* Placeholder for Navbar - add Navbar.tsx later */}
          <div className="p-4 bg-gray-700">Navbar for {role}</div>
          <main className="p-4">{children}</main>
        </div>
      </div>
    );
  }