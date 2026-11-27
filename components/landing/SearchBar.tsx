"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, MapPin, Search } from "lucide-react";
import type { PublicCategory } from "@/lib/categories";

const cities = ["همه شهرها (و آنلاین)", "تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "آنلاین"];
const ALL_TOPICS = "همه موضوعات";

function Select({
  icon: Icon,
  options,
  label,
  value,
  onChange,
}: {
  icon: typeof MapPin;
  options: string[];
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-1">
      <Icon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <div className="relative min-w-0">
        <select
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full cursor-pointer appearance-none truncate bg-transparent py-2 ps-0 pe-5 text-sm font-semibold text-slate-700 focus:outline-none dark:text-slate-300"
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute end-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * The hero's search field.
 *
 * It hands the query, the city and the topic to the real browse page
 * (`/events`), which reads them from the URL — so a search here ends up in
 * the list of published events with its filters applied. Topics are the
 * visible rows of the `Category` table, passed down from the server, so a
 * category added or hidden in the console shows up here too.
 */
export default function SearchBar({ categories }: { categories: PublicCategory[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(cities[0]);
  const topics = [ALL_TOPICS, ...categories.map((category) => category.name)];
  const [topic, setTopic] = useState(topics[0]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (!city.startsWith("همه")) params.set("city", city);
    if (topic !== ALL_TOPICS) params.set("category", topic);

    const search = params.toString();
    router.push(search ? `/events?${search}` : "/events");
  }

  return (
    <form
      id="hero-search"
      role="search"
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-4xl scroll-mt-32 flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-blue-500/5 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:gap-3"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
        <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="عنوان رویداد، نام مدرس یا موضوع..."
          aria-label="جستجوی رویداد"
          className="w-full bg-transparent py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-700" />
      <Select
        icon={MapPin}
        options={cities}
        label="انتخاب شهر"
        value={city}
        onChange={setCity}
      />

      <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-700" />
      <Select
        icon={LayoutGrid}
        options={topics}
        label="انتخاب موضوع"
        value={topic}
        onChange={setTopic}
      />

      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] sm:py-2.5"
      >
        <Search className="h-4 w-4" />
        جستجو
      </button>
    </form>
  );
}
