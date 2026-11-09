import MyLuvsList from "@/components/MyLuvsList";

export default function MePage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">My luvs 💗</h1>
        <p className="text-sm text-stone-600">Every bill you&apos;ve helped with, on this device.</p>
      </div>
      <MyLuvsList />
    </div>
  );
}
