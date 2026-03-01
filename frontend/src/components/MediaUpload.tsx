import type { ChangeEvent } from "react";
import { toast } from "react-toastify";

export default function MediaUpload({ onUpload }: { onUpload: (file: File) => void }) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
        toast.error("Only images/videos allowed");
        return;
      }
      onUpload(f);
    }
  };

  return (
    <input type="file" accept="image/*,video/*" onChange={handleChange} />
  );
}