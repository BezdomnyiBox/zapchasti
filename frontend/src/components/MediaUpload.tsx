import type { ChangeEvent } from "react";
import { toast } from "react-toastify";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];

export default function MediaUpload({ onUpload }: { onUpload: (file: File) => void }) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error("Допустимы только JPEG, PNG, WebP, MP4, WebM");
        return;
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`Файл слишком большой (макс. ${MAX_FILE_SIZE_MB} МБ)`);
        return;
      }
      onUpload(f);
    }
  };

  return (
    <input type="file" accept=".jpg,.jpeg,.png,.webp,.mp4,.webm" onChange={handleChange} />
  );
}