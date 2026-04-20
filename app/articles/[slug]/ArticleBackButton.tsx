"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ArticleBackButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function ArticleBackButton({ className, children }: ArticleBackButtonProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use window.history to check if we can go back
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/articles');
    }
  };

  return (
    <button
      onClick={handleBack}
      className={className}
    >
      {children || (
        <>
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Articles
        </>
      )}
    </button>
  );
}
