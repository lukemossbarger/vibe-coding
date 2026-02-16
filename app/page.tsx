import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">
          Northwestern Dining Hall Meal Finder
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Find the perfect meal based on your nutrition goals
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/menu"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Explore Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
