import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 cyber-grid">
      <h1 className="text-4xl font-bold text-neon-green mb-8 glow-text">HOS Command Center</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-lg border border-neon-green/30 hover:border-neon-green transition-colors">
          <h2 className="text-xl text-purple-400 mb-2">Members</h2>
          <p className="text-3xl font-bold">128</p>
        </div>

        <div className="glass-panel p-6 rounded-lg border border-neon-green/30 hover:border-neon-green transition-colors">
          <h2 className="text-xl text-purple-400 mb-2">Active Events</h2>
          <p className="text-3xl font-bold">3</p>
        </div>

        <div className="glass-panel p-6 rounded-lg border border-neon-green/30 hover:border-neon-green transition-colors">
          <h2 className="text-xl text-purple-400 mb-2">War Reports</h2>
          <p className="text-3xl font-bold">42</p>
        </div>

        <div className="glass-panel p-6 rounded-lg border border-neon-green/30 hover:border-neon-green transition-colors">
          <h2 className="text-xl text-purple-400 mb-2">Chat Users</h2>
          <p className="text-3xl font-bold">89</p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-6 rounded-lg border border-neon-green/20">
          <h2 className="text-2xl font-bold text-neon-green mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span>New member registered: xX_DragonSlayer_Xx</span>
              <span className="text-sm text-gray-400">10 mins ago</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span>War report uploaded: vs Server 1894</span>
              <span className="text-sm text-gray-400">2 hours ago</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-lg border border-purple-500/20">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">Quick Actions</h2>
          <div className="space-y-4 flex flex-col">
            <button className="bg-neon-green/10 text-neon-green border border-neon-green px-4 py-2 rounded hover:bg-neon-green/20 transition-all text-left">
              + New Announcement
            </button>
            <button className="bg-neon-green/10 text-neon-green border border-neon-green px-4 py-2 rounded hover:bg-neon-green/20 transition-all text-left">
              + Add Event
            </button>
            <button className="bg-neon-green/10 text-neon-green border border-neon-green px-4 py-2 rounded hover:bg-neon-green/20 transition-all text-left">
              + Upload to Gallery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
