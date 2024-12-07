1  'use client'
2  
3  import { Input } from "@/components/ui/input"
4  import { Label } from "@/components/ui/label"
5  
6  interface SizeSelectorProps {
7    value: string;
8    onChange: (value: string) => void;
9  }
10 
11 export function SizeSelector({ value, onChange }: SizeSelectorProps) {
12   return (
13     <div className="space-y-1">
14       <Input
15         value={value}
16         onChange={(e) => onChange(e.target.value)}
17         placeholder="Enter size (e.g., M, L, UK 10, 32x30)"
18         className="max-w-xs"
19       />
20       <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">
21         Enter the size as shown on the item's label
22       </p>
23     </div>
24   )
25 }