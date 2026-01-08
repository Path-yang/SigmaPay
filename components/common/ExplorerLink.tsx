import { ExternalLink } from "lucide-react";
import { getExplorerTxLink, getExplorerAccountLink } from "@/lib/xrpl/constants";

interface ExplorerLinkProps {
    type: "transaction" | "account";
    value: string;
    label?: string;
    className?: string;
}

export function ExplorerLink({ type, value, label, className = "" }: ExplorerLinkProps) {
    const href = type === "transaction"
        ? getExplorerTxLink(value)
        : getExplorerAccountLink(value);

    const displayLabel = label || (type === "transaction" ? "View Transaction" : "View Account");

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors ${className}`}
        >
            {displayLabel}
            <ExternalLink className="w-3 h-3" />
        </a>
    );
}
