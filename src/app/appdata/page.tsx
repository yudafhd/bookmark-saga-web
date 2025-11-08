import { auth } from "@/auth";
import { listAppDataFiles } from "@/lib/drive";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AppDataPage() {
  const session = await auth();
  const accessToken = (session as any)?.accessToken as string | undefined;
  if (!accessToken) redirect("/");

  const files = await listAppDataFiles(accessToken);

  return (
    <div className="min-h-[100svh] bg-gradient-to-b from-[#0e1525] to-[#0a0f1e] text-zinc-100">
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-8 py-8 sm:py-12">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold">Drive appData files</h1>
          <a href="/" className="text-sm text-zinc-300 hover:text-white">Back</a>
        </header>

        {files.length === 0 ? (
          <div className="text-sm text-zinc-300">No files in appData.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/5 text-zinc-300">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Modified</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">appProperties</th>
                  <th className="px-3 py-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id} className="border-t border-white/10">
                    <td className="px-3 py-2 font-medium text-white">{f.name}</td>
                    <td className="px-3 py-2 text-zinc-300">
                      {f.modifiedTime ? new Date(f.modifiedTime).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-2 text-zinc-300">{f.size ?? "-"}</td>
                    <td className="px-3 py-2 text-zinc-300">
                      {f.appProperties ? (
                        <code className="text-xs bg-white/5 px-2 py-1 rounded">
                          {JSON.stringify(f.appProperties)}
                        </code>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">
                      <code className="text-[11px]">{f.id}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

