"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ClaimLeadButtonProps {
  leadId: number;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export default function ClaimLeadButton({ leadId }: ClaimLeadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleClaim = async () => {
    if (!user?.accessToken) {
      toast.error("Your session has expired. Please sign in again.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/leads/${leadId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      if (!res.ok) throw new Error("Failed to claim lead.");

      toast.success("Lead claimed! Moving to chat...");

      router.push(`/leads/${leadId}`);
      router.refresh();
    } catch (error) {
      toast.error("Could not claim lead. Someone else might have grabbed it!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClaim} 
      disabled={isLoading} 
      className="w-full transition-all"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="mr-2 h-4 w-4" />
      )}
      {isLoading ? "Claiming..." : "Claim Chat"}
    </Button>
  );
}