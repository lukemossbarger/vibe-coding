import { signIn } from "@/auth";

export default async function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-white">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full border-2 border-purple-200">
        <h1 className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Northwestern Dining
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Track your meals and get personalized recommendations
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/menu" });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-300 rounded-2xl font-bold text-gray-700 hover:border-purple-400 hover:shadow-lg transition-all"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
            Sign in with Google
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
