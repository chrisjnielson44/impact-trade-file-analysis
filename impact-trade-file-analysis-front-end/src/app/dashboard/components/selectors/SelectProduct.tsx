import * as React from "react"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function SelectProduct() {
    return (
        <Select>
            <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select Product" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectItem value="fx">FX</SelectItem>
                    <SelectItem value="ir">IR</SelectItem>
                    <SelectItem value="commod">Commodities</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="futures">Futures</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
