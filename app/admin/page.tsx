"use client";

import { useEffect, useState } from "react";

const CATEGORIES = [
  "Premier League",
  "Champions League",
  "La Liga",
  "Europa League",
  "Serie A",
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the "data:image/xxx;base64," prefix — GitHub wants raw base64
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<
    "idle" | "uploading" | "posting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("afm-posting-key");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem("afm-posting-key", token);
  }, [token]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!imageFile) {
      setErrorMsg("Please choose an image.");
      setStatus("error");
      return;
    }

    try {
      setStatus("uploading");
      const contentBase64 = await fileToBase64(imageFile);
      const uploadRes = await fetch("/api/upload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-token": token,
        },
        body: JSON.stringify({ filename: imageFile.name, contentBase64 }),
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error || "Image upload failed");
      }
      const { url: imageUrl } = await uploadRes.json();

      setStatus("posting");
      const postRes = await fetch("/api/create-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-token": token,
        },
        body: JSON.stringify({
          title,
          excerpt,
          image: imageUrl,
          category,
          content: body,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!postRes.ok) {
        const data = await postRes.json().catch(() => ({}));
        throw new Error(data.error || "Post failed");
      }

      setStatus("success");
      setTitle("");
      setExcerpt("");
      setImageFile(null);
      setImagePreview(null);
      setTags("");
      setBody("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  const inputClass =
    "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-afh-green";

  const busy = status === "uploading" || status === "posting";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-2xl font-black">New Post</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Posting key
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Your CREATE_POST_TOKEN"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Excerpt
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
            className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-afh-green file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white`}
          />
          {imagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-3 max-h-48 rounded-md border border-neutral-200 dark:border-neutral-800 object-cover"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Super Eagles, transfers"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-neutral-500">
            Body (Markdown — use ## for subheadings, &gt; for quotes)
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            required
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="self-start rounded-md bg-afh-green px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {status === "uploading"
            ? "Uploading image…"
            : status === "posting"
            ? "Publishing…"
            : "Publish"}
        </button>

        {status === "success" && (
          <p className="text-sm text-afh-green">
            Published — it&apos;ll be live in a minute or two once Vercel
            rebuilds.
          </p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-500">Error: {errorMsg}</p>
        )}
      </form>
    </div>
  );
}
