import { auth, signOut } from "@/auth";

export async function UserMenu() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {session.user.image && (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-8 h-8 rounded-full border-2 border-purple-200"
          />
        )}
        <span className="hidden sm:inline text-sm font-medium text-gray-700">
          {session.user.name || session.user.email}
        </span>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/auth/signin" });
        }}
      >
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}
