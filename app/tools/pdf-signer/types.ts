export interface Signature {
    id: string;
    type: "signature" | "initials" | "text" | "date" | "checkmark" | "stamp";
    dataUrl?: string; // for image-based (sig, initials)
    content?: string; // for text, date, stamp
    color?: string;   // hex color for text-based annotations
    fontFamily?: string;
    fontWeight?: "normal" | "bold";
    fontStyle?: "normal" | "italic" | "oblique";
    textDecoration?: "none" | "underline";
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    allPages: boolean;
}

export interface LibraryItem {
    id: string;
    dataUrl: string;
    label: string;
    createdAt: number;
}
