import PostBillForm from "@/components/PostBillForm";

export default function PostPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Post a bill</h1>
        <p className="text-sm text-stone-600">
          Tell us about the bill and where the money should go. First name only — nobody sees your full name.
        </p>
      </div>
      <PostBillForm />
    </div>
  );
}
