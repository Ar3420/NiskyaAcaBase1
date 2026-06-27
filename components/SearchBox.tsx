import { Search } from "lucide-react";

export function SearchBox({ large = false }: { large?: boolean }) {
  return (
    <form
      action="/search"
      className={`mx-auto flex w-full max-w-3xl items-center gap-3 rounded border border-line bg-white px-4 shadow-sm ${
        large ? "py-4" : "py-2"
      }`}
    >
      <Search className="h-5 w-5 text-muted" aria-hidden="true" />
      <input
        name="q"
        placeholder="Search the academic database"
        className={`${large ? "text-lg" : "text-sm"} w-full bg-transparent outline-none`}
      />
      <button className="rounded border border-nisky px-4 py-2 text-sm font-medium text-nisky hover:bg-nisky hover:text-white">
        Search
      </button>
    </form>
  );
}
