import { Loader2 } from "lucide-react";

export default function LoadingPage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Loader2 className="animate-spin" size={48} color="white" />
    </div>
  );
}
