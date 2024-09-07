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

export function SelectMetric() {
    return (
        <Select>
            <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectItem value="pfe">PFE</SelectItem>
                    <SelectItem value="pnl">PnL</SelectItem>
                    <SelectItem value="cva">CVA</SelectItem>
                    <SelectItem value="mtm">MTM</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
