import Link from "next/link";
import { NO_PERMISSION } from "@/lib/permissions";

export default function NoPermission({ backHref }: { backHref: string }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
      <h1 className="text-xl font-bold">Not yours to edit</h1>
      <p className="mt-2 text-sm text-gray-600">{NO_PERMISSION}</p>
      <Link href={backHref} className="mt-6 inline-block rounded bg-navy px-4 py-2 text-sm text-white">
        Go back
      </Link>
    </div>
  );
}
