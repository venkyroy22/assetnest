"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
}

export const AccordionItem = ({ title, children }: AccordionItemProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-zinc-900/50 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-5 flex items-center justify-between text-left transition-all group"
            >
                <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors flex items-center gap-3 ${isOpen ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isOpen ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-zinc-800'}`} />
                    {title}
                </h4>
                <div className={`text-zinc-600 transition-all duration-300 ${isOpen ? 'rotate-180 text-white' : 'group-hover:text-zinc-400'}`}>
                    <ChevronDown size={16} />
                </div>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[500px] pb-6 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="text-sm text-zinc-500 leading-relaxed font-semibold pr-12">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const Accordion = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="w-full bg-zinc-950/30 border border-zinc-900/50 rounded-[2rem] px-8 divide-y divide-zinc-900/50">
            {children}
        </div>
    );
};
